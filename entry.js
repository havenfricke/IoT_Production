require('dotenv').config(); 
const express = require('express');
const app = express();
const port = process.env.LISTENING_PORT;
const serverOrigin = process.env.SERVER_ORIGIN;

// require your controllers
const DataController = require('./Server/Controllers/DataController');

// Register the mounts and routers
const dataController = new DataController();

app.use(dataController.mount, dataController.router);

app.use(express.static(__dirname + '/public'));
//Webpage
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});


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
    res.setHeader('Access-Control-Allow-Origin', allowedDomains.includes('*') ? '*' : requestOrigin);
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

// Content Security Policy header is security that reduces risk with XSS and data 
// injection by controlling sources from where content is loaded.
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
  // 204 - "Success, no content"
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  
  next();
});

// Middleware for parsing JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.listen(port, () => {
  console.log(`Server is running on ${serverOrigin}:${port}`);
});
