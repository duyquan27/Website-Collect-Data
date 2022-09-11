#include <Arduino.h>
#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <EEPROM.h>

#define FIREBASE_HOST "iotsystem-f2bdd-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "YU5FiNnq3lNWbrw2502Ysd29GcRlv4GE08WPIJRp"

// #define FIREBASE_HOST "testproject-26473-default-rtdb.firebaseio.com"
// #define FIREBASE_AUTH "11HxHUGJfAn2Vd6ppEl0eDiSr2vIWgMsMUXHAVS6"

#define QUANTITY_NODE 2
#define TIME_NODE_SEND 10
#define TIME_CHECK_SEND_DISCONNECTION_NODE 5
const byte CONST_WAIT = 30;

unsigned long timeToSend[QUANTITY_NODE + 1];
bool arrAcp[6];
String arrValue[6];
byte countSigNode[QUANTITY_NODE + 1];
bool nodeIsConnected[QUANTITY_NODE + 1];

FirebaseData firebaseData;

// String SSID = "Shinarus";
// String Pass = "12346578";

// String SSID = "Be Kind D105";
// String Pass = "bekindd1055";

String SSID = "D305-SV-5";
String Pass = "132132132";

String deviceCode = "THCSNU*";

void setupTimeToSend()
{
    for (int i = 0; i < QUANTITY_NODE + 1; i++)
    {
        timeToSend[i] = millis();
    }
    for (byte i = 0; i < deviceCode.length() - 1; i++)
    {
        arrValue[i] = "-1";
        arrAcp[i] = true;
    }
}

bool setupWifi(String ID, String pass)
{
    WiFi.begin(ID, pass);
    byte count = 0;
    while (WiFi.status() != WL_CONNECTED)
    {
        delay(500);
        if (count == 20)
        {
            Serial.println("WiFi not connected");
            return false;
        }
        count++;
        Serial.println("Connecting to WiFi..");
    }
    return true;
    Serial.print("Connected. My IP address is: ");
    Serial.println(WiFi.localIP());
}

// Read Write EEPROOM

int EEPROMWriteString(String dataWrite, int addr)
{
    byte len = dataWrite.length();
    EEPROM.write(addr++, len);
    for (int i = 0; i < len; i++)
    {
        EEPROM.write(addr++, dataWrite[i]);
    }
    EEPROM.commit();
    return addr;
}

// Function
bool isInDeviceCode(char w)
{
    if (deviceCode.indexOf(w) != -1)
    {
        return true;
    }
    return false;
}

String makeConstNodeDir(byte node)
{
    switch (node)
    {
    case 1:
        return "/node_01/";
    case 2:
        return "/node_02/";
    }
    return "";
}

bool checkParity(String dataInput)
{
    String parityRev = dataInput.substring(dataInput.indexOf('*') + 1, dataInput.length());
    byte parity = dataInput[0];
    for (int i = 1; i < dataInput.indexOf('*'); i++)
    {
        parity ^= dataInput[i];
    }
    String dataModify = (parity < 16) ? "0" + String(parity, HEX) : String(parity, HEX);
    if (parityRev == dataModify)
    {
        // Serial.println("Correct");
        return true;
    }
    // Serial.println("Inorrect");
    return false;
}

void sendToFirebase(bool *arrAcp, String *valueSensor, byte node, byte lenArrAcp, String location, String time, bool modeCheckNode)
{
    String dir = "location/" + location + makeConstNodeDir(node) + "time";
    String subDir[6] = {"temp", "humi", "co", "shine", "noise", "uv"};
    Firebase.setString(firebaseData, dir, time);
    for (int i = 0; i < lenArrAcp; i++)
    {
        dir = "location/" + location + makeConstNodeDir(node) + "sensors/";
        if (arrAcp[i])
        {
            dir += subDir[i];
            if (!modeCheckNode)
            {
                arrAcp[i] = false;
            }
            Firebase.setString(firebaseData, dir, valueSensor[i]);
            // Serial.println(dir);
            // Serial.println("Vaule: " + String(valueSensor[i]));
        }
    }
}

void checkConnectNode(byte node)
{
    for (byte i = 1; i < QUANTITY_NODE + 1; i++)
    {
        nodeIsConnected[i] = (node == i) ? true : false;
    }
}

