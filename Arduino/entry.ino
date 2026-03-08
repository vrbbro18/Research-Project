#include <WiFi.h>
#include <HTTPClient.h>
#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 5
#define RST_PIN 22

MFRC522 rfid(SS_PIN, RST_PIN);

const char* ssid = "S20FE";
const char* password = "123456ni";

String server = "http://10.150.39.250:4000";

void setup() {

Serial.begin(115200);

SPI.begin();
rfid.PCD_Init();

WiFi.begin(ssid, password);

Serial.print("Connecting WiFi");

while (WiFi.status() != WL_CONNECTED) {
delay(500);
Serial.print(".");
}

Serial.println();
Serial.println("Connected to WiFi");

}

void sendVehicle(String uid){

HTTPClient http;

String url = server + "/vehicle-scan";

http.begin(url);
http.addHeader("Content-Type", "application/json");

String json = "{\"uid\":\"" + uid + "\"}";

int response = http.POST(json);

Serial.print("Vehicle sent. Response: ");
Serial.println(response);

http.end();
}

void sendHuman(String uid){

HTTPClient http;

String url = server + "/human-scan";

http.begin(url);
http.addHeader("Content-Type", "application/json");

String json = "{\"uid\":\"" + uid + "\"}";

int response = http.POST(json);

Serial.print("Human sent. Response: ");
Serial.println(response);

http.end();
}

void loop(){

if (!rfid.PICC_IsNewCardPresent()) return;
if (!rfid.PICC_ReadCardSerial()) return;

String uid="";

for (byte i = 0; i < rfid.uid.size; i++) {

if(rfid.uid.uidByte[i] < 0x10) uid += "0";

uid += String(rfid.uid.uidByte[i], HEX);

}

uid.toUpperCase();

Serial.print("Scanned UID: ");
Serial.println(uid);

if(uid == "BAC1D605"){

sendVehicle(uid);

}else{

sendHuman(uid);

}

rfid.PICC_HaltA();
rfid.PCD_StopCrypto1();

delay(2000);

}
