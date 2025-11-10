const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors()); // Enable CORS for all routes
app.use(express.json());

// In-memory session storage (for POC simplicity)
const sessions = new Map(); // key: sessionId, value: { access_token, instance_url, refresh_token, user_id, code_verifier }

// PKCE helper functions
function generateCodeVerifier() {
  return crypto.randomBytes(32).toString('base64url');
}

function generateCodeChallenge(verifier) {
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

const PORT = 3000;

// OAuth login endpoint - redirects to Salesforce OAuth with PKCE
app.get('/api/login', (req, res) => {
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = generateCodeChallenge(codeVerifier);

  // Store code_verifier temporarily (will be associated with session after callback)
  const tempSessionId = Math.random().toString(36).substring(2);
  sessions.set(tempSessionId, { code_verifier: codeVerifier });

  const loginUrl = `${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/authorize?response_type=code&client_id=${process.env.SALESFORCE_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.SALESFORCE_CALLBACK_URL)}&code_challenge=${codeChallenge}&code_challenge_method=S256&state=${tempSessionId}`;
  res.redirect(loginUrl);
});

// OAuth callback - exchanges code for tokens with PKCE
app.get('/api/oauth/callback', async (req, res) => {
  const { code, state } = req.query;

  // Retrieve code_verifier from temporary session
  const tempSession = sessions.get(state);
  if (!tempSession || !tempSession.code_verifier) {
    return res.status(400).json({ error: 'Invalid state or missing code verifier' });
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: process.env.SALESFORCE_CLIENT_ID,
      client_secret: process.env.SALESFORCE_CLIENT_SECRET,
      code,
      code_verifier: tempSession.code_verifier,
      redirect_uri: process.env.SALESFORCE_CALLBACK_URL
    });

    const response = await axios.post(`${process.env.SALESFORCE_LOGIN_URL}/services/oauth2/token`, params, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { access_token, instance_url, refresh_token, id } = response.data;
    const user_id = id.split('/').pop(); // Extract user ID from identity URL

    // Generate final session ID and store tokens
    const sessionId = Math.random().toString(36).substring(2);
    sessions.set(sessionId, { access_token, instance_url, refresh_token, user_id });

    // Clean up temporary session
    sessions.delete(state);

    // Redirect to frontend with session ID
    res.redirect(`http://localhost:5173?session=${sessionId}`);
  } catch (error) {
    console.error('OAuth callback error:', error.response?.data || error.message);
    // Clean up temporary session on error
    sessions.delete(state);
    res.status(500).json({ error: 'OAuth authentication failed' });
  }
});

// Middleware to retrieve session from headers
const getSession = (req) => {
  const sessionId = req.headers['x-session-id'];
  return sessions.get(sessionId);
};

// GET /api/jsondata - Retrieve all JSON_Data__c records for logged-in user
app.get('/api/jsondata', async (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const query = `SELECT Id, Name, JSON_Data__c FROM JSON_Data__c WHERE OwnerId = '${session.user_id}'`;
    const response = await axios.get(`${session.instance_url}/services/data/v58.0/query?q=${encodeURIComponent(query)}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    res.json(response.data.records);
  } catch (error) {
    console.error('GET jsondata error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to retrieve records' });
  }
});

// POST /api/jsondata - Create new JSON_Data__c record
app.post('/api/jsondata', async (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    const response = await axios.post(`${session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c`, {
      JSON_Data__c: JSON.stringify(req.body)
    }, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('POST jsondata error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create record' });
  }
});

// PATCH /api/jsondata/:id - Update JSON_Data__c record
app.patch('/api/jsondata/:id', async (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await axios.patch(`${session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c/${req.params.id}`, {
      JSON_Data__c: JSON.stringify(req.body)
    }, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('PATCH jsondata error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update record' });
  }
});

// DELETE /api/jsondata/:id - Delete JSON_Data__c record
app.delete('/api/jsondata/:id', async (req, res) => {
  const session = getSession(req);
  if (!session) return res.status(401).json({ error: 'Not authenticated' });

  try {
    await axios.delete(`${session.instance_url}/services/data/v58.0/sobjects/JSON_Data__c/${req.params.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('DELETE jsondata error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to delete record' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
