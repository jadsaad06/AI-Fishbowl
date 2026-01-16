"""
https://docs.cloud.google.com/speech-to-text/docs/streaming-recognize
The is the documentation I am referencing. Note that it supports the
transcription of live audio and audio files.

PIPELINE:
Microphone -> PyAudio -> MicrophoneStream -> get_request_stream() -> Google Cloud STT API -> responses_iterator -> Terminal Output
"""

import os
from dotenv import load_dotenv
from google.cloud.speech_v2 import SpeechClient
from google.cloud.speech_v2.types import cloud_speech as cloud_speech_types
from mic_stream import MicrophoneStream

load_dotenv()

PROJECT_ID = os.getenv("GOOGLE_CLOUD_PROJECT")

def get_request_stream(config, mic_gen):
    yield config                                                                                # First yield must be the config request
    for chunk in mic_gen:                                                                       # Then continuously yield audio chunks
        yield cloud_speech_types.StreamingRecognizeRequest(audio=chunk)                         # Wrap each chunk in a StreamingRecognizeRequest

def transcribe_streaming_v2(mic_index=24):
    print("Initializing.\n")
    client = SpeechClient() # Instantiates a client

    try:
        with MicrophoneStream(index=mic_index) as mic:
            print(f"Using: {mic.rate}Hz, {mic.channels} channel(s)")

            recognition_config = cloud_speech_types.RecognitionConfig(                          # Configure speech recognition parameters:
                explicit_decoding_config=cloud_speech_types.ExplicitDecodingConfig(             # - explicit_decoding_config: Manually inputing audio encoding settings
                    encoding=cloud_speech_types.ExplicitDecodingConfig.AudioEncoding.LINEAR16,  # - This is the bitdepth. This is the recommended setting from Google
                    sample_rate_hertz=mic.rate,                                                 # - mic info
                    audio_channel_count=mic.channels,                                           # - more mic info
                ),
                language_codes=["en-US"],                                                       # - language_codes: Specifies what language to recognize
                model="latest_long",                                                            # - model: it complains when I do chirp_3 (the default) so Google told me to use latest_long and it works
            )

            streaming_config = cloud_speech_types.StreamingRecognitionConfig(
                config=recognition_config,                                                      # Setting the config
                streaming_features=cloud_speech_types.StreamingRecognitionFeatures(
                    interim_results=False                                                       # False, if true it'll give us temporary & real-time transcriptions that are subject to change as more audio is processed
                )
            )
            
            config_request = cloud_speech_types.StreamingRecognizeRequest(                      # Same as starter code, package everything into a request object
                recognizer=f"projects/{PROJECT_ID}/locations/global/recognizers/_",             # - recognizer: Path to the Google Cloud recognizer (using default)
                streaming_config=streaming_config,                                              # - streaming_config: The config we just made
            )
            
            responses_iterator = client.streaming_recognize(                                    # This is where stuff happens, we pass the config + mic generator (the input stream) to Google's API
                requests=get_request_stream(config_request, mic.generator())                    # get_request_stream() packages our mic chunks into requests
            )                                                                                   # Google will continuously process audio chunks and send back transcription results

            print("Listening. Press Ctrl+C to stop\n")
            
            # This loop continuously pulls transcription results from Google
            for response in responses_iterator:                                                 # Loop through each response from Google
                if not response.results:                                                        # Skip empty responses (heartbeat packets)
                    continue

                for result in response.results:                                                 # Each response can have multiple results
                    if not result.alternatives:                                                 # Skip if no transcription alternatives
                        continue
                    
                    if result.is_final:                                                         # Only process final results
                        transcript = result.alternatives[0].transcript                          # Get the completed transcription
                        yield transcript                                                        # Return transcript but keep the generator running
    except KeyboardInterrupt:
        print("\n\n* Stopped listening")
        raise                                                                                   # Re-raise
    except Exception as e:
        print(f"\n\nError: {e}")
        raise