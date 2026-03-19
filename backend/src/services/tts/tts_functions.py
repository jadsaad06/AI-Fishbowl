import time
import os
import numpy as np
import pyaudio
from pocket_tts import TTSModel
import torch

PREBUFFER_CHUNKS = 1

tts_model = None
voice_state = None
_pyaudio_instance = None
_output_device_index = None


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


def _find_output_device(p):
    """
    Find a suitable output device.
    - On Windows/Mac: Use system default (usually correct)
    - On Jetson/Linux: Avoid tegra-dlink devices that can cause hangs
    """
    avoid_keywords = ["tegra-dlink", "admaif"]
    preferred_keywords = ["hdmi", "usb", "speaker", "headphone"]
    
    # First, check if the default device is okay
    try:
        default_info = p.get_default_output_device_info()
        default_name = default_info.get("name", "").lower()
        
        # If default is not a problematic device, use it
        if not any(avoid in default_name for avoid in avoid_keywords):
            return None  # None means use default
    except Exception:
        pass
    
    # Default is problematic (tegra-dlink), find an alternative
    device_count = p.get_device_count()
    fallback_device = None
    
    for i in range(device_count):
        try:
            info = p.get_device_info_by_index(i)
            name = info.get("name", "").lower()
            max_output = info.get("maxOutputChannels", 0)
            
            if max_output <= 0:
                continue
            
            # Skip problematic devices
            if any(avoid in name for avoid in avoid_keywords):
                continue
            
            # Prefer HDMI, USB speakers, etc.
            if any(pref in name for pref in preferred_keywords):
                return i
            
            if fallback_device is None:
                fallback_device = i
                
        except Exception:
            continue
    
    return fallback_device


def _get_pyaudio():
    """Get or create a persistent PyAudio instance."""
    global _pyaudio_instance, _output_device_index
    
    if _pyaudio_instance is None:
        _pyaudio_instance = pyaudio.PyAudio()
        _output_device_index = _find_output_device(_pyaudio_instance)
    
    return _pyaudio_instance, _output_device_index


def _play_audio_stream(sample_rate: int):
    p, output_device_index = _get_pyaudio()
    
    stream = p.open(
        format=pyaudio.paInt16,
        channels=1,
        rate=sample_rate,
        output=True,
        output_device_index=output_device_index,
    )
    return stream


def _write_audio_chunk(stream, audio: np.ndarray):
    # Convert float32 [-1, 1] to int16 [-32768, 32767]
    audio_int16 = (audio * 32767).astype(np.int16)
    stream.write(audio_int16.tobytes())


def speak_text(text: str, personality_id: str):
    if not text or not text.strip():
        return

    _load_model(personality_id)

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

    stream = _play_audio_stream(tts_model.sample_rate)

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
        
        # Wait for audio buffer to drain before closing
        time.sleep(0.3)
        
    finally:
        stream.stop_stream()
        stream.close()

    print(f"TTS streaming completed ({chunk_count} chunks)")
    
    # Clear GPU memory on Jetson to prevent buildup
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
