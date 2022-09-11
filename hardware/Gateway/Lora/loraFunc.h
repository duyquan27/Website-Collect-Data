#include "LoRa_E32.h"
#include <SoftwareSerial.h>

// for ESP8266
#define M0 15
#define M1 0
#define TX 12
#define RX 14
#define AUX 13

SoftwareSerial mySerial(TX, RX);
LoRa_E32 e32ttl100(&mySerial, AUX, M1, M0);

void setupLora()
{
    pinMode(AUX, INPUT_PULLUP);
    pinMode(M1, INPUT);
    pinMode(M0, INPUT);
    digitalWrite(M1, LOW);
    digitalWrite(M0, LOW);
    delay(1000);
}

void sendData(String str)
{
    ResponseStatus rs = e32ttl100.sendFixedMessage(0x02, 0x02, 0x13, str);
    Serial.println(str);
    Serial.println(rs.getResponseDescription());
    delay(1000);
}

String revData()
{
    String res = "";
    if (e32ttl100.available() > 1)
    {
        ResponseContainer rs = e32ttl100.receiveMessage();
        // First of all get the data
        res = rs.data;

        Serial.println(rs.status.getResponseDescription());
        Serial.println(res);
        // analysisData(dataRev, true, location);
        return res;
    }
    return res;
}

void printParameters(struct Configuration configuration)
{
    Serial.println("----------------------------------------");

    Serial.print(F("HEAD BIN: "));
    Serial.print(configuration.HEAD, BIN);
    Serial.print(" ");
    Serial.print(configuration.HEAD, DEC);
    Serial.print(" ");
    Serial.println(configuration.HEAD, HEX);
    Serial.println(F(" "));
    Serial.print(F("AddH BIN: "));
    Serial.println(configuration.ADDH, BIN);
    Serial.print(F("AddL BIN: "));
    Serial.println(configuration.ADDL, BIN);
    Serial.print(F("Chan BIN: "));
    Serial.print(configuration.CHAN, DEC);
    Serial.print(" -> ");
    Serial.println(configuration.getChannelDescription());
    Serial.println(F(" "));
    Serial.print(F("SpeedParityBit BIN    : "));
    Serial.print(configuration.SPED.uartParity, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.SPED.getUARTParityDescription());
    Serial.print(F("SpeedUARTDataRate BIN : "));
    Serial.print(configuration.SPED.uartBaudRate, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.SPED.getUARTBaudRate());
    Serial.print(F("SpeedAirDataRate BIN  : "));
    Serial.print(configuration.SPED.airDataRate, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.SPED.getAirDataRate());

    Serial.print(F("OptionTrans BIN       : "));
    Serial.print(configuration.OPTION.fixedTransmission, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.OPTION.getFixedTransmissionDescription());
    Serial.print(F("OptionPullup BIN      : "));
    Serial.print(configuration.OPTION.ioDriveMode, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.OPTION.getIODroveModeDescription());
    Serial.print(F("OptionWakeup BIN      : "));
    Serial.print(configuration.OPTION.wirelessWakeupTime, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.OPTION.getWirelessWakeUPTimeDescription());
    Serial.print(F("OptionFEC BIN         : "));
    Serial.print(configuration.OPTION.fec, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.OPTION.getFECDescription());
    Serial.print(F("OptionPower BIN       : "));
    Serial.print(configuration.OPTION.transmissionPower, BIN);
    Serial.print(" -> ");
    Serial.println(configuration.OPTION.getTransmissionPowerDescription());

    Serial.println("----------------------------------------");
}
void printModuleInformation(struct ModuleInformation moduleInformation)
{
    Serial.println("----------------------------------------");
    Serial.print(F("HEAD BIN: "));
    Serial.print(moduleInformation.HEAD, BIN);
    Serial.print(" ");
    Serial.print(moduleInformation.HEAD, DEC);
    Serial.print(" ");
    Serial.println(moduleInformation.HEAD, HEX);

    Serial.print(F("Freq.: "));
    Serial.println(moduleInformation.frequency, HEX);
    Serial.print(F("Version  : "));
    Serial.println(moduleInformation.version, HEX);
    Serial.print(F("Features : "));
    Serial.println(moduleInformation.features, HEX);
    Serial.println("----------------------------------------");
}

void get_set_configuration_lora()
{
    ResponseStructContainer c;
    c = e32ttl100.getConfiguration();
    // It's important get configuration pointer before all other operation
    Configuration configuration = *(Configuration *)c.data;
    Serial.println(c.status.getResponseDescription());
    Serial.println(c.status.code);

    printParameters(configuration);

    //  configuration.ADDL = 0x1;
    //  configuration.ADDH = 0x1;
    //  configuration.CHAN = 0x13;
    //
    //  configuration.OPTION.fec = FEC_0_OFF;
    //  configuration.OPTION.fixedTransmission = FT_FIXED_TRANSMISSION; //FT_TRANSPARENT_TRANSMISSION;
    //  configuration.OPTION.ioDriveMode = IO_D_MODE_PUSH_PULLS_PULL_UPS;
    //  configuration.OPTION.transmissionPower = POWER_17;
    //  configuration.OPTION.wirelessWakeupTime = WAKE_UP_1250;
    //
    //  configuration.SPED.airDataRate = AIR_DATA_RATE_011_48;
    //  configuration.SPED.uartBaudRate = UART_BPS_9600;    //UART_BPS_115200;
    //  configuration.SPED.uartParity = MODE_00_8N1;
    //
    //  // Set configuration changed and set to not hold the configuration
    //  ResponseStatus rs = e32ttl100.setConfiguration(configuration, WRITE_CFG_PWR_DWN_SAVE); //WRITE_CFG_PWR_DWN_LOSE);

    configuration.SPED.uartBaudRate = UART_BPS_9600; // UART_BPS_115200, NOT RUN WHILE SENDING
    configuration.SPED.airDataRate = AIR_DATA_RATE_010_24;
    configuration.ADDL = 0x01; // 19HEC
    configuration.ADDH = 0x01;
    configuration.CHAN = 0x13;
    configuration.OPTION.fixedTransmission = FT_FIXED_TRANSMISSION;
    configuration.OPTION.wirelessWakeupTime = WAKE_UP_750;
    configuration.OPTION.fec = FEC_1_ON;
    configuration.OPTION.ioDriveMode = IO_D_MODE_PUSH_PULLS_PULL_UPS;
    configuration.OPTION.transmissionPower = POWER_20;
    configuration.SPED.uartParity = MODE_00_8N1;
    ResponseStatus rs = e32ttl100.setConfiguration(configuration, WRITE_CFG_PWR_DWN_SAVE);

    Serial.println(rs.getResponseDescription());
    Serial.println(rs.code);
    printParameters(configuration);

    ResponseStructContainer cMi;
    cMi = e32ttl100.getModuleInformation();
    // It's important get information pointer before all other operation
    ModuleInformation mi = *(ModuleInformation *)cMi.data;

    Serial.println(cMi.status.getResponseDescription());
    Serial.println(cMi.status.code);

    printModuleInformation(mi);

    c.close();
    cMi.close();
}