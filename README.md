# Salesforce Integration POC - Full-Stack Application

A production-ready proof-of-concept demonstrating Salesforce integration with OAuth 2.0 and CRUD operations on custom objects. Features user-friendly UI/UX for data management and comprehensive developer documentation.

## Architecture

- **Backend**: Node.js + Express server handling OAuth flow and Salesforce API calls
- **Frontend**: React + Vite application with TypeScript for user interface
- **Authentication**: Salesforce OAuth 2.0 Authorization Code flow
- **Data Storage**: Salesforce custom object `JSON_Data__c`

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Salesforce Developer Account with:
  - Connected App configured for OAuth
  - Custom object `JSON_Data__c` with at least one text field `JSON_Data__c`

## Salesforce Setup

### ⚠️ **Important**: Connected App Installation Required

After creating the Connected App, you **must install it in your Salesforce org**. This is a common step that gets missed.

### Step 1: Create Connected App

1. **Navigate to Setup**:
   - Go to **Setup** (gear icon) → **App Manager**

2. **Create New Connected App**:
   - Click **"New Connected App"**
   - **Basic Information**:
     - Connected App Name: `Salesforce Integration POC`
     - API Name: `Salesforce_Integration_POC`
     - Contact Email: `your-email@example.com`

3. **Enable OAuth Settings**:
   - ✅ **Enable OAuth Settings**
   - **Callback URL**: `http://localhost:3000/api/oauth/callback`
   - **Selected OAuth Scopes**:
     - ✅ **Full Access (full)**
     - ✅ **Perform requests on your behalf at any time (refresh_token)**

4. **Configure OAuth Policies**:
   - **Introspect all Tokens**: ❌ Unchecked
   - **Configure ID token**: ❌ Unchecked

5. **Flow Enablement**:
   - ✅ **Enable Authorization Code and Credentials Flow**
   - ❌ Other flows: Unchecked

6. **Security Settings**:
   - ✅ **Require secret for Web Server Flow**
   - ✅ **Require secret for Refresh Token Flow**
   - ✅ **Require Proof Key for Code Exchange (PKCE) extension for Supported Authorization Flows**
   - **Enable Refresh Token Rotation**: Optional
   - **Issue JSON Web Token (JWT)-based access tokens**: Optional

7. **Save** the Connected App

### Step 2: ⚠️ **CRITICAL** - Install Connected App in Your Org

**This step is often missed and causes the "OAUTH_EC_APP_NOT_FOUND" error!**

1. **After saving**, click **"Manage"** on your Connected App
2. **Click "Edit Policies"**
3. **Under "OAuth Policies"**:
   - **Permitted Users**: Change to **"All users may self-authorize"**
   - **IP Relaxation**: **"Relax IP restrictions"**
4. **Save** the policies

5. **Install the App in your Org** (if using a sandbox/dev org):
   - Go to **Setup** → **Installed Packages**
   - If your Connected App doesn't appear, you may need to:
     - **Switch to Classic mode** temporarily
     - Go to **Setup** → **Manage Apps** → **Connected Apps**
     - Find your app and ensure it's **"Installed"**

### Step 3: Get Credentials

1. **Back in App Manager**, click on your Connected App
2. **Note down**:
   - **Consumer Key** (this is your Client ID)
   - **Consumer Secret** (this is your Client Secret)

### Step 4: Create Custom Object

1. **Go to Setup** → **Object Manager**
2. **Create new Custom Object**:
   - **Label**: `JSON Data`
   - **Plural Label**: `JSON Data`
   - **Object Name**: `JSON_Data`
   - **API Name**: `JSON_Data__c`

3. **Add Custom Field**:
   - **Field Label**: `JSON Data`
   - **Field Name**: `JSON_Data`
   - **Type**: `Text Area (Long)`
   - **Length**: `131,072`
   - **Visible Lines**: `10`

4. **Set Field-Level Security**:
   - Make the field visible to your profile

### Step 5: Verify Setup

**Test your setup**:
1. **Open your Salesforce org** in a new tab
2. **Navigate to**: `https://yourorg.salesforce.com/services/oauth2/authorize?response_type=code&client_id=YOUR_CONSUMER_KEY&redirect_uri=http://localhost:3000/api/oauth/callback`
3. **Replace** `YOUR_CONSUMER_KEY` with your actual Consumer Key
4. **You should see** a Salesforce login page (not an error)

If you get errors, double-check:
- ✅ Connected App is created
- ✅ OAuth settings are enabled
- ✅ Permitted Users is "All users may self-authorize"
- ✅ Callback URL matches exactly
- ✅ PKCE is enabled
- ✅ Consumer Key/Secret are correct in `.env`

## Installation

1. Clone or download the project
2. Navigate to the project root directory

### Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend` directory with your Salesforce credentials:

```env
SALESFORCE_CLIENT_ID=your_consumer_key_here
SALESFORCE_CLIENT_SECRET=your_consumer_secret_here
SALESFORCE_CALLBACK_URL=http://localhost:3000/api/oauth/callback
SALESFORCE_LOGIN_URL=https://login.salesforce.com
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   npm start
   ```
   The backend will run on `http://localhost:3000`

2. Start the frontend development server:
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will run on `http://localhost:5173`

3. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Click "Login with Salesforce" to authenticate
2. You'll be redirected to Salesforce login
3. After authentication, you'll be redirected back to the app
4. Use the form to create new JSON records
5. View, edit, or delete existing records in the table

## API Endpoints

### Backend Endpoints

- `GET /api/login` - Initiates OAuth login flow
- `GET /api/oauth/callback` - Handles OAuth callback and token exchange
- `GET /api/jsondata` - Retrieves all JSON_Data__c records for authenticated user
- `POST /api/jsondata` - Creates a new JSON_Data__c record
- `PATCH /api/jsondata/:id` - Updates a JSON_Data__c record
- `DELETE /api/jsondata/:id` - Deletes a JSON_Data__c record

### Authentication

All CRUD endpoints require an `x-session-id` header containing the session identifier obtained after OAuth login.

## Project Structure

```
salesforcepoc/
├── backend/
│   ├── server.js          # Express server with OAuth and CRUD endpoints
│   ├── package.json       # Backend dependencies
│   └── .env              # Environment variables (create this file)
├── frontend/
│   ├── src/
│   │   ├── App.tsx       # Main React component
│   │   ├── main.ts       # React app entry point
│   │   └── style.css     # Basic styling
│   ├── package.json      # Frontend dependencies
│   └── tsconfig.json     # TypeScript configuration
└── README.md             # This file
```

## Security Notes

- This is a POC implementation using in-memory session storage
- For production, implement proper session management and token refresh
- Store sensitive credentials securely (not in version control)
- Validate and sanitize all user inputs

## Troubleshooting

- Ensure Salesforce Connected App callback URL matches exactly
- Verify `JSON_Data__c` object and field permissions
- Check browser console for frontend errors
- Check backend console for API errors
- Ensure both servers are running on correct ports
