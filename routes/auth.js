import express from 'express';
import { auth, db } from '../config/firebase.js';
import { sendSMS } from '../utils/sms.js';
import { generateOTP, validateOTP, storeOTP } from '../utils/otp.js';

const router = express.Router();

// Register endpoint - Send OTP via SMS
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber } = req.body;

    // Validate input
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Format phone number (ensure it starts with country code)
    const formattedPhone = phoneNumber.startsWith('+') 
      ? phoneNumber 
      : `+1${phoneNumber}`;

    // Generate OTP
    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    await storeOTP(formattedPhone, otp);

    // Send SMS
    await sendSMS(formattedPhone, `Your SMS authentication OTP is: ${otp}. Valid for 5 minutes.`);

    // Store user data temporarily
    await db.collection('pending_users').doc(formattedPhone).set({
      firstName,
      lastName,
      phoneNumber: formattedPhone,
      createdAt: new Date(),
    });

    res.status(200).json({
      message: 'OTP sent successfully',
      phoneNumber: formattedPhone,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verify OTP endpoint
router.post('/verify-otp', async (req, res) => {
  try {
    const { phoneNumber, otp } = req.body;

    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: 'Phone number and OTP are required' });
    }

    // Validate OTP
    const isValid = await validateOTP(phoneNumber, otp);

    if (!isValid) {
      return res.status(401).json({ error: 'Invalid or expired OTP' });
    }

    // Get pending user data
    const userDoc = await db.collection('pending_users').doc(phoneNumber).get();

    if (!userDoc.exists) {
      return res.status(400).json({ error: 'User registration not found' });
    }

    const userData = userDoc.data();

    // Create Firebase user
    const userRecord = await auth.createUser({
      phoneNumber,
      displayName: `${userData.firstName} ${userData.lastName}`,
    });

    // Store verified user in Firestore
    await db.collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      firstName: userData.firstName,
      lastName: userData.lastName,
      phoneNumber,
      verified: true,
      createdAt: new Date(),
    });

    // Delete pending user
    await db.collection('pending_users').doc(phoneNumber).delete();

    // Delete OTP
    await db.collection('otps').doc(phoneNumber).delete();

    // Generate custom token
    const customToken = await auth.createCustomToken(userRecord.uid);

    res.status(200).json({
      message: 'User registered successfully',
      uid: userRecord.uid,
      customToken,
      user: {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  try {
    const { phoneNumber } = req.body;

    if (!phoneNumber) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    // Generate new OTP
    const otp = generateOTP();

    // Store OTP with expiration (5 minutes)
    await storeOTP(phoneNumber, otp);

    // Send SMS
    await sendSMS(phoneNumber, `Your new SMS authentication OTP is: ${otp}. Valid for 5 minutes.`);

    res.status(200).json({ message: 'OTP resent successfully' });
  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user profile endpoint
router.get('/profile/:uid', async (req, res) => {
  try {
    const { uid } = req.params;

    const userDoc = await db.collection('users').doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user: userDoc.data() });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
