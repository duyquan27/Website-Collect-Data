#include <Arduino.h>
#include "loraFunc.h"
#include "encoder.h"
#include "rtc.h"

// Global Variables
String location = "";
unsigned long timeDisplay = millis(), timeCheckSigNode = millis();
int addr = 0, addrStartRead;
bool disconnect = false, memoryIsFull = false;

void setup()
{
  Serial.begin(9600);
  Serial.println("Begin serial");
  EEPROM.begin(4096);
  Wire.begin();
  u8g2.begin();
  u8g2.clearDisplay();
  displayString(0, 53, "CONNECTING WIFI");
  if (setupWifi(SSID, Pass))
  {
    displayString(0, 53, "                         ");
    displayString(0, 53, "CONNECTED");
  }
  else
  {
    displayString(0, 53, "NOT CONNECTED   ");
    delay(1000);
  }
  Firebase.begin(FIREBASE_HOST, FIREBASE_AUTH);
  Firebase.reconnectWiFi(true);
  setupRTC();
  setupLora();
  e32ttl100.begin();
  get_set_configuration_lora();
  setupEncoder();
  location = selectOption();
  Serial.println(location);
  addr = location.length() + 1;
  addrStartRead = addr;
  setupTimeToSend();
  // displayString(0, 53, "ENTER LOCATION");
  // readInputFromEncoder(&location);
  displayArt(location);
  displayString(0, 53, "NODE:            ");
  Serial.println("Done");
}

void loop()
{
  if (millis() - timeDisplay >= 1000)
  {
    String date, time;
    readRTC(&date, &time);
    displayString(20, 12, time);
    displayString(20, 24, date);
    displayString(0, 53, checkCountSigNode(location, handleTime()) + "          ");
    timeDisplay = millis();
  }
  String dataRev = revData();
  if (dataRev == "")
  {
    if (WiFi.status() == WL_CONNECTED)
    {
      displayString(120, 53, " ");
    }
    else
    {
      displayString(120, 53, "X");
    }
    checkConnectNode(0);
    return;
  }
  if (WiFi.status() == WL_CONNECTED)
  {
    if (!disconnect)
    {
      if (isMergerString(dataRev))
      {
        spitString(dataRev, location, handleTime());
      }
      else
      {
        analysisData(dataRev, true, location, handleTime());
      }
    }
    else
    {
      u8g2.clearDisplay();
      u8g2.drawFrame(0, 0, 128, 64);
      displayString(36, 21, "UPLOADING");
      displayString(48, 32, "WAIT");
      displayString(12, 43, "A FEW MINUTES");
      u8g2.sendBuffer();
      Serial.println("Address: " + String(addr));
      EEPROMReadDataToSend(addrStartRead, addr, location);
      addr = addrStartRead;
      disconnect = false;
      memoryIsFull = false;
      displayArt(location);
      // location
    }
    displayString(120, 53, " ");
  }
  else
  {
    if (!checkParity(dataRev) || String(dataRev[1]).toInt() == 0 || memoryIsFull)
    {
      return;
    }
    checkConnectNode(String(dataRev[0]).toInt());
    Serial.println("Write to EEPROM");
    String dataWrite;
    dataRev = dataRev.substring(0, dataRev.indexOf('*'));
    dataWrite = handleTime() + "-" + dataRev;
    if ((addr + dataWrite.length()) <= 4096)
    {
      addr = EEPROMWriteString(dataWrite, addr);
      memoryIsFull = false;
    }
    else
    {
      memoryIsFull = true;
    }
    Serial.println("Address: " + String(addr));
    disconnect = true;
    displayString(120, 53, "X");
  }
  // if (Serial.available())
  // {
  //   Serial.println("In get");
  //   displayString(0, 53, "CONNECTING WIFI");
  //   getValueFromSerialAndReconnect();
  // }
}