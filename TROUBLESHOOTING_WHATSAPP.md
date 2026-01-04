# WhatsApp Integration Troubleshooting Guide

## Common Issues and Solutions

### Issue: Message Not Received After Clicking "Send WhatsApp Alert"

#### 1. **Check if Phone Number Joined Twilio Sandbox**

**This is the most common issue!**

The Twilio WhatsApp Sandbox only allows sending messages to phone numbers that have **joined the sandbox**.

**To join the sandbox:**
1. Open your WhatsApp on your phone (+94716596231)
2. Send a message to: **+1 415 523 8886**
3. You'll receive a code like: `join <random-word>`
4. Reply to that message with the code
5. You'll receive a confirmation that you've joined the sandbox

**Verify in Twilio Console:**
- Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
- Check if your number appears in the "Sandbox participants" list

#### 2. **Restart the Server**

After creating/updating `.env` file, you **must restart the server**:
```bash
# Stop the server (Ctrl+C)
# Then restart:
npm start
```

You should see: `✅ Real WhatsApp integration enabled (Twilio)`

#### 3. **Check Server Console Logs**

When you click "Send WhatsApp Alert", check the server console for:
- ✅ Success messages
- ❌ Error messages
- 📋 What template/variables are being used
- 📱 What phone number is being sent to

**Look for error messages like:**
- `21211` - Invalid phone number format
- `21217` - Phone number not in sandbox
- `21608` - Content template not approved
- `30007` - Message delivery failed

#### 4. **Verify Phone Number Format**

The phone number should be in format: `+94716596231`
- Must start with `+`
- Must include country code (94 for Sri Lanka)
- No spaces or dashes

**Check your driver data** in `data/drivers.js` - ensure phone numbers are correct.

#### 5. **Check Content Template Status**

If using Content Templates:
- Go to: https://www.twilio.com/console/content
- Verify template `HXb5b62575e6e4ff6129ad7c8efe1f983e` is **approved**
- Check if template variables match what you're sending

**Template variables being sent:**
```json
{
  "1": "vehicleNumber",
  "2": "driverName",
  "3": "violationCount",
  "4": "alertLevel",
  "5": "date"
}
```

Make sure your Twilio template uses variables `{{1}}`, `{{2}}`, etc., or update the code in `routes/alert.js` to match your template.

#### 6. **Test with Regular Message First**

To test if the basic integration works, temporarily disable Content Template:

In `.env` file, comment out or remove:
```
# TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

Restart server and try again. This will send a regular text message instead of using the template.

#### 7. **Check Twilio Account Balance**

- Go to: https://www.twilio.com/console
- Ensure your account has credits
- WhatsApp messages cost money (check pricing: https://www.twilio.com/whatsapp/pricing)

#### 8. **Check Twilio Logs**

1. Go to: https://www.twilio.com/console/sms/logs
2. Look for recent messages to your number
3. Check the status:
   - `sent` - Message was sent successfully
   - `failed` - Click to see error details
   - `queued` - Message is queued for delivery

## Quick Test Steps

1. ✅ **Join Sandbox**: Send "join" code to +1 415 523 8886
2. ✅ **Restart Server**: `npm start`
3. ✅ **Check .env**: Verify credentials are correct
4. ✅ **Check Logs**: Look for error messages in server console
5. ✅ **Test**: Click "Send WhatsApp Alert" button
6. ✅ **Check Twilio Console**: Verify message status

## Still Not Working?

1. **Check server console** for detailed error messages
2. **Check Twilio console logs** for API errors
3. **Try regular message mode** (disable Content Template)
4. **Verify phone number** is correct in driver data
5. **Ensure sandbox** is joined from that exact phone number

## Getting Help

If still not working, provide:
1. Server console output (full error message)
2. Twilio console log entry (status and error code)
3. Phone number format being used
4. Whether you've joined the sandbox

