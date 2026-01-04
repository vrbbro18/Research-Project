# Environment Variables Setup

## Quick Setup for Real WhatsApp Integration

1. Create a `.env` file in the project root directory (same level as `package.json`)

2. Add your Twilio credentials:

```env
TWILIO_ACCOUNT_SID=ACe47a21c54b636fe6764e38951ea5968d
TWILIO_AUTH_TOKEN=d1285921c5f998f865ac14d7a80dde1e
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
```

## Configuration Options

### Required for Real WhatsApp:
- `TWILIO_ACCOUNT_SID` - Your Twilio Account SID
- `TWILIO_AUTH_TOKEN` - Your Twilio Auth Token

### Optional:
- `TWILIO_WHATSAPP_FROM` - WhatsApp sender number (default: `whatsapp:+14155238886`)
- `TWILIO_CONTENT_SID` - Content Template SID for template-based messages

## Message Modes

### Regular Message Mode (Default)
If `TWILIO_CONTENT_SID` is not set, the system will send regular text messages.

### Content Template Mode
If `TWILIO_CONTENT_SID` is set, the system will use Twilio Content Templates.
You can also pass `contentVariables` in the format: `{"1":"value1","2":"value2"}`

## Security Note

**IMPORTANT:** Never commit your `.env` file to version control!
The `.env` file is already added to `.gitignore` for your protection.

