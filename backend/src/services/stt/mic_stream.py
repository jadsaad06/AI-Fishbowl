"""
https://people.csail.mit.edu/hubert/pyaudio/docs/
We will be using PyAudio in order to get a stream of audio from
our USB microphone that we can then use with the Google STT API.

https://docs.cloud.google.com/speech-to-text/docs/v1/optimizing-audio-files-for-speech-to-text
^TLDR use 16-bit formatting or paInt16

https://docs.cloud.google.com/speech-to-text/docs/best-practices
^TLDR use a 100-millisecond frame size
"""

import math
import sys
from array import array
from collections import deque

import pyaudio


def _iter_input_devices(audio_interface):
    num_devices = audio_interface.get_device_count()
    for i in range(0, num_devices):
        info = audio_interface.get_device_info_by_index(i)
        if info.get("maxInputChannels", 0) > 0:
            yield i, info


def find_input_device_index(name_contains, audio_interface):
    if not name_contains:
        raise ValueError("name_contains must be a non-empty string")

    name_lower = name_contains.lower()
    matches = []

    for i, info in _iter_input_devices(audio_interface):
        device_name = str(info.get("name", ""))
        if name_lower in device_name.lower():
            channels = int(info.get("maxInputChannels") or 0)
            matches.append((i, device_name, channels))

    if not matches:
        available = ", ".join(
            f"{i}: {info.get('name', '')}" for i, info in _iter_input_devices(audio_interface)
        )
        raise ValueError(
            f'No input devices match "{name_contains}". Available inputs: {available}'
        )

    exact = [match for match in matches if match[1].lower() == name_lower]
    if exact:
        matches = exact

    matches.sort(key=lambda m: (-m[2], m[0]))
    return matches[0][0]


