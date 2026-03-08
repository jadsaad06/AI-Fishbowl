import time
from CubeNanoLib import CubeNano

I2C_BUS = 7

def main():
    bot = CubeNano(i2c_bus=I2C_BUS)
    #bot.set_RGB_Effect(0) # Turn off the effect
    #bot.set_RGB_Effect(1) # Monochromatic breathing lamp
    #bot.set_RGB_Effect(2) # Marquee
    #bot.set_RGB_Effect(3) # Rainbow lights
    bot.set_RGB_Effect(4) # Dazzle lights
    #bot.set_RGB_Effect(5) # Running water
    #bot.set_RGB_Effect(6) # Circulate the lamp

if __name__ == "__main__":
    main()
