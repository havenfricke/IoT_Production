require('dotenv').config();
const express = require('express');
const dataService = require('./Server/Services/DataService'); // uses your existing service layer
const path = require('path');
const app = express();
const port = process.env.LISTENING_PORT;
const serverOrigin = process.env.SERVER_ORIGIN;




// ───────────────────────────────────────────────────────────
// ALEXA INTEGRATION (ONE HANDLER USING dataService)
// ───────────────────────────────────────────────────────────
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

// Single handler: handles LaunchRequest AND LatestSensorDataIntent
const LatestSensorDataIntentHandler = {
  canHandle(handlerInput) {
    const { request } = handlerInput.requestEnvelope;

    // raw checks instead of Alexa.getRequestType / getIntentName
    if (request.type === 'LaunchRequest') return true;

    if (request.type === 'IntentRequest' &&
        request.intent &&
        request.intent.name === 'LatestSensorDataIntent') {
      return true;
    }

    return false;
  },

  async handle(handlerInput) {
    try {
      const allData = await dataService.getAllData();

      if (!allData || allData.length === 0) {
        const speakOutput = 'There is no sensor data available yet.';
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .getResponse();
      }

      const latest = allData[0]; // newest due to ORDER BY create_time DESC

      const speakOutput =
        `The latest sensor reading is from device ${latest.deviceId}, ` +
        `with a value of ${latest.dataValue}.`;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .getResponse();

    } catch (err) {
      console.error('LatestSensorDataIntent error:', err);
      // Let global error handler speak a generic message
      throw err;
    }
  }
};

const ErrorHandler = {
  canHandle() { return true; },
  handle(handlerInput, error) {
    console.error('Alexa Error:', error);
    return handlerInput.responseBuilder
      .speak('Sorry, something went wrong.')
      .reprompt('Please try again.')
      .getResponse();
  }
};

// Build the Alexa skill with ONLY that one handler
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(LatestSensorDataIntentHandler)
  .addErrorHandlers(ErrorHandler)
  .create();

// Adapter for Express
const adapter = new ExpressAdapter(skill, false, false);




// ───────────────────────────────────────────────────────────
// HEADERS, SECURITY, AND ADVANCED 
// ───────────────────────────────────────────────────────────
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

  if (allowedDomains.includes('*') || allowedDomains.includes(requestOrigin)) {
    res.setHeader('Access-Control-Allow-Origin', allowedDomains.includes('*') ? '*' : requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // Content Security Policy header
  let cspSources;

  if (process.env.NODE_ENV !== 'dev') {
    cspSources = "*"; // Less restrictive in development
  } 

  res.setHeader(
    'Content-Security-Policy',
    process.env.NODE_ENV !== 'production' ? 
    "default-src * 'unsafe-inline' 'unsafe-eval'" : 
    `default-src ${cspSources}; script-src ${cspSources}; style-src ${cspSources}`
  );

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// ───────────────────────────────────────────────────────────
// ALEXA ROUTE – IMPORTANT: BEFORE express.json()
// ───────────────────────────────────────────────────────────
app.post('/alexa', adapter.getRequestHandlers());

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// require controllers
const DataController = require('./Server/Controllers/DataController');

// Register the mounts and routers
const dataController = new DataController();
app.use(dataController.mount, dataController.router);

// error handler
app.use((err, req, res, next) => {
  console.error('ERROR:', err); // shows stack + mysql error message
  const isValidation =
    err.message?.includes('required') ||
    err.message?.includes('Invalid') ||
    err.message?.includes('exceed');
  res.status(isValidation ? 400 : 500).json({ error: err.message });
});

app.use(express.static(__dirname + '/public'));

// Webpage
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server is running on ${serverOrigin}:${port}`);
});
