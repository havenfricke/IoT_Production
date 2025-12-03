require('dotenv').config(); 
const express = require('express');
const path = require('path'); // needed for res.sendFile
const app = express();
const port = process.env.LISTENING_PORT;
const serverOrigin = process.env.SERVER_ORIGIN;

// ───────────────────────────────────────────────────────────
// ALEXA INTEGRATION
// ───────────────────────────────────────────────────────────
const Alexa = require('ask-sdk-core');
const { ExpressAdapter } = require('ask-sdk-express-adapter');

// basic example handlers – swap/add your own later
const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  handle(handlerInput) {
    const speakOutput = 'Welcome to the sensor data skill.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('You can ask me for sensor data.')
      .getResponse();
  }
};

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can say: give me a random sensor reading.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent' ||
        Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent'
      );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak('Goodbye!')
      .getResponse();
  }
};

const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder.getResponse();
  }
};

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.error('Alexa Error:', error);
    const speakOutput = 'Sorry, something went wrong.';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt('Please try again.')
      .getResponse();
  }
};

// this is the "const skill = ..." from your screenshot
const skill = Alexa.SkillBuilders.custom()
  .addRequestHandlers(
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    SessionEndedRequestHandler
    // add your custom intent handlers here
  )
  .addErrorHandlers(ErrorHandler)
  .create();

// this is the "const adapter = new ExpressAdapter(skill, false, false)"
// false, false = disable signature/timestamp verification (fine for local dev)
const adapter = new ExpressAdapter(skill, false, false);

// ───────────────────────────────────────────────────────────
// ALEXA INTEGRATION END
// ───────────────────────────────────────────────────────────


// ───────────────────────────────────────────────────────────
// HEADERS, SECURITY, AND ADVANCED 
// ───────────────────────────────────────────────────────────

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

  // allows browser to receive necessary headers
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// ───────────────────────────────────────────────────────────
// HEADERS, SECURITY, AND ADVANCED END
// ───────────────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────
// ALEXA ROUTE – IMPORTANT: BEFORE express.json()
// This is the skill endpoint: POST https://aws-production.onrender/alexa
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

// this is your existing listen, instead of the sample's app.listen(3000)
app.listen(port, () => {
  console.log(`Server is running on ${serverOrigin}:${port}`);
});
