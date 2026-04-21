#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClientSecure.h>
#include <SPI.h>
#include <MFRC522.h>
#include <time.h>

// ─── WiFi Credentials ─────────────────────────────────────
const char* WIFI_SSID = "SHADAB 7531";
const char* WIFI_PASS = "123456789";

// ─── Supabase Configuration ───────────────────────────────
const char* SB_URL = "https://xeajmvshkevbclvbyqkc.supabase.co/rest/v1";
const char* SB_KEY = "sb_publishable_kphW-1qRgu6G7MElAOOnWg_utSV8Y92";

// ─── Pin Definitions ──────────────────────────────────────
#define SS_PIN      D2
#define RST_PIN     D1
#define GREEN_LED   D8
#define BUZZER_PIN  D0
#define ERROR_LED   LED_BUILTIN

MFRC522 rfid(SS_PIN, RST_PIN);
String  lastUID      = "";
unsigned long lastScanMs = 0;
const unsigned long COOLDOWN_MS = 5000;

// ══════════════════════════════════════════════════════════
void connectWiFi() {
  Serial.print("Connecting to WiFi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
    attempts++;
    if (attempts > 40) { // 20 seconds timeout
      Serial.println("\n❌ WiFi Failed! Restarting in 3s...");
      delay(3000);
      ESP.restart();
    }
  }
  Serial.println("\n✅ WiFi Connected!");
  Serial.print("📡 IP Address: ");
  Serial.println(WiFi.localIP());
  Serial.print("📶 Signal Strength: ");
  Serial.print(WiFi.RSSI());
  Serial.println(" dBm");
}

// ══════════════════════════════════════════════════════════
void setup() {
  Serial.begin(115200);
  delay(100);
  
  pinMode(GREEN_LED, OUTPUT);
  pinMode(ERROR_LED, OUTPUT);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(GREEN_LED, LOW);
  digitalWrite(ERROR_LED, HIGH);

  SPI.begin();
  rfid.PCD_Init();
  
  connectWiFi();

  // Sync time via NTP (IST = UTC+5:30)
  configTime(5 * 3600 + 30 * 60, 0, "pool.ntp.org", "time.nist.gov");
  Serial.print("⏳ Syncing NTP time");
  while (time(nullptr) < 1000000000UL) { delay(500); Serial.print("."); }
  Serial.println(" ✅");
  
  Serial.println("=== System Ready for Entry/Exit Monitoring ===");
}

// ══════════════════════════════════════════════════════════
void loop() {
  // Auto-reconnect if WiFi drops
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi dropped! Reconnecting...");
    connectWiFi();
  }

  if (!rfid.PICC_IsNewCardPresent()) return;
  if (!rfid.PICC_ReadCardSerial()) return;

  String uid = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    if (rfid.uid.uidByte[i] < 0x10) uid += "0";
    uid += String(rfid.uid.uidByte[i], HEX);
  }
  uid.toUpperCase();
  // Explicitly reassign to ensure uppercase is applied (ESP8266 safety)
  String uidUpper = uid;
  uidUpper.toUpperCase();
  uid = uidUpper;

  rfid.PICC_HaltA();
  rfid.PCD_StopCrypto1();

  if (uid == lastUID && (millis() - lastScanMs < COOLDOWN_MS)) return;
  lastUID = uid;
  lastScanMs = millis();

  processCard(uid);
}

