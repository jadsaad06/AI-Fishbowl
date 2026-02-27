import time
import numpy as np
import pyaudio
from pocket_tts import TTSModel
import sys
import torch

tts_model = None
default_voice_state = None

def _load_model():
    #Load the TTS model and voice state globally
    global tts_model, default_voice_state
    
    if tts_model is None: #Only loads if not already loaded
        print("Loading Kyutai Pocket TTS model...", flush=True)

        device = "cuda" if torch.cuda.is_available() else "cpu" #checks if torch is available in cuba, otherwise uses cpu
        print(f"Using device: {device}")

        tts_model = TTSModel.load_model()

        print("Getting voice state for 'alba'", flush=True)

        default_voice_state = tts_model.get_state_for_audio_prompt("alba") #Preset voice for Kyutai
        
        #Moves voice state to device if possible
        for key, value in default_voice_state.items():
            if isinstance(value, torch.Tensor):
                default_voice_state[key] = value.to(device)
        
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

def speak_text(text: str, personality_id: str = None):
    _load_model()

    start_time = time.monotonic()

    print("Streaming TTS")

    chunks = tts_model.generate_audio_stream(default_voice_state, text) #pre-buffer to fix stutter
    buffer = [next(chunks) for _ in range(3)]

    stream, p = _play_audio_stream(tts_model.sample_rate)

    chunk_count = 0

    try:
        for chunk in buffer + list(chunks): #buffer
            audio = chunk.cpu().numpy()
            _write_audio_chunk(stream, audio)
            chunk_count += 1
    finally:
        stream.stop_stream()
        stream.close()
        p.terminate()

    generation_done = time.monotonic()
    print(f"TTS streaming completed in {generation_done - start_time:.2f}s ({chunk_count} chunks)")