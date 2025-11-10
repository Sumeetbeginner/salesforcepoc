# Salesforce Integration POC - Quick Setup Guide

## Overview
This guide shows you how to set up and run the Salesforce integration POC in minutes.

---

## 1. Salesforce Setup (5 minutes)

### Create Connected App
1. Go to **Setup** → **App Manager** → **New Connected App**
2. Fill basic info:
   - **Name:** `Salesforce Integration POC`
   - **Email:** `your-email@example.com`
3. **Enable OAuth Settings:**
   - ✅ **Enable OAuth Settings**
   - **Callback URL:** `http://localhost:3000/api/oauth/callback`
   - **Selected OAuth Scopes:**
     - ✅ **Full Access (full)**
     - ✅ **Perform requests on your behalf at any time (refresh_token)**
4. **Save** the app

### Install Connected App
1. Click **Manage** on your new app
2. Click **Edit Policies**
3. Set **Permitted Users** to **"All users may self-authorize"**
4. **Save** changes

### Get Credentials
- **Consumer Key** (Client ID)
- **Consumer Secret** (Client Secret)

### Create Custom Object
1. **Setup** → **Object Manager** → **Create** → **Custom Object**
2. **Label:** `JSON Data`
3. **API Name:** `JSON_Data__c`
4. **Add Field:**
   - **Field Label:** `JSON Data`
   - **Type:** `Text Area (Long)`
   - **Length:** `131072`

---

## 2. Application Setup (3 minutes)

### Download & Install
```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ../frontend
npm install
```

### Configure Environment
Edit `backend/.env` file:
```env
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_CALLBACK_URL=http://localhost:3000/api/oauth/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com
PORT=3000
NODE_ENV=development
```

---

## 3. Run Application (1 minute)

### Start Backend
```bash
cd backend
npm start
```
**Expected:** `Backend server running on http://localhost:3000`

### Start Frontend
```bash
cd frontend
npm run dev
```
**Expected:** `Local: http://localhost:5173/`

---

## 4. Test Integration (2 minutes)

1. **Open** `http://localhost:5173` in browser
2. **Click** "Login with Salesforce"
3. **Login** to Salesforce
4. **Allow** permissions
5. **Create** a test record:
   - Name: `John Doe`
   - Email: `john@example.com`
   - Phone: `+1234567890`
   - Company: `Acme Corp`
   - Description: `Test contact`
6. **Click** "Create Record"
7. **Verify** record appears in left panel

---

## File Structure

```
salesforce-poc/
├── backend/
│   ├── server.js          # Main API server
│   ├── package.json       # Backend dependencies
│   └── .env              # Salesforce credentials
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main React app
│   │   ├── main.ts       # App entry point
│   │   └── style.css     # Basic styles
│   └── package.json      # Frontend dependencies
├── README.md             # Detailed documentation
└── CONFLUENCE_DOCUMENTATION.md  # Technical docs
```

---

## Common Issues & Fixes

### "OAUTH_EC_APP_NOT_FOUND"
**Fix:** Set "Permitted Users" to "All users may self-authorize" in Connected App policies

### "unsupported_grant_type"
**Fix:** Ensure PKCE is enabled in Connected App settings

### CORS Errors
**Fix:** Backend automatically handles CORS - restart both servers

### 401 Unauthorized
**Fix:** Session expired - click "Logout" and login again

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/login` | Start OAuth login |
| GET | `/api/oauth/callback` | Handle OAuth callback |
| GET | `/api/jsondata` | Get all records |
| POST | `/api/jsondata` | Create new record |
| PATCH | `/api/jsondata/:id` | Update record |
| DELETE | `/api/jsondata/:id` | Delete record |

---

## Next Steps

1. ✅ **Basic setup complete**
2. 🔄 **Customize** the UI for your needs
3. 🔄 **Add** your own data fields
4. 🔄 **Deploy** to production server
5. 📖 **Read** `README.md` for advanced features

---

## Support

**Need help?**
- Check the troubleshooting section above
- Review `README.md` for detailed instructions
- Verify Salesforce Connected App settings
- Ensure `.env` file has correct credentials

**Success!** Your Salesforce integration POC is now running. 🚀