// ══════════════════════════════════════════════════════════
void processCard(const String& uid) {
  Serial.print("\n[SCAN] UID: "); Serial.println(uid);

  // 1. Check if student is registered
  String studentUrl = String(SB_URL) + "/students?uid=eq." + uid + "&select=name,class";
  String studentData = "";
  Serial.println("🔍 Querying: " + studentUrl);
  bool getResult = httpGET(studentUrl, studentData);
  Serial.println("📦 Response: " + studentData);
  if (!getResult || studentData == "[]") {
    Serial.println("⚠️  Unknown card! Logging to live_scans for admin registration...");
    
    // Get current time for the log
    time_t now = time(nullptr);
    struct tm* t = localtime(&now);
    char timeBuf[15];
    sprintf(timeBuf, "%02d:%02d:%02d+05:30", t->tm_hour, t->tm_min, t->tm_sec);
    
    // POST to live_scans so admin can see and register this card
    String livePayload = "{\"uid\":\"" + uid + "\", \"time\":\"" + String(timeBuf) + "\"}";
    if (httpPOST(String(SB_URL) + "/live_scans", livePayload)) {
      Serial.println("📡 UID sent to admin dashboard for registration.");
    } else {
      Serial.println("❌ Failed to log to live_scans.");
    }
    
    beep(1, 800); // Error beep
    return;
  }
  String name = extractValue(studentData, "name");
  String sClass = extractValue(studentData, "class");

  // 2. Check LATEST attendance row for this UID
  String lastLogUrl = String(SB_URL) + "/attendance?uid=eq." + uid + "&order=id.desc&limit=1";
  String lastLogData = "";
  httpGET(lastLogUrl, lastLogData);

  bool isCurrentlyInside = (lastLogData != "[]" && lastLogData.indexOf("\"exist_tiem\":null") != -1);

  if (!isCurrentlyInside) {
    // ─── LOG ENTRY ───
    Serial.println("➡️  MARKING ENTRY for: " + name);
    String payload = "{\"uid\":\"" + uid + "\", \"name\":\"" + name + "\", \"class\":\"" + sClass + "\", \"entery_time\":\"" + getISOTime() + "\"}";
    
    if (httpPOST(String(SB_URL) + "/attendance", payload)) {
      Serial.println("✅ Entry Logged!");
      digitalWrite(GREEN_LED, HIGH);
      beep(1, 400);
      delay(300);
      digitalWrite(GREEN_LED, LOW);
    } else {
      Serial.println("❌ Failed to log entry!");
      beep(1, 1000);
    }
  } else {
    // ─── LOG EXIT via RPC ───
    Serial.println("⬅️  MARKING EXIT for: " + name);
    String payload = "{\"p_uid\":\"" + uid + "\"}";
    
    if (httpPOST(String(SB_URL) + "/rpc/mark_exit", payload)) {
      Serial.println("✅ Exit Logged!");
      digitalWrite(GREEN_LED, HIGH);
      beep(2, 100);
      delay(100);
      beep(1, 100);
      delay(300);
      digitalWrite(GREEN_LED, LOW);
    } else {
      Serial.println("❌ Failed to log exit!");
      beep(1, 1000);
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────

String getISOTime() {
  time_t now = time(nullptr);
  struct tm* t = gmtime(&now);
  char buf[25];
  sprintf(buf, "%04d-%02d-%02dT%02d:%02d:%02d+00:00",
    t->tm_year + 1900, t->tm_mon + 1, t->tm_mday,
    t->tm_hour, t->tm_min, t->tm_sec);
  return String(buf);
}

void beep(int times, int duration) {
  for (int i = 0; i < times; i++) {
    digitalWrite(BUZZER_PIN, HIGH);
    delay(duration);
    digitalWrite(BUZZER_PIN, LOW);
    if (i < times - 1) delay(duration);
  }
}

String extractValue(String json, String key) {
  int kIdx = json.indexOf("\"" + key + "\":\"");
  if (kIdx == -1) return "Unknown";
  int start = kIdx + key.length() + 4;
  int end = json.indexOf("\"", start);
  return json.substring(start, end);
}

bool httpGET(const String& url, String& res) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  if (http.begin(client, url)) {
    http.addHeader("apikey", SB_KEY);
    http.addHeader("Authorization", String("Bearer ") + SB_KEY);
    int code = http.GET();
    if (code == 200) res = http.getString();
    http.end();
    return (code == 200);
  }
  return false;
}

bool httpPOST(const String& url, const String& p) {
  WiFiClientSecure client;
  client.setInsecure();
  HTTPClient http;
  if (http.begin(client, url)) {
    http.addHeader("apikey", SB_KEY);
    http.addHeader("Authorization", String("Bearer ") + SB_KEY);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("Prefer", "return=minimal");
    int code = http.POST(p);
    String body = http.getString();
    Serial.println("📤 POST to: " + url);
    Serial.println("📋 Payload: " + p);
    Serial.println("🔁 HTTP Code: " + String(code));
    Serial.println("📩 Response: " + body);
    http.end();
    return (code >= 200 && code < 300);
  }
  Serial.println("❌ HTTP begin() failed for: " + url);
  return false;
}
