import time
import os
import numpy as np
import pyaudio
from pocket_tts import TTSModel
import torch

PREBUFFER_CHUNKS = 1

tts_model = None
voice_state = None


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


def _play_audio_stream(sample_rate: int):
    p = pyaudio.PyAudio()
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=sample_rate,
        output=True,
    )
    return stream, p


def _write_audio_chunk(stream, audio: np.ndarray):
    # Convert float32 [-1, 1] to int16 [-32768, 32767]
    audio_int16 = (audio * 32767).astype(np.int16)
    stream.write(audio_int16.tobytes())


def speak_text(text: str, personality_id: str):
    if not text or not text.strip():
        return

    _load_model(personality_id)

    start_time = time.monotonic()

    print("Streaming TTS")

    # copy_state=True keeps each text chunk independent and avoids premature cutoff on long utterances.
    chunks = tts_model.generate_audio_stream(voice_state, text, copy_state=True)
    buffer = []

    # Buffer only a small number of chunks to smooth playback startup.
    for _ in range(PREBUFFER_CHUNKS):
        try:
            buffer.append(next(chunks))
        except StopIteration:
            break

    stream, p = _play_audio_stream(tts_model.sample_rate)

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
        stream.stop_stream()
        stream.close()
        p.terminate()

    generation_done = time.monotonic()
    print(f"TTS streaming completed in {generation_done - start_time:.2f}s ({chunk_count} chunks)")
