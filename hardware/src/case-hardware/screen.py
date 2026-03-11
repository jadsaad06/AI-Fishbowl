#!/usr/bin/env python3
# coding=utf-8
import time
import os
import sys
import signal
import Adafruit_SSD1306 as SSD

from PIL import Image
from PIL import ImageDraw
from PIL import ImageFont

import subprocess

I2C_BUS=7


# V1.0.10
class OLED:
    def __init__(self, i2c_bus=I2C_BUS, clear=False, debug=False):
        self.__debug = debug
        self.__i2c_bus = i2c_bus
        self.__clear = clear
        self.__top = -2
        self.__x = 0

        self.__total_last = 0
        self.__idle_last = 0
        self.__str_CPU = "CPU:0%"

        self.__WIDTH = 128
        self.__HEIGHT = 32
        self.__image = Image.new('1', (self.__WIDTH, self.__HEIGHT))
        self.__draw = ImageDraw.Draw(self.__image)
        self.__font = ImageFont.load_default()
        self.__resource_screen_duration = 5.0
        self.__creator_screen_duration = 4.0
        self.__creator_screens = [
            ("Hardware/Backend", "Daniel Schuster"),
            ("Text-to-Speech", "Henry McDowell"),
            ("Team Lead", "Jad Saad"),
            ("Speech-to-Text", "Joseph Bec"),
            ("LLM/Agent", "Michel Karam"),
            ("Frontend/UI", "Satvik Mudgal"),
            ("Backend/Testing", "Sal Ambriz"),
        ]

    def __del__(self):
        self.clear(True)
        if self.__debug:
            print("---OLED-DEL---")

    # Initialize OLED, return True on success, False on failure
    def begin(self):
        try:
            self.__oled = SSD.SSD1306_128_32(
                rst=None, i2c_bus=self.__i2c_bus, gpio=1)
            self.__oled.begin()
            self.__oled.clear()
            self.__oled.display()
            if self.__debug:
                print("---OLED begin ok!---")
            return True
        except:
            if self.__debug:
                print("---OLED not found!---")
            return False

    # Clear the display.  Refresh =True Refresh immediately, refresh=False refresh not
    def clear(self, refresh=False):
        self.__draw.rectangle(
            (0, 0, self.__WIDTH, self.__HEIGHT), outline=0, fill=0)
        if refresh:
            try:
                self.refresh()
                return True
            except:
                return False

    # Add characters.  Start_x Start_y indicates the starting point.  Text is the character to be added
    # Refresh =True Refresh immediately, refresh=False refresh not
    def add_text(self, start_x, start_y, text, refresh=False):
        if start_x > self.__WIDTH or start_x < 0 or start_y < 0 or start_y > self.__HEIGHT:
            if self.__debug:
                print("oled text: x, y input error!")
            return
        x = int(start_x + self.__x)
        y = int(start_y + self.__top)
        self.__draw.text((x, y), str(text), font=self.__font, fill=255)
        if refresh:
            self.refresh()

    # line=[1, 4]
    # Write a line of character text.  Refresh =True Refresh immediately, refresh=False refresh not.
    def add_line(self, text, line=1, refresh=False):
        if line < 1 or line > 4:
            if self.__debug:
                print("oled line input error!")
            return
        y = int(8 * (line - 1))
        self.add_text(0, y, text, refresh)

    # Refresh the OLED to display the content
    def refresh(self):
        self.__oled.image(self.__image)
        self.__oled.display()


    # Read the CPU usage rate
    def getCPULoadRate(self, index):
        count = 10
        if index == 0:
            f1 = os.popen("cat /proc/stat", 'r')
            stat1 = f1.readline()
            data_1 = []
            for i in range(count):
                data_1.append(int(stat1.split(' ')[i+2]))
            self.__total_last = data_1[0]+data_1[1]+data_1[2]+data_1[3] + \
                data_1[4]+data_1[5]+data_1[6]+data_1[7]+data_1[8]+data_1[9]
            self.__idle_last = data_1[3]
        elif index == 4:
            f2 = os.popen("cat /proc/stat", 'r')
            stat2 = f2.readline()
            data_2 = []
            for i in range(count):
                data_2.append(int(stat2.split(' ')[i+2]))
            total_now = data_2[0]+data_2[1]+data_2[2]+data_2[3] + \
                data_2[4]+data_2[5]+data_2[6]+data_2[7]+data_2[8]+data_2[9]
            idle_now = data_2[3]
            total = int(total_now - self.__total_last)
            idle = int(idle_now - self.__idle_last)
            usage = int(total - idle)
            usageRate = int(float(usage / total) * 100)
            self.__str_CPU = "CPU:" + str(usageRate) + "%"
            self.__total_last = 0
            self.__idle_last = 0
            # if self.__debug:
            #     print(self.__str_CPU)
        return self.__str_CPU

    # Read system time
    def getSystemTime(self):
        cmd = "date +%H:%M:%S"
        date_time = subprocess.check_output(cmd, shell=True)
        str_Time = str(date_time).lstrip('b\'')
        str_Time = str_Time.rstrip('\\n\'')
        # print(date_time)
        return str_Time

    # Read the memory usage and total memory
    def getUsagedRAM(self):
        cmd = "free | awk 'NR==2{printf \"RAM:%2d%%\", 100*($2-$7)/$2}'"
        FreeRam = subprocess.check_output(cmd, shell=True)
        str_FreeRam = str(FreeRam).lstrip('b\'')
        str_FreeRam = str_FreeRam.rstrip('\'')
        return str_FreeRam

    # Read free memory/total memory
    def getFreeRAM(self):
        cmd = "free -h | awk 'NR==2{printf \"RAM: %.1f/%.1fGB \", $7,$2}'"
        FreeRam = subprocess.check_output(cmd, shell=True)
        str_FreeRam = str(FreeRam).lstrip('b\'')
        str_FreeRam = str_FreeRam.rstrip('\'')
        return str_FreeRam

    # Read the TF card space usage/TOTAL TF card space
    def getUsagedDisk(self):
        cmd = "df -h | awk '$NF==\"/\"{printf \"SDC:%s -> %.1fGB\", $5, $2}'"
        Disk = subprocess.check_output(cmd, shell=True)
        str_Disk = str(Disk).lstrip('b\'')
        str_Disk = str_Disk.rstrip('\'')
        return str_Disk

    # Read the free TF card space/total TF card space
    def getFreeDisk(self):
        cmd = "df -h | awk '$NF==\"/\"{printf \"Disk:%.1f/%.1fGB\", $4,$2}'"
        Disk = subprocess.check_output(cmd, shell=True)
        str_Disk = str(Disk).lstrip('b\'')
        str_Disk = str_Disk.rstrip('\'')
        return str_Disk

    # Read the local IP address
    def getLocalIP(self):
        ip = os.popen(
            "/sbin/ifconfig eth0 | grep 'inet' | awk '{print $2}'").read()
        ip = ip[0: ip.find('\n')]
        # ip = ''
        if(ip == '' or len(ip) > 15):
            ip = os.popen(
                "/sbin/ifconfig wlan0 | grep 'inet' | awk '{print $2}'").read()
            ip = ip[0: ip.find('\n')]
            if(ip == ''):
                ip = 'x.x.x.x'
        if len(ip) > 15:
            ip = 'x.x.x.x'
        return ip

    def draw_resource_screen(self, cpu_index, cached_lines):
        str_CPU = self.getCPULoadRate(cpu_index)
        str_Time = "Time: " + self.getSystemTime()

        if cpu_index == 0:
            cached_lines = (
                self.getUsagedRAM(),
            )

        ram_line = cached_lines[0] if len(cached_lines) > 0 else "RAM:--%"

        self.add_line(str_Time, 1)
        self.add_line("", 2)
        self.add_line(str_CPU, 3)
        self.add_line(ram_line, 4)

        cpu_index = cpu_index + 1
        if cpu_index >= 5:
            cpu_index = 0

        return cpu_index, cached_lines

    def draw_creator_screen(self, page_index):
        page = self.__creator_screens[page_index]
        role = page[0] if len(page) > 0 else ""
        creator = page[1] if len(page) > 1 else ""

        self.add_line("Coral  Net ,  Created By:", 1)
        self.add_line("", 2)
        self.add_line(creator, 3)
        self.add_line(role, 4)

    # Oled mainly runs functions that are called in a while loop and can be hot-pluggable
    def main_program(self):
        try:
            cpu_index = 0
            state = self.begin()
            cached_resource_lines = ("RAM:--%",)
            show_creators = False
            creator_page_index = 0
            screen_start = time.monotonic()

            while state:
                self.clear()
                if self.__clear:
                    self.refresh()
                    return True

                elapsed = time.monotonic() - screen_start
                if show_creators and self.__creator_screens:
                    self.draw_creator_screen(creator_page_index)
                    if elapsed >= self.__creator_screen_duration:
                        creator_page_index = creator_page_index + 1
                        screen_start = time.monotonic()
                        if creator_page_index >= len(self.__creator_screens):
                            show_creators = False
                            creator_page_index = 0
                            cpu_index = 0
                else:
                    cpu_index, cached_resource_lines = self.draw_resource_screen(
                        cpu_index, cached_resource_lines)
                    if elapsed >= self.__resource_screen_duration and self.__creator_screens:
                        show_creators = True
                        creator_page_index = 0
                        screen_start = time.monotonic()

                # Display image.
                self.refresh()
                time.sleep(.1)
            return False
        except Exception:
            if self.__debug:
                print("!!!---OLED refresh error---!!!")
            return False

