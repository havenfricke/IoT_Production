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

const AlexaController = require('./Server/Controllers/AlexaController');
const alexaController = new AlexaController();
app.use(alexaController.mount, alexaController.router);

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

const dataController = new DataController();

app.use(dataController.mount, dataController.router);


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
