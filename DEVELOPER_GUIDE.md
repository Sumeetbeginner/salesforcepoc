# Salesforce Integration Developer Guide

This comprehensive guide walks developers through integrating Salesforce OAuth 2.0 with PKCE and CRUD operations on custom objects. Perfect for building production-ready Salesforce integrations.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Salesforce Setup](#salesforce-setup)
3. [Backend Implementation](#backend-implementation)
4. [Frontend Implementation](#frontend-implementation)
5. [API Reference](#api-reference)
6. [Security Best Practices](#security-best-practices)
7. [Troubleshooting](#troubleshooting)
8. [Production Deployment](#production-deployment)

## Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **Salesforce Developer Account** with API access
- **Custom Object** `JSON_Data__c` with `JSON_Data__c` text field
- **Connected App** configured for OAuth

## Salesforce Setup

### 1. Create Custom Object

```bash
# In Salesforce Setup → Object Manager
1. Create new Custom Object: JSON_Data__c
2. Add custom field:
   - Field Label: JSON Data
   - Field Name: JSON_Data
   - Type: Text Area (Long)
   - Length: 131,072 characters
3. Set field-level security for your profile
```

### 2. Create Connected App

```bash
# In Salesforce Setup → App Manager
1. New Connected App
2. Basic Information:
   - Connected App Name: Your App Name
   - API Name: your_app_name
   - Contact Email: your-email@example.com

3. Web App Settings:
   - Enable OAuth Settings: ✅
   - Callback URL: http://localhost:3000/api/oauth/callback
   - Selected OAuth Scopes:
     - Full Access (full)
     - Perform requests on your behalf at any time (refresh_token)

4. OAuth Policies:
   - Permitted Users: All users may self-authorize
   - IP Relaxation: Relax IP restrictions
   - Refresh Token Policy: Refresh token is valid until revoked

5. Security:
   - Require Secret for Web Server Flow: ✅
   - Require Secret for Refresh Token Flow: ✅
   - Require Proof Key for Code Exchange (PKCE): ✅

6. Save and note:
   - Consumer Key (Client ID)
   - Consumer Secret (Client Secret)
```

## Backend Implementation

### Project Structure

```
your-project/
├── backend/
│   ├── server.js          # Main Express server
│   ├── package.json       # Dependencies
│   └── .env              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # React application
│   │   ├── main.ts       # App entry point
│   │   └── style.css     # Styles
│   ├── package.json      # Frontend dependencies
│   └── tsconfig.json     # TypeScript config
└── README.md
```

### Backend Dependencies

```json
{
  "dependencies": {
    "express": "^5.1.0",
    "axios": "^1.13.2",
    "cors": "^2.8.5",
    "dotenv": "^17.2.3",
    "crypto": "^1.0.1"
  }
}
```

### Environment Configuration

Create `.env` file in backend directory:

```env
# Salesforce OAuth Configuration
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_CALLBACK_URL=http://localhost:3000/api/oauth/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com

# Server Configuration
PORT=3000
NODE_ENV=development
```

### OAuth Implementation with PKCE

```javascript
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// PKCE Helper Functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

// In-memory session storage (use Redis/database in production)
const sessions = new Map();

// OAuth Login Endpoint
app.get('/api/login', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  const tempSessionId = Math.random().toString(36).substring(2);
  sessions.set(tempSessionId, { code_verifier: codeVerifier });

  const loginUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?` +
    `response_type=code&` +
    `client_id=${process.env.SALESFORCE_CLIENT_ID}&` +
    `redirect_uri=${encodeURIComponent(process.env.SALESFORCE_CALLBACK_URL)}&` +
    `code_challenge=${codeChallenge}&` +
    `code_challenge_method=S256&` +
    `state=${tempSessionId}`;

  res.redirect(loginUrl);
});

// OAuth Callback Handler
app.get('/api/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  const tempSession = sessions.get(state);
  if (!tempSession?.code_verifier) {
    return res.status(400).json({ error: 'Invalid state or missing code verifier' });
  }

  try {
    // Exchange code for tokens using form-encoded data
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      code,
      code_verifier: tempSession.code_verifier,
      redirect_uri: process.env.SALESFORCE_CALLBACK_URL
    });

    const response = await axios.post(
      `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`,
      params,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const { access_token, instance_url, refresh_token, id } = response.data;
    const user_id = id.split('/').pop();

    // Create session
    const sessionId = Math.random().toString(36).substring(2);
    sessions.set(sessionId, { access_token, instance_url, refresh_token, user_id });

    // Cleanup temporary session
    sessions.delete(state);

    // Redirect to frontend with session
    res.redirect(`http://localhost:5173?session=${sessionId}`);

  } catch (error) {
    sessions.delete(state);
    console.error('OAuth Error:', error.response?.data);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// Session validation middleware
const validateSession = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  const session = sessions.get(sessionId);

  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }

  req.session = session;
  next();
};
```

### CRUD Operations

```javascript
// GET /api/jsondata - Retrieve user records
app.get('/api/jsondata', validateSession, async (req, res) => {
  try {
    const query = `SELECT Id, Name, JSON_Data__c FROM JSON_Data__c WHERE OwnerId = '${req.session.user_id}'`;
    const response = await axios.get(
      `${req.session.instance_url}/services/data/v58.0/query?q=${encodeURIComponent(query)}`,
      { headers: { Authorization: `Bearer ${req.session.access_token}` } }
    );
    res.json(response.data.records);
  } catch (error) {
    console.error('GET Error:', error.response?.data);
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
});

// POST /api/jsondata - Create new record
app.post('/api/jsondata', validateSession, async (req, res) => {
  try {
    const response = await axios.post(
      `${req.session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c`,
      { JSON_Data__c: JSON.stringify(req.body) },
      {
        headers: {
          Authorization: `Bearer ${req.session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json(response.data);
  } catch (error) {
    console.error('POST Error:', error.response?.data);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PATCH /api/jsondata/:id - Update record
app.patch('/api/jsondata/:id', validateSession, async (req, res) => {
  try {
    await axios.patch(
      `${req.session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c/${req.params.id}`,
      { JSON_Data__c: JSON.stringify(req.body) },
      {
        headers: {
          Authorization: `Bearer ${req.session.access_token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('PATCH Error:', error.response?.data);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/jsondata/:id - Delete record
app.delete('/api/jsondata/:id', validateSession, async (req, res) => {
  try {
    await axios.delete(
      `${req.session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c/${req.params.id}`,
      { headers: { Authorization: `Bearer ${req.session.access_token}` } }
    );
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE Error:', error.response?.data);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log(`Server running on port ${process.env.PORT || 3000}`);
});
```

## Frontend Implementation

### Project Setup

```bash
# Create React + Vite project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install axios

# For TypeScript support
npm install --save-dev @types/react @types/react-dom
```

### React Component Structure

```typescript
import { useState, useEffect } from 'react';
import axios from 'axios';

interface Record {
  Id: string;
  Name: string;
  JSON_Data__c: string;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  description: string;
}

function App() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle OAuth redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const session = urlParams.get('session');
    if (session) {
      setSessionId(session);
      localStorage.setItem('sessionId', session);
      window.history.replaceState({}, '', '/');
    } else {
      const stored = localStorage.getItem('sessionId');
      if (stored) setSessionId(stored);
    }
  }, []);

  // Fetch records
  const fetchRecords = async () => {
    if (!sessionId) return;

    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3000/api/jsondata', {
        headers: { 'x-session-id': sessionId }
      });
      setRecords(response.data);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setSessionId(null);
        localStorage.removeItem('sessionId');
        setError('Session expired. Please login again.');
      } else {
        setError(err.response?.data?.error || err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [sessionId]);

  // Login handler
  const handleLogin = () => {
    window.location.href = 'http://localhost:3000/api/login';
  };

  // CRUD operations with error handling
  const handleCreate = async (formData: FormData) => {
    try {
      await axios.post('http://localhost:3000/api/jsondata', formData, {
        headers: { 'x-session-id': sessionId! }
      });
      fetchRecords();
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleUpdate = async (id: string, formData: FormData) => {
    try {
      await axios.patch(`http://localhost:3000/api/jsondata/${id}`, formData, {
        headers: { 'x-session-id': sessionId! }
      });
      fetchRecords();
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`http://localhost:3000/api/jsondata/${id}`, {
        headers: { 'x-session-id': sessionId! }
      });
      fetchRecords();
    } catch (err: any) {
      handleApiError(err);
    }
  };

  const handleApiError = (err: any) => {
    if (err.response?.status === 401) {
      setSessionId(null);
      localStorage.removeItem('sessionId');
      setError('Session expired. Please login again.');
    } else {
      setError(err.response?.data?.error || err.message);
    }
  };

  // Render login or main app
  if (!sessionId) {
    return (
      <div>
        <h1>Salesforce Integration</h1>
        <button onClick={handleLogin}>Login with Salesforce</button>
      </div>
    );
  }

  return (
    <div>
      <h1>Salesforce Integration POC</h1>
      {error && <div className="error">{error}</div>}
      {loading && <div>Loading...</div>}

      {/* Records display */}
      <div className="records-grid">
        {records.map(record => (
          <RecordCard
            key={record.Id}
            record={record}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ))}
      </div>

      {/* Form component */}
      <RecordForm
        onSubmit={editing ? handleUpdate : handleCreate}
        initialData={editing ? editingData : undefined}
      />
    </div>
  );
}

export default App;
```

## API Reference

### Authentication Endpoints

#### `GET /api/login`
Initiates OAuth 2.0 flow with PKCE.

**Response:** Redirects to Salesforce login page

#### `GET /api/oauth/callback`
Handles OAuth callback and token exchange.

**Query Parameters:**
- `code`: Authorization code from Salesforce
- `state`: Session state for security

**Response:** Redirects to frontend with session ID

### Data Endpoints

All data endpoints require `x-session-id` header.

#### `GET /api/jsondata`
Retrieve all records for authenticated user.

**Headers:**
```
x-session-id: <session_id>
```

**Response:**
```json
[
  {
    "Id": "a0DXXXXXXXXXXXXXXX",
    "Name": "Record Name",
    "JSON_Data__c": "{\"name\":\"John Doe\",\"email\":\"john@example.com\"}"
  }
]
```

#### `POST /api/jsondata`
Create new record.

**Headers:**
```
x-session-id: <session_id>
Content-Type: application/json
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "description": "Contact information"
}
```

#### `PATCH /api/jsondata/:id`
Update existing record.

**Parameters:**
- `id`: Salesforce record ID

**Headers:**
```
x-session-id: <session_id>
Content-Type: application/json
```

#### `DELETE /api/jsondata/:id`
Delete record.

**Parameters:**
- `id`: Salesforce record ID

**Headers:**
```
x-session-id: <session_id>
```

## Security Best Practices

### 1. Environment Variables
```bash
# Never commit .env files
echo '.env' >> .gitignore

# Use different credentials for each environment
# development, staging, production
```

### 2. Session Management
```javascript
// Use secure session storage in production
// Consider Redis or database-backed sessions
const sessions = new Map(); // Replace with Redis/database

// Implement session expiration
const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours
```

### 3. Input Validation
```javascript
const validateRecordData = (data) => {
  const schema = {
    name: 'string',
    email: 'string',
    phone: 'string',
    company: 'string',
    description: 'string'
  };

  // Implement validation logic
  return isValid;
};
```

### 4. Rate Limiting
```javascript
const rateLimit = require('express-rate-limit');

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));
```

### 5. HTTPS Only
```javascript
// Enforce HTTPS in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

## Troubleshooting

### Common Issues

#### 1. "unsupported_grant_type" Error
**Cause:** Incorrect Content-Type in token request
**Solution:** Use `application/x-www-form-urlencoded`

#### 2. "invalid_client" Error
**Cause:** Wrong client credentials
**Solution:** Verify SALESFORCE_CLIENT_ID and SALESFORCE_CLIENT_SECRET

#### 3. "invalid_grant" Error
**Cause:** Expired or invalid authorization code
**Solution:** Re-initiate OAuth flow

#### 4. CORS Errors
**Cause:** Missing CORS configuration
**Solution:** Add `app.use(cors())` to Express server

#### 5. 401 Unauthorized
**Cause:** Invalid or expired session
**Solution:** Clear localStorage and re-login

### Debug Mode

```javascript
// Enable detailed logging
const DEBUG = process.env.NODE_ENV !== 'production';

if (DEBUG) {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}
```

## Production Deployment

### 1. Environment Setup
```bash
# Production environment variables
NODE_ENV=production
SALESFORCE_LOGIN_URL=https://login.salesforce.com
SESSION_SECRET=your-secure-random-string
REDIS_URL=redis://your-redis-instance
```

### 2. Process Management
```bash
# Use PM2 for production
npm install -g pm2
pm2 start server.js --name salesforce-integration
pm2 startup
pm2 save
```

### 3. Database Integration
```javascript
// Replace in-memory sessions with Redis
const redis = require('redis');
const session = require('express-session');
const RedisStore = require('connect-redis')(session);

const redisClient = redis.createClient({ url: process.env.REDIS_URL });
app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false
}));
```

### 4. SSL/TLS Configuration
```javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('path/to/private-key.pem'),
  cert: fs.readFileSync('path/to/certificate.pem')
};

https.createServer(options, app).listen(443);
```

### 5. Monitoring & Logging
```javascript
// Add logging and monitoring
const morgan = require('morgan');
app.use(morgan('combined'));

// Add health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review Salesforce API documentation
3. Verify your Connected App configuration
4. Ensure all environment variables are set correctly

## License

This implementation is provided as-is for educational and development purposes.
