"""
Code provided as third-party software with the Yahboom Jetson Orin Nano case.
Not written by the AI Fishbowl authors
"""

#!/usr/bin/env python3
# coding: utf-8

#!/usr/bin/env python3
#coding: utf-8
import smbus2
import time

# V1.0.1
class CubeNano(object):

    def __init__(self, i2c_bus=7, delay=0.002, debug=False):
        self.__debug = debug
        self.__delay = delay
        self.__i2c_bus = smbus2.SMBus(int(i2c_bus))
        
        self.__Addr = 0x0E
        self.__REG_FAN = 0x08
        self.__REG_RGB_Effect = 0x04
        self.__REG_RGB_Speed = 0x05
        self.__REG_RGB_Color = 0x06

    def __del__(self):
        pass

    # control Fan  start=0 close  start=1 open
    def set_Fan(self, state):
        if state > 0:
            state = 1
        try:
            self.__i2c_bus.write_byte_data(self.__Addr, self.__REG_FAN, state)
            if self.__delay > 0:
                time.sleep(self.__delay)
        except:
            if self.__debug:
                print("---set_Fan Error---")

    # Control RGB light effect:
    # 0 off effect, 1 breathing light, 2 marquee light，3 rainbow light
    # 4 dazzling lights, 5 running water lights，6 Circulation breathing lights
    def set_RGB_Effect(self, effect):
        if effect < 0 or effect > 6:
            effect = 0
        try:
            self.__i2c_bus.write_byte_data(self.__Addr, self.__REG_RGB_Effect, effect)
            if self.__delay > 0:
                time.sleep(self.__delay)
        except:
            if self.__debug:
                print("---set_RGB_Effect Error---")
    
    # Set RGB light effect speed 1-3:1 low speed, 2 medium speed, 3 high speed
    def set_RGB_Speed(self, speed):
        if speed < 1 or speed > 3:
            speed = 1
        try:
            self.__i2c_bus.write_byte_data(self.__Addr, self.__REG_RGB_Speed, speed)
            if self.__delay > 0:
                time.sleep(self.__delay)
        except:
            if self.__debug:
                print("---set_RGB_Speed Error---")

    # Set RGB light effect color 0-6:
    # 0 red, 1 green, 2 blue, 3 yellow, 4 purple, 5 cyan, 6 white
    def set_RGB_Color(self, color):
        if color < 0 or color > 6:
            color = 0
        try:
            self.__i2c_bus.write_byte_data(self.__Addr, self.__REG_RGB_Color, color)
            if self.__delay > 0:
                time.sleep(self.__delay)
        except:
            if self.__debug:
                print("---set_RGB_Color Error---")
    
    # Set the individual RGB light color
    # index indicates the serial number of the lamp bead 0-13, index=255 means to control all lamps; 
    # r stands for red, g stands for green, and b stands for blue
    def set_Single_Color(self, index, r, g, b):
        try:
            # Turn off RGB light effects
            self.__i2c_bus.write_byte_data(self.__Addr, self.__REG_RGB_Effect, 0)
            if self.__delay > 0:
                time.sleep(self.__delay)
            self.__i2c_bus.write_byte_data(self.__Addr, 0x00, int(index)&0xFF)
            if self.__delay > 0:
                time.sleep(self.__delay)
            self.__i2c_bus.write_byte_data(self.__Addr, 0x01, int(r)&0xFF)
            if self.__delay > 0:
                time.sleep(self.__delay)
            self.__i2c_bus.write_byte_data(self.__Addr, 0x02, int(g)&0xFF)
            if self.__delay > 0:
                time.sleep(self.__delay)
            self.__i2c_bus.write_byte_data(self.__Addr, 0x03, int(b)&0xFF)
            if self.__delay > 0:
                time.sleep(self.__delay)
        except:
            if self.__debug:
                print("---set_Single_Color Error---")
    
    # Obtain the firmware version number
    def get_Version(self):
        self.__i2c_bus.write_byte(self.__Addr, 0x00)
        version = self.__i2c_bus.read_byte(self.__Addr)
        return version