def close_rgb_fan():
    try:
        bus.write_byte_data(0x0E, 0x08, 0)
        time.sleep(.01)
        bus.write_byte_data(0x0E, 0x07, 0)
    except:
        pass


if __name__ == "__main__":
    oled = None
    shutdown_requested = False
    oled_clear = False

    def _handle_shutdown_signal(signum, frame):
        global shutdown_requested
        shutdown_requested = True
        raise KeyboardInterrupt

    signal.signal(signal.SIGINT, _handle_shutdown_signal)
    signal.signal(signal.SIGTERM, _handle_shutdown_signal)
    signal.signal(signal.SIGQUIT, _handle_shutdown_signal)

    try:
        oled_debug = False
        state = False
        if len(sys.argv) > 1:
            if str(sys.argv[1]) == "clear":
                oled_clear = True
            elif str(sys.argv[1]) == "debug":
                oled_debug = True
        oled = OLED(clear=oled_clear, debug=oled_debug)
        try:
            import smbus2
            bus = smbus2.SMBus(7)
            if not oled_clear:
                start = 1    
                bus.write_byte_data(0x0E, 0x08, start)
                time.sleep(.05)
        except:
            pass

        while not shutdown_requested:
            state = oled.main_program()
            oled.clear(True)
            if state:
                print("---OLED CLEARED!---")
                break
            time.sleep(1)
    except KeyboardInterrupt:
        shutdown_requested = True
    finally:
        try:
            if oled is not None:
                oled.clear(True)
        except:
            pass
        try:
            if oled is not None:
                del oled
        except:
            pass
        if oled_clear:
            close_rgb_fan()
        if shutdown_requested:
            print("---Program closed!---")
