require('dotenv').config(); 
const express = require('express');
const app = express();
const port = process.env.LISTENING_PORT;
const serverOrigin = process.env.SERVER_ORIGIN;

// require your controllers
const PageController = require('./Controllers/PageController');

// Register the mounts and routers
const pageController = new PageController();

app.use(pageController.mount, pageController.router);




// HEADERS, SECURITY, AND ADVANCED STUFF
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
if (process.env.NODE_ENV !== 'production') {
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

  if (process.env.NODE_ENV !== 'production') {
    cspSources = "*"; // Less restrictive in development
  } else {
    cspSources = [`'self'`, ...allowedDomains.filter(url => url !== '*')].join(' ');
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
