# WhatsApp Integration Setup Guide

This project supports real WhatsApp messaging via Twilio's WhatsApp API.

## Quick Start (Simulation Mode)

By default, the system runs in **simulation mode** - no setup required. All alerts are logged to console.

## Enable Real WhatsApp Messaging

### Step 1: Create Twilio Account

1. Sign up for a free Twilio account: https://www.twilio.com/try-twilio
2. Verify your email and phone number

### Step 2: Get Twilio Credentials

1. Go to: https://www.twilio.com/console
2. Copy your **Account SID** and **Auth Token**

### Step 3: Enable WhatsApp Sandbox

1. Go to: https://www.twilio.com/console/sms/whatsapp/learn
2. Follow the instructions to join the WhatsApp Sandbox
3. You'll receive a code via WhatsApp (e.g., "join <code>")
4. Send the code to the sandbox number to activate

**Note:** The sandbox allows you to send messages to verified numbers only. For production, you need a verified WhatsApp Business number.

### Step 4: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   TWILIO_AUTH_TOKEN=your_auth_token_here
   TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
   ```

### Step 5: Restart Server

After setting up `.env`, restart the server:
```bash
npm start
```

You should see: `✅ Real WhatsApp integration enabled (Twilio)`

## Testing

### Sandbox Testing

To send messages in sandbox mode:
1. The recipient must first join the sandbox by sending the join code
2. Use the format: `whatsapp:+1234567890` (with country code)

### Example Phone Number Format

- ✅ Correct: `+1234567890`, `+94771234567`
- ❌ Wrong: `1234567890`, `071234567`

The system will automatically format numbers for Twilio.

## Production Setup

For production use:

1. **Verify WhatsApp Business Number:**
   - Apply for WhatsApp Business API access
   - Verify your business number through Twilio
   - This may require business verification and approval

2. **Update TWILIO_WHATSAPP_FROM:**
   - Change from sandbox number to your verified business number
   - Format: `whatsapp:+1234567890`

3. **Cost Considerations:**
   - Twilio WhatsApp messages have per-message costs
   - Check current pricing: https://www.twilio.com/whatsapp/pricing

## Troubleshooting

### "Twilio client not initialized"
- Check that `.env` file exists and contains correct credentials
- Verify credentials are correct (no extra spaces)

### "Failed to send via Twilio"
- Verify recipient number is in sandbox (for testing)
- Check phone number format (must include country code with +)
- Verify Twilio account has sufficient credits

### Messages not received
- For sandbox: Recipient must join sandbox first
- Verify phone number format
- Check Twilio console for message logs: https://www.twilio.com/console/sms/logs

## Fallback Behavior

If Twilio credentials are not set or sending fails, the system automatically falls back to simulation mode and logs the alert to console.

