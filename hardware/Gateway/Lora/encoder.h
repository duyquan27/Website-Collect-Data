#include <Arduino.h>
#include "oled.h"
#include "lib.h"

#define FONT_SIZE 8;
int phaseA = 10;
int phaseB = 9;
int buttonEncoder = 3;

int charDisplay = 65;
int current;
int initial;
char arr[20];
byte count = 0;

int rowDisplay = 38;
int colDisplay = 5;

unsigned long startPress, stopPress;

void setupEncoder()
{
    pinMode(phaseA, INPUT);
    pinMode(phaseB, INPUT);
    pinMode(buttonEncoder, INPUT_PULLUP);
    initial = digitalRead(phaseA);
}

void readInputFromEncoder(String *location)
{
    displayString(0, 53, "ENTER LOCATION");
    while (1)
    {
        if (digitalRead(buttonEncoder) == 0)
        {
            startPress = millis();
            while (digitalRead(buttonEncoder) == 0)
                ;
            stopPress = millis();
            if (stopPress - startPress > 1000)
            {
                for (int i = 0; i < count; i++)
                {
                    if (int(arr[i]) == 91)
                    {
                        arr[i] = char(32);
                    }
                }
                *location = String(arr);
                return;
            }
            else
            {
                arr[count++] = char(charDisplay);
                colDisplay += FONT_SIZE;
                charDisplay = 91;
                delay(2);
            }
        }
        else
        {
            current = digitalRead(phaseA);
            if (current != initial)
            {
                if (digitalRead(phaseB) != current)
                {
                    charDisplay = (charDisplay == 91) ? 65 : charDisplay + 1;
                }
                else
                {
                    charDisplay = (charDisplay == 65) ? 91 : charDisplay - 1;
                }
                Serial.print("Giá trị: ");
                if (charDisplay == 91)
                {
                    displayString(colDisplay, rowDisplay, String(char(32)));
                }
                else
                {
                    displayString(colDisplay, rowDisplay, String(char(charDisplay)));
                }
            }
            initial = current;
        }
        Serial.println("loop");
    }
}

String selectOption()
{
    int addr = 0;
    unsigned long timeCountDown = millis();
    int timeCount = 5;
    byte selection = 1;
    String locationRead = "";
    byte len = EEPROM.read(addr++);
    for (int i = 0; i < len; i++)
    {
        locationRead += char(EEPROM.read(addr++));
    }
    u8g2.drawFrame(0, 0, 128, 43);
    displayString(5, 12, "1.USE " + locationRead);
    displayString(5, 24, "2.CHANGE");
    displayString(5, 38, "CHOOSE: 1");
    displayString(0, 53, "ENTER SELECTION");
    while (1)
    {
        if (millis() - timeCountDown >= 1000)
        {
            timeCount--;
            Serial.println("Time Count: " + String(timeCount));
            displayString(115, 38, String(timeCount + 1));
            timeCountDown = millis();
        }
        if (timeCount < 0)
        {
            delay(700);
            return locationRead;
        }
        // Serial.println("In loop");
        if (digitalRead(buttonEncoder) == 0)
        {
            delay(20);
            if (digitalRead(buttonEncoder) == 0)
            {
                while (digitalRead(buttonEncoder) == 0)
                    ;
                if (selection == 1)
                {
                    return locationRead;
                }
                else
                {
                    setupOLED();
                    Serial.println("location: " + locationRead);
                    delay(2000);
                    readInputFromEncoder(&locationRead);
                    EEPROMWriteString(locationRead, 0);
                    return locationRead;
                }
            }
        }
        else
        {
            current = digitalRead(phaseA);
            if (current != initial)
            {
                if (digitalRead(phaseB) != current)
                {
                    selection = (selection == 2) ? 1 : selection + 1;
                }
                else
                {
                    selection = (selection == 1) ? 2 : selection - 1;
                }
                displayString(69, 38, String(selection));
            }
            initial = current;
        }
    }
    return "Ket thuc";
}
