# WhatsApp Alert Setup Guide

This guide explains how to configure WhatsApp alerts for the Driver Risk Detection System.

## Overview

The system uses `whatsapp-web.js` to send real WhatsApp messages when high-risk driver behavior is detected. The WhatsApp client connects using WhatsApp Web protocol.

## Initial Setup

### Step 1: Install Dependencies

Dependencies are already installed. If you need to reinstall:

```bash
cd backend
npm install whatsapp-web.js qrcode-terminal
```

### Step 2: Configure Emergency Contacts

You can configure emergency contact phone numbers in two ways:

#### Option 1: Environment Variable (Recommended)

Create a `.env` file in the `backend` directory (or set environment variable):

```bash
WHATSAPP_CONTACTS=1234567890,0987654321,1122334455
```

**Important:** 
- Phone numbers should include country code (without + sign)
- Format: `countrycode + number` (e.g., `1234567890` for US number)
- Multiple numbers separated by commas
- No spaces around commas

**Examples:**
- US number: `1234567890`
- UK number: `447911123456`
- India number: `919876543210`

#### Option 2: Edit Service File

Edit `backend/services/whatsapp.service.js` and modify the `EMERGENCY_CONTACTS` array:

```javascript
const EMERGENCY_CONTACTS = ['1234567890', '0987654321'];
```

### Step 3: Start the Server

```bash
cd backend
npm start
```

### Step 4: Scan QR Code

When the server starts, you'll see a QR code in the terminal:

1. Open WhatsApp on your phone
2. Go to **Settings** → **Linked Devices**
3. Tap **"Link a Device"**
4. Scan the QR code displayed in the terminal
5. Wait for the "WhatsApp client is ready!" message

**Note:** The QR code is only shown once. If you need to see it again, delete the `.wwebjs_auth` folder in the `backend` directory and restart the server.

## How It Works

1. When a high-risk driver behavior is detected (risk level: HIGH), the system automatically:
   - Creates an emergency notification
   - Sends WhatsApp messages to all configured emergency contacts
   - Logs the alert in the system

2. The WhatsApp message includes:
   - Alert type and severity
   - Detection category
   - Timestamp
   - Confidence level
   - Alert ID

## Testing

### Check WhatsApp Status

You can check if WhatsApp is ready by calling:

```bash
GET http://localhost:3001/api/notifications/whatsapp/status
```

Response:
```json
{
  "success": true,
  "whatsapp": {
    "ready": true,
    "contactsConfigured": 2,
    "contacts": ["1234567890", "0987654321"]
  }
}
```

### Test Alert

Upload a high-risk driver image through the API to trigger a test alert.

## Troubleshooting

### WhatsApp Not Ready

- **Issue:** "WhatsApp client is not ready"
- **Solution:** 
  - Make sure you've scanned the QR code
  - Check if WhatsApp Web is still connected on your phone
  - Delete `.wwebjs_auth` folder and restart server

### Messages Not Sending

- **Issue:** Messages not being delivered
- **Solutions:**
  - Verify phone numbers are correct (include country code)
  - Ensure the phone number has WhatsApp installed
  - Check that the contact has saved your number in their phone
  - Verify WhatsApp Web is still connected

### QR Code Not Appearing

- **Issue:** QR code not shown in terminal
- **Solution:**
  - Delete `.wwebjs_auth` folder in `backend` directory
  - Restart the server
  - The QR code will appear on first startup

### Authentication Failed

- **Issue:** "WhatsApp authentication failed"
- **Solution:**
  - Delete `.wwebjs_auth` folder
  - Restart server
  - Scan QR code again

## Security Notes

⚠️ **Important Security Considerations:**

1. **Phone Number Privacy:** The phone number used to link WhatsApp will be visible to recipients
2. **Unofficial API:** `whatsapp-web.js` uses an unofficial WhatsApp Web protocol
3. **Rate Limiting:** WhatsApp may rate-limit messages if too many are sent quickly
4. **Production Use:** For production systems, consider using official WhatsApp Business API (Twilio, etc.)

## Alternative: Official WhatsApp Business API

For production deployments, consider using:
- **Twilio WhatsApp API** (requires account setup)
- **WhatsApp Business API** (official, requires business verification)

These provide more reliable delivery and better support for production use.

## Files Modified

- `backend/services/whatsapp.service.js` - WhatsApp service implementation
- `backend/services/notification.service.js` - Integrated WhatsApp alerts
- `backend/server.js` - Initializes WhatsApp on startup
- `backend/routes/notification.routes.js` - Added status endpoint

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify phone numbers are correctly formatted
3. Ensure WhatsApp Web connection is active
4. Review the troubleshooting section above

