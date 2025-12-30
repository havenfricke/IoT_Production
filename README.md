## Project Structure
-Server\
--Controllers\
--DB (Database)\
--Models\
--Repositories\
--Services\
--Utils\
-env

## Controllers
Responsible for incoming traffic, handling files, and authorization.
## DB
Responsible for creating a pool connection to the MySQL database cluster and executing MySQL commands (Object relational mapping).
## Models
Responsible for modeling known incoming and outgoing data structures, allowing control over what data is included in the application.
## Repositories
Responsible for querying necessary MySQL logic related to the application's functionality (Object relational mapping).
## Services
Responsible for additional logic necessary for the data to be well received by the repository and database.
## Utils
Responsible for additional refactored code dump called upon by the core system. 
## .env
Responsible for housing and distributing sensitive information throughout the application (hidden during runtime).


## Base Arduino Code
```
#include <WiFiNINA.h>
#include <ArduinoHttpClient.h>

// ====== SETTINGS ======
char ssid[] = "iPhone";
char pass[] = "pass123$";
const char server[] = "aws-production.onrender.com";  

// Use port 443 for HTTPS
int port = 443;

// Path on your server (after domain)
String urlPath = "/data";
// ===========================

// Create a secure client
WiFiSSLClient wifiSSLClient;
// Attach the SSL client to the HttpClient
HttpClient client = HttpClient(wifiSSLClient, server, port);

void setup() {
  Serial.begin(115200);
  while (!Serial);

  Serial.println("Connecting to WiFi...");
  int status = WL_IDLE_STATUS;
  while (status != WL_CONNECTED) {
    status = WiFi.begin(ssid, pass);
    delay(2000);
    Serial.print(".");
  }
  Serial.println("\nConnected to WiFi!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  // Example JSON body (customize as needed)
  String body = "{\"device_id\": \"sensor-1\", \"data_value\": 21.5}";

  Serial.println("\nMaking HTTPS POST request...");
  client.beginRequest();
  client.post(urlPath);
  client.sendHeader("Content-Type", "application/json");
  client.sendHeader("Content-Length", body.length());
  client.beginBody();
  client.print(body);
  client.endRequest();

  // Read response
  int statusCode = client.responseStatusCode();
  String response = client.responseBody();

  Serial.print("Status code: ");
  Serial.println(statusCode);
  Serial.print("Response: ");
  Serial.println(response);

  client.stop();
  delay(60000);  // ms -> 1 minute
}
```
## Arduino Code
Within the loop() body:
```
String body = "{\"device_id\": \"sensor-1\", \"data_value\": 21.5}";
```
To send a dynamic value, we need to interpolate our string, "body" - snprintf() is the safest way to do this in C based language.

Replace the above code with:
```
// Allocate a fixed-size C-style character buffer (128 chars)
// This will hold the final JSON string we build.
char body[128];

// A C-string for the device ID (does NOT allocate dynamic memory)
const char* deviceId = "sensor-1";

// Example sensor value we want to send
float value = 21.5;

// Format a JSON string into the 'body' buffer safely.
// snprintf ensures we NEVER write past 128 bytes.
// %s inserts a string (deviceId)
// %.2f inserts a floating-point number with 2 decimal places (value)
snprintf(body, sizeof(body),
         "{\"device_id\":\"%s\",\"data_value\":%.2f}",
         deviceId, value);
// pass values to snprintf()
// 'body' now contains: {"device_id":"sensor-1","data_value":21.50}
```

This will allow `value` to be updated by sensor-based logic.
