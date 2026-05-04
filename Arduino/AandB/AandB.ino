#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

/* WIFI */

const char* ssid = "S20FE";
const char* password = "123456ni";

/* SERVER */

String server = "http://10.16.203.250:4000";

/* RFID */

#define SS_A 5
#define SS_B 15
#define SS_C 2

#define RST_A 22
#define RST_B 4
#define RST_C 21

#define SCK 18
#define MISO 19
#define MOSI 23

MFRC522 rfidA(SS_A,RST_A);
MFRC522 rfidB(SS_B,RST_B);
MFRC522 rfidC(SS_C,RST_C);


/* SETTINGS */

String VEHICLE_UID="BAC1D605";

float distance=0.20;

unsigned long startTime=0;

bool speedCompleted=false;


/* ================================= */

void setup()
{

Serial.begin(115200);

SPI.begin(
SCK,
MISO,
MOSI
);

rfidA.PCD_Init();
rfidB.PCD_Init();
rfidC.PCD_Init();

Serial.println(
"RFID Readers Ready"
);

WiFi.begin(
ssid,
password
);

Serial.print(
"Connecting WiFi"
);

while(
WiFi.status()
!=
WL_CONNECTED
)
{
delay(500);
Serial.print(".");
}

Serial.println();
Serial.println(
"WiFi Connected"
);

}


/* ================================= */

String getUID(
MFRC522 &reader
)
{

String uid="";

for(
byte i=0;
i<reader.uid.size;
i++
)
{

if(
reader.uid.uidByte[i]
<
0x10
)
uid+="0";

uid+=String(
reader.uid.uidByte[i],
HEX
);

}

uid.toUpperCase();

return uid;

}


/* ================================= */

void sendA()
{

HTTPClient http;

http.begin(
server+"/point-a"
);

http.addHeader(
"Content-Type",
"application/json"
);

int response=
http.POST("{}");

Serial.print(
"/point-a Response: "
);

Serial.println(
response
);

http.end();

}


/* ================================= */

bool sendSpeed(
float speed
)
{

HTTPClient http;

http.begin(
server+"/point-b"
);

http.addHeader(
"Content-Type",
"application/json"
);

String json=

"{\"speed\":"

+

String(
speed,
2
)

+

"}";


int response=
http.POST(
json
);

Serial.print(
"/point-b Response: "
);

Serial.println(
response
);

http.end();

return
response==200;

}


/* ================================= */

void sendExit()
{

HTTPClient http;

http.begin(
server+"/exit"
);

http.addHeader(
"Content-Type",
"application/json"
);

int response=
http.POST("{}");

Serial.print(
"/exit Response: "
);

Serial.println(
response
);

http.end();

}


/* ================================= */

void loop()
{

/* ===== A ===== */

if(
rfidA.PICC_IsNewCardPresent()
&&
rfidA.PICC_ReadCardSerial()
)
{

String uid=
getUID(
rfidA
);

Serial.print(
"A scanned: "
);

Serial.println(
uid
);

if(
uid==
VEHICLE_UID
)
{

startTime=
millis();

speedCompleted=
false;

sendA();

Serial.println(
"Vehicle detected at A"
);

}

rfidA.PICC_HaltA();
rfidA.PCD_StopCrypto1();

delay(1000);

}



/* ===== B ===== */

if(
rfidB.PICC_IsNewCardPresent()
&&
rfidB.PICC_ReadCardSerial()
)
{

String uid=
getUID(
rfidB
);

Serial.print(
"B scanned: "
);

Serial.println(
uid
);

if(
uid==
VEHICLE_UID
&&
startTime>0
)
{

float seconds=

(
millis()
-
startTime
)

/

1000.0;


float speed=

(
distance
/
seconds
)

*

3.6;


speedCompleted=

sendSpeed(
speed
);


if(
speedCompleted
)
{

Serial.print(
"Speed km/h: "
);

Serial.println(
speed
);

startTime=0;

}

}

rfidB.PICC_HaltA();
rfidB.PCD_StopCrypto1();

delay(1000);

}



/* ===== C ===== */

if(
rfidC.PICC_IsNewCardPresent()
&&
rfidC.PICC_ReadCardSerial()
)
{

String uid=
getUID(
rfidC
);

Serial.print(
"C scanned: "
);

Serial.println(
uid
);


/* EXIT ONLY AFTER B */

if(
uid==
VEHICLE_UID
&&
speedCompleted
)
{

sendExit();

Serial.println(
"Exit sent"
);

speedCompleted=
false;

}

else
{

Serial.println(
"Exit blocked. Scan B first."
);

}


rfidC.PICC_HaltA();
rfidC.PCD_StopCrypto1();

delay(1000);

}

}
