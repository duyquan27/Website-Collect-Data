#include <DHT.h>
#include <BH1750.h>
#include "LoRa_E32.h"
#include <SoftwareSerial.h>
#include <MQ7.h>

//DHT11
const int DHTPIN = 5;//Chân Out của cảm biến nối chân số 5 Arduino
const int DHTTYPE = DHT11;   // Khai báo kiểu cảm biến là DHT11
DHT dht(DHTPIN, DHTTYPE); //Khai báo thư viện chân cảm biến và kiểu cảm biến
//MQ7
int const MQ7PIN = A0;
#define VOLTAGE 5
MQ7 mq7(MQ7PIN, VOLTAGE);
//UV
int const UVPIN = A1;
//Noise
int const NOISEPIN = A2;
//Shine
BH1750 lightMeter;
//Node
String deviceCode = "THCSNU";
String node = "2"; //Node 2
float originalData[6] = {-1,-1,-1,-1,-1,-1};
//Lora
#define TXPIN  11
#define RXPIN  10
#define M0      9
#define M1      8
#define AUX    12
SoftwareSerial mySerial(TXPIN, RXPIN); 
LoRa_E32 e32ttl100(&mySerial, AUX, M0, M1);
void setup() {
  Serial.begin(9600);
  //DHT11
  dht.begin(); //Khởi động cảm biến
  delay(1000); //Delay for stable
  //MQ7
  mq7.calibrate();
  //UV
  pinMode(UVPIN, INPUT);
  //Noise
  pinMode(NOISEPIN, INPUT);
  //Shine
  Wire.begin();
  lightMeter.begin();
  //Lora
  pinMode(AUX, INPUT_PULLUP);//OUTPUT-AUX - NOT USE
  pinMode(13, INPUT_PULLUP);//VCC - DIRECT TO 3.3V
  pinMode(M1, OUTPUT);//M1=0
  pinMode(M0, OUTPUT);//M0=0
  digitalWrite(M1, LOW);
  digitalWrite(M0, LOW);
  delay(1000);//wait for Lora stable.
  // Startup all pins and UART
  e32ttl100.begin();
  get_set_configuration_lora();
}

void loop() {
  float data[deviceCode.length()];
  //Temp, Humi
  data[0] = dht.readTemperature(); //Đọc nhiệt độ C
  data[1] = dht.readHumidity(); //Đọc độ ẩm
  if (isnan(data[0]) || isnan(data[1]))
  {
    Serial.println("Không có giá trị trả về từ cảm biến DHT");
    data[0] = -2;
    data[1] = -2;
  }
  Serial.println("Nhiệt độ: " + String(data[0]));
  Serial.println("Độ ẩm: " + String(data[1]));
  //CO
  data[2] = mq7.readPpm();
  Serial.println("Nong do CO: " + String(mq7.readPpm()));
  //Shine
  float lux = lightMeter.readLightLevel();
  data[3] = lux;
  Serial.print("Light: ");
  Serial.print(lux);
  Serial.println(" lx");
  //Noise
  Serial.print("Noise: ");
  Serial.println(analogRead(NOISEPIN));
  data[4] = converdB(NOISEPIN);
  //UV
  int sensor_value = analogRead(UVPIN); 
  float volts = sensor_value * 5.0 / 1024.0;
  float UV_index = volts * 10;
  data[5] = UV_index;
  Serial.println ("UV index " + String(UV_index));
  Serial.println("-------------------------------------------");
  String dataRev = handleData(data);
  sendData(dataRev);
  Serial.println("-------------------------------------------");
  delay(20000);
}


int converdB(int PIN)
{
  const int sampleWindow = 50;
  unsigned long startMillis = millis();                  // Start of sample window
  float peakToPeak = 0;                                  // peak-to-peak level

  unsigned int signalMax = 0;                            //minimum value
  unsigned int signalMin = 1024;                         //maximum value

  // collect data for 50 mS
  while (millis() - startMillis < sampleWindow)
  {
    int sample = analogRead(PIN);                    //get reading from microphone
    if (sample < 1024)                                  // toss out spurious readings
    {
      if (sample > signalMax)
      {
        signalMax = sample;                           // save just the max levels
      }
      else if (sample < signalMin)
      {
        signalMin = sample;                           // save just the min levels
      }
    }
  }
  peakToPeak = signalMax - signalMin;                    // max - min = peak-peak amplitude
  Serial.println("Peak: " + String(peakToPeak));
  int db = map(peakToPeak, 20, 900, 35, 90);   
  return db;
}
//Function
//Array dataRead will be assign value when sensor read
String handleData(float *dataRead)
{
  bool acceptToSend[deviceCode.length()] = {};
  for(int i = 0; i < deviceCode.length(); i++)
  {
    if((dataRead[i] != originalData[i]) && dataRead[i] >= 0)
    {
      originalData[i] = dataRead[i];
      acceptToSend[i] = true;
    }
  }
  //Serial.println(generateDataString(acceptToSend));
  return generateDataString(acceptToSend);
}

String generateDataString(bool *arrAcp)
{
  byte len = 0;
  String dataSend = "";
  for(int i = 0; i < deviceCode.length(); i++)
  {
    if(arrAcp[i])
    {
      len++;
      dataSend += String(deviceCode[i]) + String(originalData[i],2);
    }
  }
  dataSend = node + String(len) + dataSend;
  return caculateParity(dataSend);
}

