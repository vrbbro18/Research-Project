#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

/* WIFI */

const char* ssid = "S20FE";
const char* password = "123456ni";

/* SERVER */

String server = "http://10.150.39.250:4000";

/* RFID PINS */

#define SS_A 5
#define SS_B 15
#define SS_C 2

#define RST_A 22
#define RST_B 4
#define RST_C 21

#define SCK 18
#define MISO 19
#define MOSI 23

MFRC522 rfidA(SS_A, RST_A);
MFRC522 rfidB(SS_B, RST_B);
MFRC522 rfidC(SS_C, RST_C);

/* SPEED VARIABLES */

unsigned long startTime = 0;
float distance = 0.15; // meters (15 cm)

void setup()
{
Serial.begin(115200);

SPI.begin(SCK, MISO, MOSI);

rfidA.PCD_Init();
rfidB.PCD_Init();
rfidC.PCD_Init();

Serial.println("RFID Readers Ready");

/* WIFI */

WiFi.begin(ssid,password);

Serial.print("Connecting WiFi");

while(WiFi.status()!=WL_CONNECTED)
{
delay(500);
Serial.print(".");
}

Serial.println();
Serial.println("WiFi Connected");

}

/* SEND SPEED TO SERVER */

void sendSpeed(float speed)
{

HTTPClient http;

String url = server + "/speed";

http.begin(url);
http.addHeader("Content-Type","application/json");

String json =
"{\"speed\":" + String(speed) + "}";

int response = http.POST(json);

Serial.print("Speed sent. Response: ");
Serial.println(response);

http.end();

}

/* SEND EXIT */

void sendExit()
{

HTTPClient http;

String url = server + "/exit";

http.begin(url);
http.addHeader("Content-Type","application/json");

int response = http.POST("{\"exit\":true}");

Serial.print("Exit sent. Response: ");
Serial.println(response);

http.end();

}

/* READ UID */

String getUID(MFRC522 &reader)
{

String uid="";

for(byte i=0;i<reader.uid.size;i++)
{
if(reader.uid.uidByte[i]<0x10) uid+="0";
uid+=String(reader.uid.uidByte[i],HEX);
}

uid.toUpperCase();

return uid;

}

/* LOOP */

void loop()
{

/* SCAN A */

if(rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial())
{

String uid=getUID(rfidA);

Serial.print("A scanned: ");
Serial.println(uid);

startTime=millis();

rfidA.PICC_HaltA();
rfidA.PCD_StopCrypto1();

}

/* SCAN B */

if(rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial())
{

String uid=getUID(rfidB);

Serial.print("B scanned: ");
Serial.println(uid);

unsigned long endTime=millis();

float timeSec=(endTime-startTime)/1000.0;

float speed=(distance/timeSec)*3.6;

Serial.print("Speed km/h: ");
Serial.println(speed);

sendSpeed(speed);

rfidB.PICC_HaltA();
rfidB.PCD_StopCrypto1();

}

/* SCAN C */

if(rfidC.PICC_IsNewCardPresent() && rfidC.PICC_ReadCardSerial())
{

String uid=getUID(rfidC);

Serial.print("Exit scanned: ");
Serial.println(uid);

sendExit();

rfidC.PICC_HaltA();
rfidC.PCD_StopCrypto1();

}

}