String checkCountSigNode(String locationSendCheckNode, String timeSendCheckNode)
{
    String nodeDisplay = "NODE: ";
    for (byte i = 1; i < QUANTITY_NODE + 1; i++)
    {
        countSigNode[i] = (nodeIsConnected[i] == false) ? (countSigNode[i] == CONST_WAIT) ? CONST_WAIT : countSigNode[i] + 1 : 0;
        // Serial.println("countSigNode[i]: " + String(countSigNode[i]));
        if (countSigNode[i] < CONST_WAIT)
        {
            nodeDisplay += String(i) + " ";
        }
        else
        {
            // Serial.println("Lon hon hoac bang CONST_WAIT");
            if (millis() - timeToSend[i] >= TIME_CHECK_SEND_DISCONNECTION_NODE * 1000)
            {
                sendToFirebase(arrAcp, arrValue, i, deviceCode.length() - 1, locationSendCheckNode, timeSendCheckNode, true);
                timeToSend[i] = millis();
            }
        }
    }
    // Serial.println(nodeDisplay);
    return nodeDisplay;
}

void analysisData(String inputData, bool mode, String location, String timeAndDate)
{
    bool acceptSensor[deviceCode.length() - 1] = {};
    String valueSensor[6] = {}; // Edit later follow length of deviceCode
    byte node = String(inputData[0]).toInt();
    checkConnectNode(node);
    byte len = String(inputData[1]).toInt(); // Position error when len is a 2 digit number -> fix later
    if (mode)
    {
        if ((len == 0 && checkParity(inputData)) || !checkParity(inputData))
            return;
    }
    byte indexOfSensor = 0;
    for (int i = 2; i < inputData.indexOf('*'); i++)
    {
        if (isInDeviceCode(inputData[i]))
        {
            indexOfSensor = deviceCode.indexOf(inputData[i]);
            acceptSensor[indexOfSensor] = true;
        }
        else
        {
            valueSensor[indexOfSensor] += inputData[i];
        }
    }
    sendToFirebase(acceptSensor, valueSensor, node, deviceCode.length() - 1, location, timeAndDate, false);
}

bool isMergerString(String dataInput)
{
    int firstChar = dataInput.indexOf('*');
    int lastChar = dataInput.lastIndexOf('*');
    if (firstChar == lastChar)
    {
        return false;
    }
    else
    {
        return true;
    }
}

void spitString(String mergerString, String locationTemp, String timeAndDateTemp)
{
    String dataString1 = mergerString.substring(0, mergerString.indexOf('*') + 3);
    String dataString2 = mergerString.substring(mergerString.indexOf('*') + 3, mergerString.length());
    Serial.println("-------------------------------------");
    Serial.println("String 1: " + dataString1);
    Serial.println("String 2: " + dataString2);
    Serial.println("-------------------------------------");
    analysisData(dataString1, true, locationTemp, timeAndDateTemp);
    analysisData(dataString2, true, locationTemp, timeAndDateTemp);
    Serial.println("Done Split");
    Serial.println("-------------------------------------");
}

void EEPROMReadDataToSend(int addrStart, int addrEnd, String location)
{
    while (addrStart != addrEnd)
    {
        String dataRead = "";
        byte len = EEPROM.read(addrStart++);
        for (int i = 0; i < len; i++)
        {
            dataRead += char(EEPROM.read(addrStart++));
        }
        byte specChar = dataRead.indexOf('-');
        String time = dataRead.substring(0, specChar);
        String dataSend = dataRead.substring(specChar + 1, dataRead.length());
        dataSend += "*";
        analysisData(dataSend, false, location, time);
    }
}

void getValueFromSerialAndReconnect()
{
    String dataRev = "", dataSSID = "";
    while (Serial.available() > 0)
    {
        char inCome = Serial.read();
        if (inCome != '\n')
        {
            dataRev += inCome;
        }
        else
        {
            dataSSID = dataRev;
            dataRev = "";
        }
        delay(2);
    }
    Serial.println(dataSSID);
    Serial.println(dataRev);
    setupWifi(dataSSID, dataRev);
}