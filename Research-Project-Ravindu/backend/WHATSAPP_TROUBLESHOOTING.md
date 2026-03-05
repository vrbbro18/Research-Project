# WhatsApp Message Troubleshooting Guide

## Problem: Messages Not Sending for HIGH Risk

If WhatsApp messages are not being sent when HIGH risk is detected, check the following:

### 1. Check WhatsApp Connection Status

**Check if WhatsApp is ready:**
- When you start the server, you should see: `✅ WhatsApp client is ready!`
- If you see a QR code, you need to scan it first
- Check the status endpoint: `GET http://localhost:3001/api/notifications/whatsapp/status`

**Response should show:**
```json
{
  "success": true,
  "whatsapp": {
    "ready": true,
    "contactsConfigured": 1,
    "contacts": ["94716596231"]
  }
}
```

### 2. Check Environment Variables

**Verify .env file exists and is loaded:**
- File location: `backend/.env`
- Should contain: `WHATSAPP_CONTACTS=94716596231`
- Make sure server.js loads dotenv (it should be at the top: `require('dotenv').config()`)

**Check if contacts are loaded:**
- When server starts, you should see: `[WHATSAPP] Loaded 1 emergency contact(s): 94716596231`
- If you see: `⚠️ No emergency contacts loaded`, the .env file is not being read

### 3. Check Server Logs

When a HIGH risk is detected, you should see detailed logs:

**Good (Message Sent):**
```
📱 WhatsApp Status Check:
   - Ready: ✅ Yes
   - Contacts Configured: 1
   - Contact Numbers: 94716596231
[WHATSAPP] Attempting to send alert for emergency (high)
[WHATSAPP] Sending message to 94716596231...
[WHATSAPP] ✅ Message sent successfully to 94716596231
   ✅ WhatsApp alerts sent: 1/1 successful
```

**Bad (Not Ready):**
```
📱 WhatsApp Status Check:
   - Ready: ❌ No
   - Contacts Configured: 1
❌ [WHATSAPP] WhatsApp client is NOT ready!
   ⚠️ WhatsApp message was NOT sent.
```

**Bad (No Contacts):**
```
📱 WhatsApp Status Check:
   - Ready: ✅ Yes
   - Contacts Configured: 0
❌ [WHATSAPP] No emergency contacts configured!
   ⚠️ WhatsApp message was NOT sent.
```

### 4. Common Issues and Solutions

#### Issue 1: WhatsApp Not Ready
**Symptoms:**
- Status shows `"ready": false`
- Logs show: `❌ [WHATSAPP] WhatsApp client is NOT ready!`

**Solutions:**
1. Check if QR code was scanned
2. Restart the server and scan QR code again
3. Delete `.wwebjs_auth` folder and reconnect
4. Check if WhatsApp Web is still connected on your phone

#### Issue 2: No Contacts Configured
**Symptoms:**
- Status shows `"contactsConfigured": 0`
- Logs show: `❌ [WHATSAPP] No emergency contacts configured!`

**Solutions:**
1. Check `.env` file exists in `backend/` directory
2. Verify format: `WHATSAPP_CONTACTS=94716596231` (no spaces, no quotes)
3. Restart server after changing .env file
4. Check server startup logs for: `[WHATSAPP] Loaded X emergency contact(s)`

#### Issue 3: Phone Number Format Error
**Symptoms:**
- Logs show: `❌ Failed to send WhatsApp message`
- Error mentions invalid number or chat not found

**Solutions:**
1. Phone number must include country code (no + sign)
2. Format: `94716596231` (Sri Lanka: 94 + number)
3. Number must have WhatsApp installed
4. Number must be saved in your phone's contacts (sometimes required)

#### Issue 4: Message Sending Error
**Symptoms:**
- Logs show: `[WHATSAPP] ❌ Failed to send WhatsApp message`
- Error details in logs

**Solutions:**
1. Check error message in logs
2. Common errors:
   - "Chat not found" → Number not in contacts or wrong format
   - "Not authorized" → WhatsApp disconnected, reconnect
   - "Rate limit" → Wait a few seconds between messages

### 5. Testing Steps

1. **Check Status:**
   ```bash
   curl http://localhost:3001/api/notifications/whatsapp/status
   ```

2. **Test with HIGH Risk Image:**
   - Upload an image that triggers HIGH risk
   - Watch server console logs
   - Look for detailed WhatsApp status messages

3. **Verify Phone Number:**
   - Make sure `94716596231` is correct
   - Test by sending a manual message from your WhatsApp
   - Ensure the number has WhatsApp installed

### 6. Debug Mode

The updated code now includes detailed logging. When a HIGH risk is detected, you'll see:
- WhatsApp connection status
- Number of contacts configured
- Each step of the sending process
- Success/failure for each contact
- Detailed error messages if something fails

### 7. Quick Fixes

**If messages still not sending:**

1. **Restart Server:**
   ```bash
   cd backend
   npm start
   ```

2. **Reconnect WhatsApp:**
   - Delete `.wwebjs_auth` folder
   - Restart server
   - Scan QR code again

3. **Verify .env:**
   ```bash
   cd backend
   cat .env
   # Should show: WHATSAPP_CONTACTS=94716596231
   ```

4. **Check Server Logs:**
   - Look for `[WHATSAPP]` messages
   - Check for error messages
   - Verify status messages

### 8. Still Not Working?

Check the server console when you upload a HIGH risk image. The new logging will show exactly where it's failing:
- ✅ If ready
- ✅ If contacts loaded
- ✅ If message sending attempted
- ✅ Success/failure details

Share the console logs if you need further help!

