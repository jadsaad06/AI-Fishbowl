"""
This will be a helper program used to identify the correct microphone input.

https://people.csail.mit.edu/hubert/pyaudio/docs/#class-pyaudio-stream

We are specifically using 
get_device_count()
get_device_info_by_index
get_host_api_info_by_index
"""

import pyaudio

p = pyaudio.PyAudio()
num_devices = p.get_device_count() # get the total number of devices (Note that there are duplicates and this includes inputs and outputs)

print(f"{'Index':<5} | {'Host API':<20} | {'Channels':<8} | {'Rate':<10} | {'Name'}") # nice formatting for column headers
print("-" * 80)

for i in range(0, num_devices):
    info = p.get_device_info_by_index(i) # get info for each specific device index (returns a dict)
    
    api_info = p.get_host_api_info_by_index(info.get('hostApi')) # the 'hostApi' key provides an index we can use to get the API name
    api_name = api_info.get('name') # get Host API name (e.g., MME, Windows WASAPI)

    if info.get('maxInputChannels') > 0:                # filter for microphones
        device_name = info.get('name')                  # get the name of the device
        input_channels = info.get('maxInputChannels')   # get the number of input channels
        default_rate = info.get('defaultSampleRate')    # get the default sample rate
        
        print(f"{i:<5} | {api_name:<20} | {input_channels:<8} | {default_rate:<10} | {device_name}") # More formatting 

p.terminate()