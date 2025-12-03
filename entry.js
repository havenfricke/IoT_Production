// entry.js
require('dotenv').config();
const express = require('express');
const path = require('path');

// ─────────────────────────────────────────────
// ALEXA SDK IMPORTS
// ─────────────────────────────────────────────
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

// existing app + env
const app = express();
const port = process.env.LISTENING_PORT || 3000;
const serverOrigin = process.env.SERVER_ORIGIN;

// HEADERS, SECURITY, AND ADVANCED 
//________________________________________________________________________________________________________
//________________________________________________________________________________________________________

// allowed domains from the environment variable
let allowedDomains = [];

try {
  allowedDomains = process.env.CORS_ALLOWED_DOMAINS;
} catch (error) {
  console.error('[CORS_ALLOWED_DOMAINS]:', error);
}

// allow all origins when in development
if (process.env.NODE_ENV !== 'dev') {
  allowedDomains = ['*'];
}

// middleware for setting security and CORS
app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;

  // allow only specific origins. in development, allow all.
  if (allowedDomains.includes('*') || allowedDomains.includes(requestOrigin)) {
    res.setHeader(
      'Access-Control-Allow-Origin',
      allowedDomains.includes('*') ? '*' : requestOrigin
    );
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy
  let cspSources;
  if (process.env.NODE_ENV !== 'dev') {
    cspSources = '*'; // Less restrictive in development
  }

  res.setHeader(
    'Content-Security-Policy',
    process.env.NODE_ENV !== 'production'
      ? "default-src * 'unsafe-inline' 'unsafe-eval'"
      : `default-src ${cspSources}; script-src ${cspSources}; style-src ${cspSources}`
  );

  // allows browser to receive necessary headers
  // 204 - "Success, no content"
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  next();
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// require your controllers
const DataController = require('./Server/Controllers/DataController');
const dataService = require('./Server/Services/DataService'); // <-- use DataService for Alexa

// Register the mounts and routers
const dataController = new DataController();
app.use(dataController.mount, dataController.router);

// ─────────────────────────────────────────────
// ALEXA INTEGRATION
// ─────────────────────────────────────────────

// Single intent handler example that uses your DataService
const RandomSensorDataIntentHandler = {
  canHandle(handlerInput) {
    return (
      Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest' &&
      Alexa.getIntentName(handlerInput.requestEnvelope) === 'RandomSensorDataIntent'
    );
  },

  async handle(handlerInput) {
    try {
      // Pull all data rows from your DB via DataService
      const rows = await dataService.getAllData();

      if (!rows || rows.length === 0) {
        const speakOutput = 'There is currently no sensor data available.';
        return handlerInput.responseBuilder.speak(speakOutput).getResponse();
      }

      // Pick a random row
      const randomIndex = Math.floor(Math.random() * rows.length);
      const row = rows[randomIndex];

      const speakOutput = `Here is some data from your sensors. ` +
        `Sensor with device ID ${row.deviceId} has a value of ${row.dataValue}.`;

      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    } catch (err) {
      console.error('RandomSensorDataIntent error:', err);
      const speakOutput =
        'Sorry, I had trouble getting your sensor data. Please try again later.';

      return handlerInput.responseBuilder.speak(speakOutput).getResponse();
    }
  },
};

// Basic error handler for Alexa
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Alexa Skill Error:', error);
    const speakOutput =
      'Sorry, something went wrong handling your request. Please try again.';

    return handlerInput.responseBuilder.speak(speakOutput).getResponse();
  },
};

// Build the Alexa skill (this is the "const skill = ..." from your screenshot)
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(RandomSensorDataIntentHandler)
  .addErrorHandlers(ErrorHandler)
  .withCustomUserAgent('aws-production/iot-skill/v1')
  .create();

// Hook the skill into Express (this is the "const adapter = ..." + app.post(...) bit)
const alexaAdapter = new ExpressAdapter(skill, false, false);

// Alexa endpoint: POST https://aws-production.onrender.com/alexa
app.post('/alexa', alexaAdapter.getRequestHandlers());

// ─────────────────────────────────────────────
// STATIC FILES + ROOT ROUTE
// ─────────────────────────────────────────────

app.use(express.static(__dirname + '/public'));

// Webpage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ─────────────────────────────────────────────
// ERROR HANDLER (keep this after all routes, including Alexa)
// ─────────────────────────────────────────────

app.use((err, req, res, next) => {
  console.error('ERROR:', err); // shows stack + mysql error message
  const isValidation =
    err.message?.includes('required') ||
    err.message?.includes('Invalid') ||
    err.message?.includes('exceed');
  res.status(isValidation ? 400 : 500).json({ error: err.message });
});

// ─────────────────────────────────────────────
// SERVER START
// ─────────────────────────────────────────────

app.listen(port, () => {
  console.log(`Server is running on ${serverOrigin}:${port}`);
});
