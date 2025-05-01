// Mock Node.js backend for AIApp
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Body parsing middleware - must be before any routes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Custom CORS middleware to set exact headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://www.testportal.medvise.ai');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRFToken, accept');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.header('Allow', 'POST, OPTIONS');
    return res.status(204).send();
  }
  next();
});

// Logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body) {
    console.log('Request body:', req.body);
  }
  next();
});

// Mock login endpoint
app.post('/api/V2/account/auth/login/', (req, res) => {
  // Log received request
  console.log('Login request received:', req.body);

  // Basic validation - with safer destructuring
  const { email, password } = req.body || {};
  
  if (!email || !password) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'Email and password are required'
    });
  }
  
  // Generate current date for headers
  const currentDate = new Date().toUTCString();
  const requestId = uuidv4().replace(/-/g, '');
  
  // Set specific headers as required
  res.setHeader('Allow', 'POST, OPTIONS');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
  res.setHeader('Date', currentDate);
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Server', 'nginx');
  
  // Set cookies as specified
  const nextYear = new Date();
  nextYear.setFullYear(nextYear.getFullYear() + 1);
  
  const twoWeeksLater = new Date();
  twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
  
  res.setHeader('Set-Cookie', [
    `csrftoken=hI1MO3V6JpA5IB9XGFODkopc8MB9qciV; Domain=.medvise.ai; expires=${nextYear.toUTCString()}; Max-Age=31449600; Path=/; SameSite=None; Secure`,
    `sessionid=avb6t8d24mj4xfc6wz5uduku8d00llq5; Domain=.medvise.ai; expires=${twoWeeksLater.toUTCString()}; Max-Age=1209600; Path=/; SameSite=None; Secure`
  ]);
  
  res.setHeader('Vary', 'Accept, Cookie, Origin');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Request-Id', requestId);
  
  // Hardcoded response matching the specified format
  const mockResponse = {
    "user_id": 0,
    "practitioner_id": 0,
    "practitioner_role": "doctor",
    "first_name": "string",
    "last_name": "string",
    "timezone": "string",
    "language": "strin",
    "has_accepted_terms": true,
    "settings": {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    },
    "is_emr_linked": true,
    "emr_system_details": {
      "id": 0,
      "emr_name": "string",
      "emr_version": "string",
      "emr_verbose_name": "string",
      "emr_code": "string"
    },
    "speciality": "string",
    "email": "user@example.com",
    "license_number": "string"
  };
  
  // Send the mock response
  res.status(200).json(mockResponse);
});

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'AIApp Mock API Server',
    status: 'running',
    endpoints: [
      'POST /api/V2/account/auth/login/'
    ]
  });
});

// 404 handler for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The requested endpoint ${req.method} ${req.url} does not exist`
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message || 'An unexpected error occurred'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Access the server at http://localhost:${PORT}`);
});