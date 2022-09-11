#include "RTClib.h"

RTC_DS1307 rtc;

String daysOfTheWeek[7] = {"SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"};

void setupRTC()
{
    if (!rtc.begin())
    {
        Serial.println("Couldn't find RTC");
        Serial.flush();
        while (1)
            delay(10);
    }
    if (!rtc.isrunning())
    {
        Serial.println("RTC is NOT running, let's set the time!");
        // When time needs to be set on a new device, or after a power loss, the
        // following line sets the RTC to the date & time this sketch was compiled
        rtc.adjust(DateTime(F(__DATE__), F(__TIME__)));
        // This line sets the RTC with an explicit date & time, for example to set
        // January 21, 2014 at 3am you would call:
        // rtc.adjust(DateTime(2014, 1, 21, 3, 0, 0));
    }
}

void readRTC(String *date, String *time)
{
    DateTime now = rtc.now();
    String hour, min, sec, day, month, year;
    // Correction
    hour = (String(now.hour(), DEC).toInt() < 10) ? "0" + String(now.hour(), DEC) : String(now.hour(), DEC);
    min = (String(now.minute(), DEC).toInt() < 10) ? "0" + String(now.minute(), DEC) : String(now.minute(), DEC);
    sec = (String(now.second(), DEC).toInt() < 10) ? "0" + String(now.second(), DEC) : String(now.second(), DEC);
    day = (String(now.day(), DEC).toInt() < 10) ? "0" + String(now.day(), DEC) : String(now.day(), DEC);
    month = (String(now.month(), DEC).toInt() < 10) ? "0" + String(now.month(), DEC) : String(now.month(), DEC);
    year = String(now.year(), DEC).substring(2, 4);
    // Assign
    *date = daysOfTheWeek[now.dayOfTheWeek()] + "," + day + "/" + month + "/" + year;
    *time = hour + ":" + min + ":" + sec;
    // Serial.println(*date);
    // Serial.println(*time);
}

String handleTime()
{
    String date, time;
    readRTC(&date, &time);
    return date + " " + time;
}