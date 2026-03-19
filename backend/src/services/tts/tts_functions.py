import time
import os
import atexit
import numpy as np
import pyaudio
from pocket_tts import TTSModel
import torch

PREBUFFER_CHUNKS = 1

tts_model = None
voice_state = None


class AudioStreamManager:
    """
    Manages a persistent PyAudio stream to avoid repeated open/close cycles.
    The stream remains open between speak_text calls and is only recreated
    if the sample rate changes or the stream becomes invalid.
    """

    def __init__(self):
        self._pyaudio: pyaudio.PyAudio | None = None
        self._stream: pyaudio.Stream | None = None
        self._current_sample_rate: int | None = None

    def _ensure_pyaudio(self):
        if self._pyaudio is None:
            self._pyaudio = pyaudio.PyAudio()

    def _is_stream_valid(self) -> bool:
        if self._stream is None:
            return False
        try:
            return self._stream.is_active() or not self._stream.is_stopped()
        except Exception:
            return False

    def get_stream(self, sample_rate: int) -> pyaudio.Stream:
        self._ensure_pyaudio()

        if self._stream is not None and self._current_sample_rate == sample_rate:
            if self._is_stream_valid():
                if self._stream.is_stopped():
                    self._stream.start_stream()
                return self._stream
            else:
                self._close_stream()

        if self._current_sample_rate != sample_rate:
            self._close_stream()

        self._stream = self._pyaudio.open(
            format=pyaudio.paInt16,
            channels=1,
            rate=sample_rate,
            output=True,
        )
        self._current_sample_rate = sample_rate
        return self._stream

    def _close_stream(self):
        if self._stream is not None:
            try:
                if not self._stream.is_stopped():
                    self._stream.stop_stream()
                self._stream.close()
            except Exception:
                pass
            self._stream = None

    def drain_and_pause(self):
        """Call after finishing playback to let the buffer drain, then pause."""
        if self._stream is not None:
            try:
                time.sleep(0.05)
                if not self._stream.is_stopped():
                    self._stream.stop_stream()
            except Exception:
                pass

    def shutdown(self):
        """Clean up all resources. Called on application exit."""
        self._close_stream()
        if self._pyaudio is not None:
            try:
                self._pyaudio.terminate()
            except Exception:
                pass
            self._pyaudio = None
        self._current_sample_rate = None


_audio_manager = AudioStreamManager()
atexit.register(_audio_manager.shutdown)


def _resolve_runtime_device() -> torch.device:
    requested_device = os.getenv("TTS_DEVICE", "cuda").strip().lower()
    if requested_device not in {"cuda", "cpu"}:
        print(
            f"Unsupported TTS_DEVICE='{requested_device}'. Falling back to 'cuda'.",
            flush=True,
        )
        requested_device = "cuda"

    if requested_device == "cuda" and not torch.cuda.is_available():
        print("CUDA requested but unavailable. Falling back to CPU.", flush=True)
        requested_device = "cpu"

    return torch.device(requested_device)


def _move_model_state_to_device(model_state: dict, device: torch.device) -> dict:
    for _, module_state in model_state.items():
        if not isinstance(module_state, dict):
            continue

        for key, value in module_state.items():
            if isinstance(value, torch.Tensor):
                module_state[key] = value.to(device)
    return model_state


def _load_model(personality_id):
    # Load the TTS model and voice state globally.
    global tts_model, voice_state
    # Always resolve the desired runtime device first.
    device = _resolve_runtime_device()

    # Load the model if it isn't already loaded.
    if tts_model is None:
        print("Loading Kyutai Pocket TTS model...", flush=True)
        print(f"Torch CUDA available: {torch.cuda.is_available()}", flush=True)

        if device.type == "cuda":
            print(f"Using CUDA device: {torch.cuda.get_device_name(0)}", flush=True)
        else:
            print("Using CPU for TTS inference.", flush=True)

        tts_model = TTSModel.load_model().to(device)
        tts_model.eval()
        print(f"TTS model runtime device: {tts_model.device}", flush=True)
    else:
        # Ensure model is on the requested device (no-op if already there).
        try:
            tts_model = tts_model.to(device)
        except Exception:
            pass

    # voice name for each personality_id.
    if personality_id == '1':
        voice_name = 'alba'
    elif personality_id == '2':
        voice_name = 'cosette'
    elif personality_id == '3':
        voice_name = 'marius'
    elif personality_id == '5':
        voice_name = 'azelma'
    else:
        voice_name = 'alba'

    print(f"Getting voice state for '{voice_name}'", flush=True)
    voice_state = tts_model.get_state_for_audio_prompt(voice_name)
    voice_state = _move_model_state_to_device(voice_state, device)

    print("Voice state loaded.", flush=True)


def _write_audio_chunk(stream, audio: np.ndarray):
    audio_int16 = (audio * 32767).astype(np.int16)
    stream.write(audio_int16.tobytes())


def speak_text(text: str, personality_id: str):
    if not text or not text.strip():
        return

    _load_model(personality_id)

    start_time = time.monotonic()

    print("Streaming TTS")

    chunks = tts_model.generate_audio_stream(voice_state, text, copy_state=True)
    buffer = []

    for _ in range(PREBUFFER_CHUNKS):
        try:
            buffer.append(next(chunks))
        except StopIteration:
            break

    stream = _audio_manager.get_stream(tts_model.sample_rate)

    chunk_count = 0

    try:
        for chunk in buffer:
            audio = chunk.detach().cpu().numpy()
            _write_audio_chunk(stream, audio)
            chunk_count += 1

        for chunk in chunks:
            audio = chunk.detach().cpu().numpy()
            _write_audio_chunk(stream, audio)
            chunk_count += 1
    finally:
        _audio_manager.drain_and_pause()

    generation_done = time.monotonic()
    print(f"TTS streaming completed in {generation_done - start_time:.2f}s ({chunk_count} chunks)")
