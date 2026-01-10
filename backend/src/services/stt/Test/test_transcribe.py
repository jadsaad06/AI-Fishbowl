# test_transcribe.py
from engine import transcribe_streaming_v2


audio_file_path = "Test/test_audio.wav"                 # Path to your test audio file
responses = transcribe_streaming_v2(audio_file_path)    # Call the transcription function

print("\nFull response object:")                        # Print the full response
print(responses)

print("\nComplete transcription:")                      # Print a summary of all transcriptions
full_transcript = ""
for response in responses:
    for result in response.results:
        if result.alternatives:
            full_transcript += result.alternatives[0].transcript + " "

print(full_transcript)