# Virtual Try-On API Setup Guide

The Virtual Try-On API requires an OAuth2 Bearer token for authentication. This guide explains how to get the token.

## What is gcloud?

`gcloud` is the Google Cloud SDK (Software Development Kit) command-line tool. It's used to interact with Google Cloud services from your terminal.

## Option 1: Install Google Cloud SDK (Recommended for Development)

### Step 1: Install Google Cloud SDK

**macOS:**
```bash
# Using Homebrew
brew install --cask google-cloud-sdk

# Or download from:
# https://cloud.google.com/sdk/docs/install
```

**Linux:**
```bash
# Download and install
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

**Windows:**
Download and run the installer from:
https://cloud.google.com/sdk/docs/install

### Step 2: Authenticate
```bash
gcloud auth application-default login
```

This will open a browser window for you to sign in with your Google account.

### Step 3: Get Access Token
```bash
gcloud auth print-access-token
```

This will output a token like:
```
YOUR_ACCESS_TOKEN_HERE
```

### Step 4: Add to .env
Copy the token and add it to your `.env` file:
```env
VIRTUAL_TRY_ON_ACCESS_TOKEN=YOUR_ACCESS_TOKEN_HERE
```

## Option 2: Use Service Account (Recommended for Production)

For production, you should use a service account instead of user credentials.

### Step 1: Create Service Account
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to: IAM & Admin → Service Accounts
3. Click "Create Service Account"
4. Give it a name and grant it necessary permissions
5. Create and download a JSON key file

### Step 2: Use Service Account
You can use the service account JSON to generate tokens programmatically using the Google Auth Library.

## Important Notes

⚠️ **Token Expiration**: Access tokens expire after 1 hour. You'll need to refresh them periodically.

⚠️ **For Development**: Using `gcloud auth print-access-token` is fine, but you'll need to refresh it every hour.

⚠️ **For Production**: Implement automatic token refresh using:
- Service account JSON key
- Google Auth Library (for Node.js: `google-auth-library`)
- Automatic token refresh logic

## Troubleshooting

**"gcloud: command not found"**
- Install Google Cloud SDK (see Option 1, Step 1)

**"Permission denied"**
- Make sure you've authenticated: `gcloud auth application-default login`
- Check that your Google account has access to the project

**"Token expired"**
- Tokens expire after 1 hour
- Run `gcloud auth print-access-token` again to get a new token
- For production, implement automatic refresh

## Alternative: Skip Virtual Try-On

If you don't want to set up Virtual Try-On, the system will automatically fall back to showing the generated outfit image directly (without the "try it on" feature).
