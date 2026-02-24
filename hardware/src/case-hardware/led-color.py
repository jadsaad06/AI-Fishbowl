import time
from CubeNanoLib import CubeNano

I2C_BUS = 7

if __name__ ==  '__main__':
    bot = CubeNano(i2c_bus=I2C_BUS)
    while True:
        print("turning off")
        bot.set_RGB_Effect(0) # Turn off the effect for 5 seconds
        time.sleep(5)
        print("to monochrome breathe")
        bot.set_RGB_Effect(1) # Monochromatic breathing lamp for 5 sec
        time.sleep(5)
        print("to marquee")
        bot.set_RGB_Effect(2) # Marquee for 5 seconds
        time.sleep(5)
        print("to rainbow")
        bot.set_RGB_Effect(3) # Rainbow lights for 5 seconds
        time.sleep(5)
        print("to dazzle")
        bot.set_RGB_Effect(4) # Dazzle lights for 5 seconds
        time.sleep(5)
        print("to running water")
        bot.set_RGB_Effect(5) # Running water lamp for 5 seconds
        time.sleep(5)
        print("to circulate")
        bot.set_RGB_Effect(6) # Circulate the lamp for 5 sec
        time.sleep(5)