String caculateParity(String dataInput)
{
  byte parity = dataInput[0];
  for (int i = 1; i < dataInput.length(); i++)
  {
    parity ^= dataInput[i];
  }
  String dataReturn = (parity < 16) ? "0" + String(parity, HEX) : String(parity, HEX);
//  Serial.println("Data Return : " + dataReturn);
  return dataInput + "*" + dataReturn;
}

void sendData(String str){
  ResponseStatus rs = e32ttl100.sendFixedMessage(0x01, 0x01, 0x13, str);
  Serial.println(str);
  Serial.println(rs.getResponseDescription());
  //delay(1000);
}

void printParameters(struct Configuration configuration) {
  Serial.println("----------------------------------------");

  Serial.print(F("HEAD BIN: "));  Serial.print(configuration.HEAD, BIN);Serial.print(" ");Serial.print(configuration.HEAD, DEC);Serial.print(" ");Serial.println(configuration.HEAD, HEX);
  Serial.println(F(" "));
  Serial.print(F("AddH BIN: "));  Serial.println(configuration.ADDH, BIN);
  Serial.print(F("AddL BIN: "));  Serial.println(configuration.ADDL, BIN);
  Serial.print(F("Chan BIN: "));  Serial.print(configuration.CHAN, DEC); Serial.print(" -> "); Serial.println(configuration.getChannelDescription());
  Serial.println(F(" "));
  Serial.print(F("SpeedParityBit BIN    : "));  Serial.print(configuration.SPED.uartParity, BIN);Serial.print(" -> "); Serial.println(configuration.SPED.getUARTParityDescription());
  Serial.print(F("SpeedUARTDataRate BIN : "));  Serial.print(configuration.SPED.uartBaudRate, BIN);Serial.print(" -> "); Serial.println(configuration.SPED.getUARTBaudRate());
  Serial.print(F("SpeedAirDataRate BIN  : "));  Serial.print(configuration.SPED.airDataRate, BIN);Serial.print(" -> "); Serial.println(configuration.SPED.getAirDataRate());

  Serial.print(F("OptionTrans BIN       : "));  Serial.print(configuration.OPTION.fixedTransmission, BIN);Serial.print(" -> "); Serial.println(configuration.OPTION.getFixedTransmissionDescription());
  Serial.print(F("OptionPullup BIN      : "));  Serial.print(configuration.OPTION.ioDriveMode, BIN);Serial.print(" -> "); Serial.println(configuration.OPTION.getIODroveModeDescription());
  Serial.print(F("OptionWakeup BIN      : "));  Serial.print(configuration.OPTION.wirelessWakeupTime, BIN);Serial.print(" -> "); Serial.println(configuration.OPTION.getWirelessWakeUPTimeDescription());
  Serial.print(F("OptionFEC BIN         : "));  Serial.print(configuration.OPTION.fec, BIN);Serial.print(" -> "); Serial.println(configuration.OPTION.getFECDescription());
  Serial.print(F("OptionPower BIN       : "));  Serial.print(configuration.OPTION.transmissionPower, BIN);Serial.print(" -> "); Serial.println(configuration.OPTION.getTransmissionPowerDescription());

  Serial.println("----------------------------------------");

}
void printModuleInformation(struct ModuleInformation moduleInformation) {
  Serial.println("----------------------------------------");
  Serial.print(F("HEAD BIN: "));  Serial.print(moduleInformation.HEAD, BIN);Serial.print(" ");Serial.print(moduleInformation.HEAD, DEC);Serial.print(" ");Serial.println(moduleInformation.HEAD, HEX);

  Serial.print(F("Freq.: "));  Serial.println(moduleInformation.frequency, HEX);
  Serial.print(F("Version  : "));  Serial.println(moduleInformation.version, HEX);
  Serial.print(F("Features : "));  Serial.println(moduleInformation.features, HEX);
  Serial.println("----------------------------------------");

}

void get_set_configuration_lora() 
{
  ResponseStructContainer c;
  c = e32ttl100.getConfiguration();
  // It's important get configuration pointer before all other operation
  Configuration configuration = *(Configuration*) c.data;
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

  configuration.SPED.uartBaudRate = UART_BPS_9600;    //UART_BPS_115200, NOT RUN WHILE SENDING
  configuration.SPED.airDataRate = AIR_DATA_RATE_010_24;
  configuration.ADDL = 0x03;  // 19HEC
  configuration.ADDH = 0x03;
  configuration.CHAN = 0x13;
  configuration.OPTION.fixedTransmission = FT_FIXED_TRANSMISSION;
  configuration.OPTION.wirelessWakeupTime = WAKE_UP_750 ;
  configuration.OPTION.fec = FEC_1_ON;
  configuration.OPTION.ioDriveMode = IO_D_MODE_PUSH_PULLS_PULL_UPS;
  configuration.OPTION.transmissionPower = POWER_20;
  configuration.SPED.uartParity = MODE_00_8N1;
  ResponseStatus rs =e32ttl100.setConfiguration(configuration, WRITE_CFG_PWR_DWN_SAVE);

  
  Serial.println(rs.getResponseDescription());
  Serial.println(rs.code);
  printParameters(configuration);
  
  ResponseStructContainer cMi;
  cMi = e32ttl100.getModuleInformation();
  // It's important get information pointer before all other operation
  ModuleInformation mi = *(ModuleInformation*)cMi.data;

  Serial.println(cMi.status.getResponseDescription());
  Serial.println(cMi.status.code);

  printModuleInformation(mi);

  c.close();
  cMi.close();  
}
