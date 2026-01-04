#include <SPI.h>
#include <MFRC522.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ---------- WIFI ----------
const char* ssid = "S20FE";
const char* password = "123456ni";
const char* serverURL = "http://10.200.187.132:3000/api/rfid";

// ---------- PINS ----------
#define SCK_PIN   18
#define MOSI_PIN  23
#define MISO_PIN  19

#define SS_A   5
#define RST_A  22

#define SS_B   15
#define RST_B  4

MFRC522 rfidA(SS_A, RST_A);
MFRC522 rfidB(SS_B, RST_B);

// ---------- CONSTANT ----------
const float DISTANCE_M = 0.2;

// ---------- UIDS ----------
const String HUMAN_UID   = "9BE2D705";
const String VEHICLE_UID = "BAC1D605";

// ---------- STATE ----------
bool humanA = false;
bool vehicleA = false;
unsigned long timeA = 0;

// ---------- FUNCTIONS ----------
String getUID(MFRC522 &reader) {
  String uid = "";
  for (byte i = 0; i < reader.uid.size; i++) {
    if (reader.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(reader.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  return uid;
}

void sendToServer(float speed, float timeSec) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverURL);
    http.addHeader("Content-Type", "application/json");

    String json =
      "{"
      "\"human\":{"
        "\"uid\":\"9BE2D705\","
        "\"name\":\"Kamal Perera\","
        "\"age\":32,"
        "\"gender\":\"Male\","
        "\"address\":\"Colombo, Sri Lanka\""
      "},"
      "\"vehicle\":{"
        "\"uid\":\"BAC1D605\","
        "\"type\":\"Car\","
        "\"plate\":\"WP-CAB-4521\""
      "},"
      "\"speed\":{"
        "\"value\":" + String(speed) + ","
        "\"unit\":\"km/h\","
        "\"distance_m\":0.2,"
        "\"time_sec\":" + String(timeSec) +
      "},"
      "\"timestamp\":\"" + String(millis()) + "\""
      "}";

    int code = http.POST(json);
    Serial.print("Server response: ");
    Serial.println(code);

    http.end();
  }
}

void resetSystem() {
  humanA = false;
  vehicleA = false;
  timeA = 0;
  Serial.println("\nSYSTEM RESET\n");
}

// ---------- SETUP ----------
void setup() {
  Serial.begin(115200);

  WiFi.begin(ssid, password);
  Serial.print("Connecting WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nWiFi Connected");

  SPI.begin(SCK_PIN, MISO_PIN, MOSI_PIN);
  rfidA.PCD_Init();
  rfidB.PCD_Init();

  Serial.println("SYSTEM READY\n");
}

// ---------- LOOP ----------
void loop() {

  // ----- READER A -----
  if (rfidA.PICC_IsNewCardPresent() && rfidA.PICC_ReadCardSerial()) {
    String uid = getUID(rfidA);

    if (uid == HUMAN_UID) {
      humanA = true;
      Serial.println("Human detected");
    }

    if (uid == VEHICLE_UID) {
      vehicleA = true;
      timeA = millis();
      Serial.println("Vehicle detected at A");
    }

    rfidA.PICC_HaltA();
    rfidA.PCD_StopCrypto1();
    delay(500);
  }

  // ----- READER B -----
  if (humanA && vehicleA) {
    if (rfidB.PICC_IsNewCardPresent() && rfidB.PICC_ReadCardSerial()) {
      String uid = getUID(rfidB);

      if (uid == VEHICLE_UID) {
        unsigned long timeB = millis();
        float timeSec = (timeB - timeA) / 1000.0;
        float speed = (DISTANCE_M / timeSec) * 3.6;

        Serial.print("Speed: ");
        Serial.println(speed);

        sendToServer(speed, timeSec);
        resetSystem();
      }

      rfidB.PICC_HaltA();
      rfidB.PCD_StopCrypto1();
      delay(500);
    }
  }
}
