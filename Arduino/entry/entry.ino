#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

const char* ssid="S20FE";
const char* password="123456ni";

String server="http://10.16.203.250:4000";

bool vehicleScanned=false;

String lastUID="";
unsigned long lastTime=0;

void connectWiFi(){

WiFi.begin(ssid,password);

Serial.print("Connecting WiFi");

while(WiFi.status()!=WL_CONNECTED){
delay(500);
Serial.print(".");
}

Serial.println();
Serial.println("Connected to WiFi");
}

void resetSystem(){

vehicleScanned=false;
Serial.println("System Reset Ready");
}

void postData(String route,String uid){

HTTPClient http;

http.begin(server + route);
http.addHeader("Content-Type","application/json");

String json="{\"uid\":\""+uid+"\"}";

int code=http.POST(json);

Serial.print("POST ");
Serial.print(route);
Serial.print(" : ");
Serial.println(code);

if(code>0){
Serial.println(http.getString());
}

http.end();
}

void setup(){

Serial.begin(115200);

SPI.begin();
rfid.PCD_Init();

connectWiFi();
resetSystem();
}

void loop(){

if(!rfid.PICC_IsNewCardPresent()) return;
if(!rfid.PICC_ReadCardSerial()) return;

String uid="";

for(byte i=0;i<rfid.uid.size;i++){

if(rfid.uid.uidByte[i]<0x10) uid+="0";
uid += String(rfid.uid.uidByte[i],HEX);
}

uid.toUpperCase();

if(uid==lastUID && millis()-lastTime<1200){
rfid.PICC_HaltA();
rfid.PCD_StopCrypto1();
delay(100);
return;
}

lastUID=uid;
lastTime=millis();

Serial.print("Scanned UID: ");
Serial.println(uid);

/* VEHICLE */

if(uid=="BAC1D605"){

postData("/vehicle-scan",uid);
vehicleScanned=true;
}

/* HUMAN */

else{

if(!vehicleScanned){
Serial.println("Scan vehicle first");
}
else{
postData("/human-scan",uid);
}

}

rfid.PICC_HaltA();
rfid.PCD_StopCrypto1();

delay(300);
}