class MicrophoneStream:
    def __init__(
        self,
        index=None,
        name_contains=None,
        chunk_duration_ms=100,
        vad_enabled=False,
        vad_energy_threshold=500,
        vad_speech_ms=200,
        vad_silence_ms=600,
        vad_pre_speech_ms=200,
        vad_keepalive=False,
        vad_keepalive_ms=1000,
    ):
        # chunk_duration_ms is in milliseconds (100ms recommended by Google)
        self.chunk_duration_ms = chunk_duration_ms
        self.format = pyaudio.paInt16                   # Recommended by Google

        self.audio_interface = pyaudio.PyAudio()        # Initialize PyAudio

        try:
            if index is None and name_contains:
                index = find_input_device_index(name_contains, self.audio_interface)
            if index is None:
                raise ValueError("MicrophoneStream requires an index or name_contains")

            self.index = index

            # Pull hardware specs of mic by index
            info = self.audio_interface.get_device_info_by_index(self.index)
            self.device_name = str(info.get("name", ""))
            self.rate = int(info.get("defaultSampleRate"))
            self.channels = int(info.get("maxInputChannels"))
        except Exception:
            self.audio_interface.terminate()
            raise

        # Calculate chunk size based on chunk duration (ms)
        # Rate (samples/sec) * (ms / 1000) = samples per chunk
        self.chunk = int(self.rate * (self.chunk_duration_ms / 1000))
        self.sample_width = int(self.audio_interface.get_sample_size(self.format))

        # VAD config (simple energy-based)
        self.vad_enabled = bool(vad_enabled)
        self.vad_energy_threshold = int(vad_energy_threshold)
        self.vad_speech_ms = int(vad_speech_ms)
        self.vad_silence_ms = int(vad_silence_ms)
        self.vad_pre_speech_ms = int(vad_pre_speech_ms)

        self._vad_speech_chunks = max(
            1, int(math.ceil(self.vad_speech_ms / self.chunk_duration_ms))
        )
        self._vad_silence_chunks = max(
            1, int(math.ceil(self.vad_silence_ms / self.chunk_duration_ms))
        )
        self._vad_pre_speech_chunks = max(
            0, int(math.ceil(self.vad_pre_speech_ms / self.chunk_duration_ms))
        )
        self.vad_keepalive = bool(vad_keepalive)
        self.vad_keepalive_ms = int(vad_keepalive_ms)
        self._vad_keepalive_chunks = max(
            1, int(math.ceil(self.vad_keepalive_ms / self.chunk_duration_ms))
        )
        self._silence_chunk = b"\x00" * (self.chunk * self.sample_width * self.channels)

        self.stream = None

    def __enter__(self):
        self.stream = self.audio_interface.open(    # Open the stream
            format=self.format,
            channels=self.channels,
            rate=self.rate,
            input=True,
            input_device_index=self.index,
            frames_per_buffer=self.chunk,
        )
        return self

    def __exit__(self, type, value, traceback):   # Close the stream
        if self.stream:
            self.stream.stop_stream()
            self.stream.close()
        self.audio_interface.terminate()

    def generator(self):    # Infinite loop to get audio chunks for STT
        if not self.vad_enabled:
            while True:
                # you need exception_on_overflow=False for live Windows/Mac streams
                data = self.stream.read(self.chunk, exception_on_overflow=False)
                if not data:    # If no data is comes through, break the loop
                    break
                yield data
            return

        pre_buffer = (
            deque(maxlen=self._vad_pre_speech_chunks)
            if self._vad_pre_speech_chunks > 0
            else None
        )
        speech_count = 0
        silence_count = 0
        speaking = False
        keepalive_count = 0

        while True:
            data = self.stream.read(self.chunk, exception_on_overflow=False)
            if not data:
                break

            rms = _rms(data, self.sample_width)
            is_speech = rms >= self.vad_energy_threshold

            if speaking:
                keepalive_count = 0
                if is_speech:
                    silence_count = 0
                    yield data
                else:
                    silence_count += 1
                    if silence_count <= self._vad_silence_chunks:
                        yield data  # short hangover to avoid clipping ends
                    else:
                        speaking = False
                        speech_count = 0
                        print("EVENT:MIC_STOPPED", flush=True)
                        if pre_buffer is not None:
                            pre_buffer.clear()
            else:
                if pre_buffer is not None:
                    pre_buffer.append(data)

                if is_speech:
                    speech_count += 1
                    if speech_count >= self._vad_speech_chunks:
                        speaking = True
                        print("EVENT:MIC_STARTED", flush=True)
                        silence_count = 0
                        keepalive_count = 0
                        if pre_buffer is not None:
                            for chunk in pre_buffer:
                                yield chunk
                            pre_buffer.clear()
                        else:
                            yield data
                else:
                    speech_count = 0
                    if self.vad_keepalive:
                        keepalive_count += 1
                    if keepalive_count >= self._vad_keepalive_chunks:
                        keepalive_count = 0
                        yield self._silence_chunk


def _rms(data, sample_width):
    """Compute RMS of raw PCM data without audioop (Py3.12+ compatible)."""
    if not data:
        return 0

    remainder = len(data) % sample_width
    if remainder:
        data = data[:-remainder]
        if not data:
            return 0

    if sample_width == 1:
        # 8-bit PCM is unsigned (0..255); center to signed values.
        samples = array("B")
        samples.frombytes(data)
        if not samples:
            return 0
        total = 0
        for s in samples:
            v = s - 128
            total += v * v
        return int(math.sqrt(total / len(samples)))

    if sample_width == 2:
        # 16-bit PCM is signed little-endian.
        samples = array("h")
        samples.frombytes(data)
        if sys.byteorder != "little":
            samples.byteswap()
        if not samples:
            return 0
        total = 0
        for s in samples:
            total += s * s
        return int(math.sqrt(total / len(samples)))

    if sample_width == 4:
        # 32-bit PCM is signed little-endian.
        samples = array("i")
        if samples.itemsize != 4:
            raise ValueError("Unsupported 32-bit PCM on this platform")
        samples.frombytes(data)
        if sys.byteorder != "little":
            samples.byteswap()
        if not samples:
            return 0
        total = 0
        for s in samples:
            total += s * s
        return int(math.sqrt(total / len(samples)))

    raise ValueError(f"Unsupported sample width: {sample_width}")
