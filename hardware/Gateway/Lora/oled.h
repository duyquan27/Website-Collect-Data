#include <Adafruit_GFX.h>
#include <U8g2lib.h>

#ifdef U8X8_HAVE_HW_SPI
#include <SPI.h>
#endif
#ifdef U8X8_HAVE_HW_I2C
#include <Wire.h>
#endif

U8G2_SH1106_128X64_NONAME_F_HW_I2C u8g2(U8G2_R0, /* reset=*/U8X8_PIN_NONE);

void setupOLED()
{
    u8g2.clearDisplay();
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_unifont_t_symbols);
    u8g2.drawGlyph(3, 15, 0x23f1);
    u8g2.drawFrame(0, 0, 128, 43);
    u8g2.sendBuffer();
}

void displayString(byte x, byte y, String str)
{
    u8g2.setFont(u8g2_font_artosserif8_8u);
    u8g2.drawStr(x, y, str.c_str());
    u8g2.sendBuffer();
}

void displayArt(String location)
{
    u8g2.clearDisplay();
    u8g2.clearBuffer();
    u8g2.setFont(u8g2_font_unifont_t_symbols);
    u8g2.drawGlyph(3, 15, 0x23f1);
    u8g2.drawFrame(0, 0, 128, 43);
    displayString(5, 38, location);
    u8g2.sendBuffer();
}
