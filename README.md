# SMS Authentication with Firebase

A complete SMS authentication system with OTP verification, built with Node.js, Express, and Firebase. Perfect for learning and development purposes.

## Features

✅ **User Registration** with First Name, Last Name, and Phone Number  
✅ **OTP Generation** with automatic 5-minute expiration  
✅ **SMS Delivery** via Firebase + Twilio integration  
✅ **OTP Verification** with attempt limiting  
✅ **Firebase Authentication** user creation  
✅ **User Profiles** stored in Firestore  
✅ **Beautiful Frontend UI** for registration and verification  
✅ **RESTful API** endpoints for integration  
✅ **Free 10,000 SMS/month** quota for learning  

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** Firestore (Firebase)
- **Authentication:** Firebase Admin SDK
- **SMS Provider:** Twilio / Firebase Cloud Functions
- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Version Control:** Git & GitHub

## Project Structure

```
sms-authentication/
├── public/
│   └── index.html              # Frontend UI
├── routes/
│   └── auth.js                 # Authentication endpoints
├── utils/
│   ├── sms.js                  # SMS sending utilities
│   └── otp.js                  # OTP generation & validation
├── config/
│   └── firebase.js             # Firebase configuration
├── .env.example                # Environment variables template
├── .gitignore                  # Git ignore rules
├── package.json                # Project dependencies
├── server.js                   # Express server setup
├── SETUP_GUIDE.md             # Step-by-step setup instructions
└── README.md                   # This file
```

## Quick Start

### 1. Prerequisites
- Node.js 16+
- npm or yarn
- Firebase Account (free)
- Twilio Account (free trial)

### 2. Installation

```bash
# Clone repository
git clone https://github.com/CycoThee9/sms-authentication.git
cd sms-authentication

# Install dependencies
npm install
```

### 3. Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your Firebase credentials
nano .env
```

Add your Firebase service account credentials from:
[Firebase Console](https://console.firebase.google.com/) → Project Settings → Service Accounts

### 4. Run the Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will start on `http://localhost:5000`

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:5000
```

## API Endpoints

### Register User & Send OTP
```
POST /api/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "phoneNumber": "+12025551234"
}

Response: { message, phoneNumber }
```

### Verify OTP
```
POST /api/auth/verify-otp
Content-Type: application/json

{
  "phoneNumber": "+12025551234",
  "otp": "123456"
}

Response: { message, uid, customToken, user }
```

### Resend OTP
```
POST /api/auth/resend-otp
Content-Type: application/json

{
  "phoneNumber": "+12025551234"
}

Response: { message }
```

### Get User Profile
```
GET /api/auth/profile/:uid

Response: { user }
```

## Database Collections

### users
Stores verified users after OTP confirmation
```
{
  uid: string,
  firstName: string,
  lastName: string,
  phoneNumber: string,
  verified: boolean,
  createdAt: timestamp
}
```

### pending_users
Temporary storage for users awaiting OTP verification
```
{
  firstName: string,
  lastName: string,
  phoneNumber: string,
  createdAt: timestamp
}
```

### otps
OTP records with expiration tracking
```
{
  otp: string,
  phoneNumber: string,
  expiresAt: timestamp,
  createdAt: timestamp,
  attempts: number
}
```

### sms_logs
SMS delivery history and status
```
{
  phoneNumber: string,
  message: string,
  sentAt: timestamp,
  status: string
}
```

## Firebase Setup Steps

1. **Create Project** at [Firebase Console](https://console.firebase.google.com/)
2. **Enable Firestore** in Build → Firestore Database
3. **Enable Phone Authentication** in Build → Authentication
4. **Create Service Account** in Project Settings → Service Accounts
5. **Download credentials** and add to `.env`

[Detailed Setup Guide](./SETUP_GUIDE.md)

## SMS Gateway Configuration

### Option 1: Twilio (Recommended)
- Free $15 trial credit (~2,000 SMS)
- Can be extended with promotions
- Easy integration

### Option 2: Firebase Cloud Functions
- Use your own SMS provider
- Serverless execution
- Pay per use

### Option 3: Local Emulator
- Test without sending real SMS
- Development-only
- No costs

[SMS Gateway Setup Guide](./SETUP_GUIDE.md#sms-gateway-setup)

## Security Features

✅ **OTP Expiration:** 5-minute validity period  
✅ **Attempt Limiting:** 5 failed attempts = OTP invalidation  
✅ **Phone Number Validation:** E.164 format enforcement  
✅ **Service Account:** Secure credential management  
✅ **Firestore Security Rules:** Access control  
✅ **No Sensitive Data Logging:** Passwords/tokens excluded  

## Environment Variables

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY=your_private_key (with \n newlines)
FIREBASE_CLIENT_EMAIL=your_service_account_email

# Server Configuration
PORT=5000
NODE_ENV=development
```

