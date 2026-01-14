"""
Record a speech utterance using energy-based VAD (voice activity detection).
Saves the result as a .wav file

Behavior:
- Continuously read audio from the microphone in blocks.
- When RMS energy crosses a threshold, speech starts and begins buffering audio.
- While speaking: keep buffering.
- When RMS stays below threshold for N consecutive blocks, speech ends, stop and write .wav file.
"""

from __future__ import annotations

import queue
import time
from dataclasses import dataclass
from typing import Iterator, Tuple, Optional, List

import numpy as np
import sounddevice as sd
import soundfile as sf


# Hardware specific constants
MIC_NAME = "LavMicro"
SAMPLE_RATE = 48000

# Blocksize controls latency and VAD responsiveness.
# 1024 @ 48kHz ~ 21.3ms per block of audio
BLOCKSIZE = 1024

# Energy threshold for speech detection, can be tuned up/down for sensitivity
# started with 0.008, seemed too sensitive.  This will be partially dependent on environment.
ENERGY_THRESHOLD = 0.015

# How long we require silence before ending an utterance.
# With 1024 blocksize @ 48kHz => 21.3ms/block.
# 25 blocks ~ 0.53s of silence.
# started with 25, was much too short.  May be better to further increase this duration and give
# the user an option to end their speech manually to ensure they aren't cut off in the middle.
SILENCE_BLOCKS = 100

# Capture short amount of audio before speech starts to avoid clipping.
# 10 blocks ~ 213ms
PRE_ROLL_BLOCKS = 10

# Ignore very short segments that likely are not speech
MIN_UTTERANCE_SECONDS = 0.3

OUTPUT_FILENAME = "mic-output.wav"


# Define an AudioBlock datatype
AudioBlock = Tuple[np.ndarray, int]  # (mono float32 samples, samplerate)


def get_device(mic_name: str) -> int:
    """
    Return the device index of the first input-capable audio device
    whose name contains mic_name (case-insensitive).

    Raises:
        RuntimeError if no matching input device is found.
    """
    mic_name_l = mic_name.lower()
    matches: List[Tuple[int, str]] = []

    for index, device in enumerate(sd.query_devices()):
        name = str(device["name"]).lower()
        if mic_name_l in name and int(device["max_input_channels"]) > 0:
            matches.append((index, str(device["name"])))
            print(f"found mic: {device['name']} (index={index})")

    if not matches:
        raise RuntimeError(f"No input device matching '{mic_name}' found")

    if len(matches) > 1:
        print("Warning: multiple matching microphones found:")
        for idx, name in matches:
            print(f"  {idx}: {name}")
        print(f"Using first match: {matches[0][0]}")

    return matches[0][0]


def microphone_audio_source(device: int, samplerate: int, blocksize: int) -> Iterator[AudioBlock]:
    """
    Generator that yields (block, samplerate) from a microphone.

    Each block is:
      - float32
      - shape (blocksize,) (mono)
      - values typically in [-1.0, 1.0]
    """
    q: queue.Queue[np.ndarray] = queue.Queue()

    def callback(indata: np.ndarray, frames: int, time_info, status) -> None:
        if status:
            # xruns / overflow warnings appear here
            print(status)
        # copy to detach from PortAudio buffer
        q.put(indata.copy())

    with sd.InputStream(device=device, samplerate=samplerate, blocksize=blocksize, channels=1, dtype="float32", callback=callback):
        while True:
            block_2d = q.get()          # shape: (frames, 1)
            block_1d = block_2d[:, 0]   # flatten to mono
            yield block_1d, samplerate


@dataclass
class VadConfig:
    energy_threshold: float
    silence_blocks: int
    pre_roll_blocks: int
    min_utterance_seconds: float


def record_utterance(source: Iterator[AudioBlock], cfg: VadConfig) -> AudioBlock:
    """
    Consume audio from audio source (microphone) until complete utterance is detected.
    Returns (utterance_audio, samplerate).

    VAD logic (state machine):
      - Maintain a rolling pre-roll buffer of the last N blocks.
      - WAITING: ignore blocks until RMS > threshold (speech start).
      - SPEAKING: keep buffering blocks; count consecutive silent blocks.
      - When silent blocks >= cfg.silence_blocks: finalize utterance and return.
    """
    pre_roll: List[np.ndarray] = []
    utterance_blocks: List[np.ndarray] = []

    speaking = False
    silent_count = 0

    for block, sr in source:
        # RMS energy as a simple equivalent to loudness 
        rms = float(np.sqrt(np.mean(block * block)))

        # Maintain pre-roll audio blocks in a buffer
        pre_roll.append(block)
        if len(pre_roll) > cfg.pre_roll_blocks:
            pre_roll.pop(0)

        if not speaking:
            # Waiting for speech
            if rms > cfg.energy_threshold:
                speaking = True
                silent_count = 0
                print("speech started")

                # Include pre-roll so we don't clip the first syllable
                utterance_blocks.extend(pre_roll)
                pre_roll.clear()

                utterance_blocks.append(block)

        else:
            # Speaking, keep buffering and look for end-of-speech
            utterance_blocks.append(block)

            if rms > cfg.energy_threshold:
                silent_count = 0
            else:
                silent_count += 1

                if silent_count >= cfg.silence_blocks:
                    print("speech ended")
                    audio = np.concatenate(utterance_blocks)

                    # Drop segments that are too short
                    if len(audio) / sr < cfg.min_utterance_seconds:
                        print("segment too short; waiting for next utterance")
                        # Reset and keep listening for a real utterance
                        pre_roll.clear()
                        utterance_blocks.clear()
                        speaking = False
                        silent_count = 0
                        continue

                    return audio, sr

    # Should never reach this unless an error occurs.
    raise RuntimeError("Audio source ended unexpectedly")


def main() -> None:
    device_index = get_device(MIC_NAME)

    source = microphone_audio_source(device=device_index, samplerate=SAMPLE_RATE, blocksize=BLOCKSIZE)

    cfg = VadConfig(
        energy_threshold=ENERGY_THRESHOLD,
        silence_blocks=SILENCE_BLOCKS,
        pre_roll_blocks=PRE_ROLL_BLOCKS,
        min_utterance_seconds=MIN_UTTERANCE_SECONDS,
    )

    print("EVENT:MIC_STARTED", flush=True)
    utterance, sr = record_utterance(source, cfg)
    print("EVENT:MIC_STOPPED", flush=True)

    sf.write(OUTPUT_FILENAME, utterance, sr)
    print(f"Saved: {OUTPUT_FILENAME} ({len(utterance)/sr:.2f}s @ {sr} Hz)")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nExiting.")

