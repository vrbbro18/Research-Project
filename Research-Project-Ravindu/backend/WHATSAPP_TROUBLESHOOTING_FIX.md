# WhatsApp Message Not Sending - Troubleshooting Guide

## Quick Diagnosis

Run this command to check WhatsApp status:
```bash
cd backend
node scripts/check-whatsapp.js
```

## Common Issues & Solutions

### Issue 1: WhatsApp Not Ready (Most Common)

**Symptoms:**
- Messages triggered but not received
- No error in logs, or "WhatsApp client is NOT ready" message

**Solution:**
1. **Check if QR code was scanned:**
   - When server starts, look for a QR code in the terminal
   - Scan it with your WhatsApp mobile app
   - Wait for "WhatsApp client is ready!" message

2. **If QR code not showing:**
   - Restart the backend server
   - Look for QR code in startup logs
   - The QR code appears in the terminal output

3. **If already scanned but disconnected:**
   - WhatsApp Web may have disconnected
   - Restart the server
   - Scan QR code again

### Issue 2: Phone Number Format

**Current Number:** `94716596231`

**Check:**
- ✅ Must include country code (94 for Sri Lanka)
- ✅ No + sign
- ✅ No spaces or dashes
- ✅ Should be: `94716596231`

**To verify:**
```bash
# Check .env file
cat backend/.env
# Should show: WHATSAPP_CONTACTS=94716596231
```

### Issue 3: Contact Not Saved in WhatsApp

**Problem:**
- WhatsApp may not send to unsaved numbers
- Number must be in your WhatsApp contacts

**Solution:**
1. Open WhatsApp on your phone
2. Save the number `+94716596231` in your contacts
3. Make sure it's saved with the country code
4. Try sending a test message manually first

### Issue 4: WhatsApp Web Disconnected

**Symptoms:**
- Was working before, now not working
- Server shows "WhatsApp client is NOT ready"

**Solution:**
1. Stop the backend server (Ctrl+C)
2. Delete the auth folder:
   ```bash
   cd backend
   rm -rf .wwebjs_auth  # Linux/Mac
   # or
   Remove-Item -Recurse -Force .wwebjs_auth  # Windows PowerShell
   ```
3. Restart the server
4. Scan QR code again

### Issue 5: Server Logs Not Showing WhatsApp Activity

**Check:**
1. Look for these messages in server logs:
   ```
   [WHATSAPP] Loaded 1 emergency contact(s): 94716596231
   [WHATSAPP] Sending message to 94716596231...
   ```

2. If you see errors, check:
   - "WhatsApp client is NOT ready" → Need to scan QR code
   - "No emergency contacts configured" → Check .env file
   - "Failed to send" → Check phone number format

## Step-by-Step Fix

### Step 1: Verify Configuration
```bash
cd backend
cat .env
# Should show: WHATSAPP_CONTACTS=94716596231
```

### Step 2: Check WhatsApp Status
```bash
node scripts/check-whatsapp.js
```

### Step 3: If Not Ready, Reconnect
1. Stop server (Ctrl+C)
2. Start server: `npm start`
3. Look for QR code in terminal
4. Scan with WhatsApp mobile app
5. Wait for "WhatsApp client is ready!"

### Step 4: Test Sending
```bash
node scripts/check-whatsapp.js
# This will send a test message
```

### Step 5: Check Your Phone
- Make sure WhatsApp is open
- Check for the test message
- If received, system is working!

## Debugging Commands

### Check WhatsApp Status via API
```bash
curl http://localhost:3001/api/notifications/whatsapp/status
```

### View Server Logs
When an alert is triggered, you should see:
```
📱 Sending WhatsApp alerts to 1 contact(s)...
[WHATSAPP] Sending message to 94716596231...
[WHATSAPP] ✅ Message sent successfully to 94716596231
```

If you see errors instead, note the error message.

## Still Not Working?

1. **Check server logs** for detailed error messages
2. **Verify phone number** is correct in .env
3. **Save contact** in WhatsApp with country code
4. **Restart server** and scan QR code again
5. **Test manually** - try sending a message from WhatsApp Web to the number

## Contact Format Requirements

For WhatsApp Web.js, the number format should be:
- ✅ Correct: `94716596231` (country code + number, no +)
- ❌ Wrong: `+94716596231` (has + sign)
- ❌ Wrong: `9471 659 6231` (has spaces)
- ❌ Wrong: `0716596231` (missing country code)

## Need More Help?

Check the full logs when triggering an alert. The system will show:
- WhatsApp status
- Contact configuration
- Send attempt results
- Any error messages

Look for lines starting with `[WHATSAPP]` in your server console.