[See .env.example](/.env.example)

## Frontend Features

- **Responsive Design:** Works on mobile, tablet, desktop
- **Two-Step Process:** Registration → OTP Verification
- **Live Timer:** Shows OTP expiration countdown
- **Error Handling:** User-friendly error messages
- **Success Confirmation:** Displays user details after verification
- **Resend Option:** Quick OTP resend link

## Error Handling

| Error | Cause | Solution |
|-------|-------|----------|
| Missing required fields | Incomplete form | Fill all fields |
| Invalid or expired OTP | OTP expired | Click "Resend OTP" |
| Too many failed attempts | 5+ wrong OTPs | Request new OTP |
| Firebase credentials error | Invalid config | Check .env file |
| SMS sending failed | SMS service issue | Check Twilio account |

## Testing

### With Frontend UI
1. Open `http://localhost:5000`
2. Enter your details
3. Click "Send OTP"
4. Check your phone for OTP
5. Enter OTP and verify

### With cURL
```bash
# Register
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","phoneNumber":"+12025551234"}'

# Verify
curl -X POST http://localhost:5000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"+12025551234","otp":"123456"}'
```

## Troubleshooting

### OTP Not Sending
- Verify phone number format: `+[country_code][number]`
- Check Firestore SMS logs for errors
- Ensure Twilio account has active credits

### Firebase Connection Error
- Verify .env credentials are correct
- Check Firebase project has Firestore enabled
- Ensure service account has proper permissions

### CORS Errors
- Server runs on `http://localhost:5000`
- Frontend and backend on same server
- Check CORS middleware in server.js

[Full Troubleshooting Guide](./SETUP_GUIDE.md#troubleshooting)

## Free Quota

**SMS:** 10,000/month (Firebase + Twilio free tier)
**Firestore:** 50,000 reads/day free
**Authentication:** Unlimited free users

## Production Checklist

- [ ] Update Security Rules in Firestore
- [ ] Remove test mode from Firestore
- [ ] Set up rate limiting on endpoints
- [ ] Enable HTTPS
- [ ] Set proper CORS origins
- [ ] Configure environment variables
- [ ] Set up monitoring and logging
- [ ] Add authentication tokens/sessions
- [ ] Implement email verification backup
- [ ] Set SMS spending limit

## Contributing

Contributions welcome! Feel free to:
- Report bugs
- Suggest improvements
- Submit pull requests
- Share feedback

## License

MIT License - feel free to use in your projects

## Support & Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [Twilio SMS API](https://www.twilio.com/docs/sms)
- [Express.js Guide](https://expressjs.com/)
- [Firestore Best Practices](https://firebase.google.com/docs/firestore/best-practices)

## Next Steps

1. Complete [Setup Guide](./SETUP_GUIDE.md)
2. Configure Firebase credentials
3. Test with frontend UI
4. Integrate into your application
5. Monitor SMS usage and costs

---

**Created with ❤️ for learning and development**

For detailed setup instructions, see [SETUP_GUIDE.md](./SETUP_GUIDE.md)
