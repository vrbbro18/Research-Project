#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "S20FE";
const char* password = "123456ni";

const char* serverUrl = "http://10.150.39.250:4000/upload";

#define VIBRATION_SENSOR 13
#define BUZZER 12

bool accidentTriggered = false;

/* AI Thinker ESP32-CAM pins */

#define PWDN_GPIO_NUM     32
#define RESET_GPIO_NUM    -1
#define XCLK_GPIO_NUM      0
#define SIOD_GPIO_NUM     26
#define SIOC_GPIO_NUM     27

#define Y9_GPIO_NUM       35
#define Y8_GPIO_NUM       34
#define Y7_GPIO_NUM       39
#define Y6_GPIO_NUM       36
#define Y5_GPIO_NUM       21
#define Y4_GPIO_NUM       19
#define Y3_GPIO_NUM       18
#define Y2_GPIO_NUM        5

#define VSYNC_GPIO_NUM    25
#define HREF_GPIO_NUM     23
#define PCLK_GPIO_NUM     22

/* ---------- Camera Setup ---------- */

void startCamera()
{
  camera_config_t config;

  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;

  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;

  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;

  config.pin_sccb_sda = SIOD_GPIO_NUM;
  config.pin_sccb_scl = SIOC_GPIO_NUM;

  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;

  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;

  /* Higher quality image */

  config.frame_size = FRAMESIZE_SVGA;
  config.jpeg_quality = 10;
  config.fb_count = 1;

  if (esp_camera_init(&config) != ESP_OK)
  {
    Serial.println("Camera init failed");
    return;
  }

  Serial.println("Camera ready");
}

/* ---------- WiFi ---------- */

void connectWiFi()
{
  Serial.println("Connecting WiFi...");

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.println("WiFi connected");

  Serial.print("ESP32 IP: ");
  Serial.println(WiFi.localIP());
}

/* ---------- Send Photo ---------- */

void sendPhoto()
{
  camera_fb_t * fb = esp_camera_fb_get();

  if (!fb)
  {
    Serial.println("Camera capture failed");
    return;
  }

  Serial.println("Uploading image...");

  WiFiClient client;
  HTTPClient http;

  http.begin(client, serverUrl);
  http.addHeader("Content-Type", "image/jpeg");

  int httpResponse = http.POST(fb->buf, fb->len);

  Serial.print("Server response: ");
  Serial.println(httpResponse);

  http.end();

  esp_camera_fb_return(fb);
}

/* ---------- Setup ---------- */

void setup()
{
  Serial.begin(115200);

  pinMode(VIBRATION_SENSOR, INPUT);
  pinMode(BUZZER, OUTPUT);

  startCamera();
  connectWiFi();

  Serial.println("System Ready...");
}

/* ---------- Loop ---------- */

void loop()
{

int vibration = digitalRead(VIBRATION_SENSOR);

if (vibration == HIGH && accidentTriggered == false)
{
delay(100);   // medium sensitivity

if (digitalRead(VIBRATION_SENSOR) == HIGH)
{

Serial.println("ACCIDENT DETECTED");

accidentTriggered = true;

digitalWrite(BUZZER, HIGH);
delay(1000);
digitalWrite(BUZZER, LOW);

sendPhoto();

Serial.println("System locked. Press RESET.");

while(true)
{
delay(1000);
}

}

}

}
