/*
  esp32-fetch-text
  Fetch a short text file, and print to lcd (IC2) display.
  
  Derive from urish esp32-joke-api.ino project:
  
    ESP32 HTTPClient Jokes API Example
    https://wokwi.com/projects/342032431249883731
*/
#include <WiFi.h>
#include <HTTPClient.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>

const char* ssid = "Wokwi-GUEST";
const char* password = "";

constexpr int BTN_PIN = 5;
constexpr uint8_t LCD_ADDRESS = 0x27;
constexpr int LCD_COLUMNS = 16;
constexpr int LCD_ROWS = 2;
constexpr int I2C_SDA = 21;
constexpr int I2C_SCL = 22;
constexpr unsigned long SCREEN_TIMEOUT_MS = 10000UL;

LiquidCrystal_I2C lcd(LCD_ADDRESS, LCD_COLUMNS, LCD_ROWS);
unsigned long lastScreenOnAt = 0;
bool screenOffPending = false;

const char* textUrl = "https://raw.githubusercontent.com/jhauga/support-repo/refs/heads/esp32-fetch-text/file.txt";

String sanitizeText(const String& rawText) {
  String cleaned = rawText;
  cleaned.replace("\r", " ");
  cleaned.replace("\n", " ");
  cleaned.trim();

  while (cleaned.startsWith("#")) {
    cleaned.remove(0, 1);
    cleaned.trim();
  }

  return cleaned.length() > 0 ? cleaned : "<no text>";
}

String fitLine(const String& text) {
  String line = text;
  line.replace("\r", " ");
  line.replace("\n", " ");
  line.trim();

  if (line.length() <= LCD_COLUMNS) {
    return line;
  }

  return line.substring(0, LCD_COLUMNS - 3) + "...";
}

String progressDots(uint8_t count) {
  String dots;
  for (uint8_t index = 0; index < count; ++index) {
    dots += '.';
  }

  return dots;
}

void writeLine(uint8_t row, const String& text) {
  lcd.setCursor(0, row);
  lcd.print("                ");
  lcd.setCursor(0, row);
  lcd.print(fitLine(text));
}

void turnOffScreen() {
  lcd.clear();
  lcd.noBacklight();
  screenOffPending = false;
}

void scheduleScreenOff() {
  lastScreenOnAt = millis();
  screenOffPending = true;
}

void showScreen(const String& line1, const String& line2) {
  lcd.backlight();
  screenOffPending = false;
  writeLine(0, line1);
  writeLine(1, line2);
}

void showIdleMessage() {
  showScreen("Press button", "to get text");
}

String getText() {
  if (WiFi.status() != WL_CONNECTED) {
    return "<wifi down>";
  }

  HTTPClient http;
  http.useHTTP10(true);
  http.setTimeout(10000);

  if (!http.begin(textUrl)) {
    return "<connect failed>";
  }

  const int httpCode = http.GET();
  if (httpCode <= 0) {
    Serial.print("HTTP GET failed: ");
    Serial.println(http.errorToString(httpCode));
    http.end();
    return "<http error>";
  }

  const String responseBody = http.getString();
  http.end();
  return sanitizeText(responseBody);
}

bool ensureWifi() {
  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(ssid, password, 6);

  const unsigned long startedAt = millis();
  uint8_t dotCount = 0;

  while (WiFi.status() != WL_CONNECTED) {
    showScreen("Connecting WiFi", progressDots(dotCount));
    delay(250);
    dotCount = (dotCount + 1) % 4;

    if (millis() - startedAt > 20000UL) {
      Serial.println("WiFi connect timed out.");
      showScreen("WiFi timeout", "Press to retry");
      return false;
    }
  }

  Serial.println();
  Serial.print("Connected. IP: ");
  Serial.println(WiFi.localIP());
  showScreen("WiFi connected", "Fetching text");
  delay(500);
  return true;
}

void showText() {
  if (!ensureWifi()) {
    return;
  }

  showScreen("Fetched Text", "Loading...");

  const String text = getText();
  showScreen("Fetched Text", text);

  Serial.print("Fetched text: ");
  Serial.println(text);
  scheduleScreenOff();
}

void setup() {
  Serial.begin(115200);
  pinMode(BTN_PIN, INPUT_PULLUP);

  Wire.begin(I2C_SDA, I2C_SCL);
  lcd.init();
  lcd.backlight();
  lcd.clear();

  //showIdleMessage();
}

void loop() {
  static int lastButtonState = HIGH;
  const int currentButtonState = digitalRead(BTN_PIN);

  if (screenOffPending && millis() - lastScreenOnAt >= SCREEN_TIMEOUT_MS) {
    turnOffScreen();
  }

  if (lastButtonState == HIGH && currentButtonState == LOW) {
    showText();
  }

  lastButtonState = currentButtonState;
  delay(20);
}
