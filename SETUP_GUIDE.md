# SMS Authentication with Firebase - Setup Guide

This guide will help you set up SMS authentication with Firebase's free 10,000 SMS per month quota for learning purposes.

## Table of Contents
1. [Firebase Project Setup](#firebase-project-setup)
2. [Environment Configuration](#environment-configuration)
3. [Installation](#installation)
4. [Running the Application](#running-the-application)
5. [API Endpoints](#api-endpoints)
6. [Firestore Database Structure](#firestore-database-structure)
7. [SMS Gateway Setup](#sms-gateway-setup)
8. [Testing](#testing)

---

## Firebase Project Setup

### Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **"Create a project"**
3. Enter project name: `sms-authentication`
4. Accept the terms and click **"Create project"**
5. Wait for project creation (this takes about 1-2 minutes)

### Step 2: Enable Firestore Database

1. In the Firebase Console, go to **Build** → **Firestore Database**
2. Click **"Create database"**
3. Select **"Start in test mode"** (for development)
4. Choose a region close to your location
5. Click **"Create"**

### Step 3: Enable Authentication

1. Go to **Build** → **Authentication**
2. Click **"Get started"**
3. Click on **"Phone"** sign-in method
4. Toggle **"Enable"**
5. Click **"Save"**

### Step 4: Create a Service Account

1. Go to **Project Settings** (gear icon in top-left)
2. Click **"Service Accounts"** tab
3. Select **Node.js** as the SDK
4. Click **"Generate new private key"**
5. A JSON file will download - **Keep this file secure!**
6. Copy the contents of this JSON file for the next step

---

## Environment Configuration

### Step 1: Set Up Environment Variables

1. Create a `.env` file in the root directory
2. Add the following variables from your Firebase service account JSON:

```bash
FIREBASE_PROJECT_ID=your_project_id_here
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your_email@your_project.iam.gserviceaccount.com
PORT=5000
NODE_ENV=development
```

### Step 2: Get Your Credentials

1. Open the service account JSON file you downloaded
2. Copy the following fields:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the `\n` characters)
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

**⚠️ Security Note:** Never commit `.env` file to version control. Use `.env.example` as template.

---

## Installation

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Step 1: Clone and Install Dependencies

```bash
cd sms-authentication
npm install
```

### Step 2: Verify Installation

```bash
npm start
```

You should see:
```
Server running on port 5000
```

---

## Running the Application

### Development Mode (with auto-reload)

```bash
npm run dev
```

### Production Mode

```bash
npm start
```

### Access the Frontend

Open your browser and navigate to:
```
http://localhost:5000
```

---

## API Endpoints

### 1. Register User & Send OTP
**POST** `/api/auth/register`

Request:
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+12025551234"
}
```

Response:
```json
{
  "message": "OTP sent successfully",
  "phoneNumber": "+12025551234"
}
```

### 2. Verify OTP
**POST** `/api/auth/verify-otp`

Request:
```json
{
  "phoneNumber": "+12025551234",
  "otp": "123456"
}
```

Response:
```json
{
  "message": "User registered successfully",
  "uid": "user_uid_here",
  "customToken": "firebase_custom_token",
  "user": {
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+12025551234"
  }
}
```

### 3. Resend OTP
**POST** `/api/auth/resend-otp`

Request:
```json
{
  "phoneNumber": "+12025551234"
}
```

Response:
```json
{
  "message": "OTP resent successfully"
}
```

### 4. Get User Profile
**GET** `/api/auth/profile/:uid`

Response:
```json
{
  "user": {
    "uid": "user_uid_here",
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+12025551234",
    "verified": true,
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

---

## Firestore Database Structure

### Collections:

#### 1. **users** (Verified users)
```
users/
  ├── {uid}
  │   ├── uid: string
  │   ├── firstName: string
  │   ├── lastName: string
  │   ├── phoneNumber: string
  │   ├── verified: boolean
  │   └── createdAt: timestamp
```

#### 2. **pending_users** (Awaiting OTP verification)
```
pending_users/
  ├── {phoneNumber}
  │   ├── firstName: string
  │   ├── lastName: string
  │   ├── phoneNumber: string
  │   └── createdAt: timestamp
```

#### 3. **otps** (OTP records)
```
otps/
  ├── {phoneNumber}
  │   ├── otp: string
  │   ├── phoneNumber: string
  │   ├── expiresAt: timestamp
  │   ├── createdAt: timestamp
  │   └── attempts: number
```

#### 4. **sms_logs** (SMS history)
```
sms_logs/
  ├── {docId}
  │   ├── phoneNumber: string
  │   ├── message: string
  │   ├── sentAt: timestamp
  │   └── status: string
```

---

## SMS Gateway Setup

### Option 1: Firebase Cloud Functions (Recommended for Production)

#### Prerequisites
- Firebase CLI installed: `npm install -g firebase-tools`
- Firebase project initialized

#### Step 1: Initialize Cloud Functions

```bash
firebase init functions
```

Choose:
- Language: **JavaScript**
- Use ESLint: **Yes** (or No, your choice)

#### Step 2: Create Cloud Function for SMS

Create `functions/index.js`:

```javascript
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

exports.sendSMS = functions.firestore
  .document("sms_queue/{docId}")
  .onCreate(async (snap, context) => {
    const { phoneNumber, message } = snap.data();

    try {
      const result = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });

      await snap.ref.parent.doc(snap.ref.id).update({
        status: "sent",
        messageId: result.sid,
        sentAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`SMS sent successfully: ${result.sid}`);
    } catch (error) {
      console.error("Error sending SMS:", error);
      await snap.ref.parent.doc(snap.ref.id).update({
        status: "failed",
        error: error.message,
      });
    }
  });
```

#### Step 3: Deploy Cloud Functions

```bash
firebase deploy --only functions
```

### Option 2: Using Twilio (Free 10,000 SMS/month with Firebase integration)

#### Prerequisites
- Twilio Account (free trial includes $15 credit)

#### Step 1: Create Twilio Account

1. Go to [Twilio Console](https://www.twilio.com/console)
2. Sign up for a free account
3. You'll get a free trial phone number

#### Step 2: Get Twilio Credentials

1. Copy your:
   - Account SID
   - Auth Token
   - Phone Number (from Phone Numbers → Manage Current Numbers)

#### Step 3: Update Environment Variables

Add to `.env`:
```bash
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

#### Step 4: Install Twilio SDK

```bash
npm install twilio
```

#### Step 5: Update SMS Utility

Create `utils/sms-twilio.js`:

```javascript
import twilio from "twilio";
import dotenv from "dotenv";

dotenv.config();

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(phoneNumber, message) {
  try {
    const result = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phoneNumber,
    });

    console.log(`SMS sent with SID: ${result.sid}`);
    return { success: true, messageId: result.sid };
  } catch (error) {
    console.error("Twilio error:", error);
    throw new Error("Failed to send SMS");
  }
}
```

### Option 3: Firebase SMS Auth Emulator (For Testing Only)

The Firebase emulator allows you to test SMS locally without actually sending messages.

#### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

#### Step 2: Initialize Emulator

```bash
firebase init emulators
```

#### Step 3: Start Emulator

```bash
firebase emulators:start
```

---

## Firestore Security Rules

Create proper security rules for production. Go to **Firestore Database** → **Rules**:

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Allow read/write to authenticated users for their own profile
    match /users/{uid} {
      allow read, write: if request.auth.uid == uid;
    }
    
    // Restrict pending_users (server-only)
    match /pending_users/{document=**} {
      allow read, write: if false;
    }
    
    // Restrict OTPs (server-only)
    match /otps/{document=**} {
      allow read, write: if false;
    }
    
    // Allow admins to read SMS logs
    match /sms_logs/{document=**} {
      allow read: if request.auth.token.admin == true;
      allow write: if false;
    }
  }
}
```

---

## Testing

### Manual Testing with cURL

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "phoneNumber": "+12025551234"
  }'
```

#### 2. Verify OTP
```bash
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "+12025551234",
    "otp": "123456"
  }'
```

### Using Frontend UI

1. Open `http://localhost:5000`
2. Fill in your details
3. Click "Send OTP"
4. Enter the OTP sent to your phone
5. Click "Verify OTP"

---

## Troubleshooting

### "Firebase credentials not valid"
- Check `.env` file for correct credentials
- Ensure private key includes `\n` newlines
- Verify service account has Firestore and Auth permissions

### "OTP not sending"
- Verify phone number format (+country_code)
- Check Firestore SMS logs collection for errors
- Ensure Twilio/Firebase SMS service is properly configured

### "CORS errors"
- Frontend should be served from same domain or use proper CORS headers
- Check server.js CORS configuration

### Port 5000 already in use
```bash
# Kill process using port 5000
# macOS/Linux:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## Free SMS Quota Information

**Firebase + Twilio Free Tier:**
- 10,000 SMS messages per month (free)
- After free tier: ~$0.0075 per SMS
- Trial credit covers initial usage

**Avoid Overage Charges:**
1. Monitor usage in Twilio console
2. Set rate limits on API endpoints
3. Implement cooldown between OTP requests
4. Validate phone numbers before sending SMS

---

## Next Steps

1. **Add Rate Limiting:** Prevent abuse of OTP endpoints
2. **Email Verification:** Add email as second factor
3. **Two-Factor Authentication:** Combine SMS + authenticator app
4. **Session Management:** Implement JWT tokens for sessions
5. **Database Backup:** Set up automated Firestore backups

---

## Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Admin SDK](https://firebase.google.com/docs/database/admin/start)
- [Twilio SMS Docs](https://www.twilio.com/docs/sms)
- [Express.js Guide](https://expressjs.com/)

---

## Support

For issues or questions:
1. Check Firebase console for error logs
2. Review server console output
3. Check Firestore collections for data consistency
4. Review SMS logs collection for delivery status

**Happy coding! 🚀**
