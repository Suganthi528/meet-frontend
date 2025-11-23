# SSL/HTTPS Quick Start Guide

## Enable SSL in 3 Steps

### Step 1: Generate SSL Certificate

```bash
cd backend
npm run generate-ssl
```

Or manually:
```bash
cd backend
node generate-ssl-cert.js
```

This creates self-signed certificates in `backend/ssl/` directory.

**Note:** You need OpenSSL installed. If you get an error, install OpenSSL:
- **Windows**: Download from [Win32OpenSSL](https://slproweb.com/products/Win32OpenSSL.html)
- **Mac**: `brew install openssl`
- **Linux**: `sudo apt-get install openssl`

### Step 2: Enable SSL in Backend

Create `backend/.env` file:

```env
USE_SSL=true
PORT=5000
HOST=0.0.0.0
```

### Step 3: Enable SSL in Frontend

Create `frontend/.env` file:

```env
REACT_APP_USE_SSL=true
REACT_APP_BACKEND_URL=https://localhost:5000
```

### Step 4: Restart Servers

1. Restart backend: `cd backend && npm start`
2. Restart frontend: `cd frontend && npm start`

### Step 5: Handle Browser Warning

When you access the site, your browser will show a security warning because we're using a self-signed certificate (this is normal for development).

1. Click **"Advanced"** or **"Show Details"**
2. Click **"Proceed to localhost"** or **"Accept the Risk and Continue"**

---

## Verify SSL is Working

### Check Backend Logs

When you start the backend, you should see:
```
🔒 SSL enabled - Using HTTPS
🚀 Server running on https://localhost:5000
```

### Check Browser

1. Open browser developer tools (F12)
2. Go to **Network** tab
3. Look for requests - they should use `https://` protocol

### Test with curl

```bash
curl -k https://localhost:5000
```

The `-k` flag ignores certificate verification (for self-signed certs).

---

## Troubleshooting

### "SSL certificates not found"

**Solution:** Run `npm run generate-ssl` in the backend directory.

### "openssl: command not found"

**Solution:** Install OpenSSL (see Step 1).

### Browser shows "Not Secure"

**Solution:** This is normal for self-signed certificates. Click "Advanced" → "Proceed".

### Connection Refused

**Solution:**
1. Make sure backend is running
2. Check that `USE_SSL=true` in `backend/.env`
3. Verify certificates exist in `backend/ssl/`

---

## For Production

**⚠️ Important:** Self-signed certificates are NOT secure for production!

For production, use:
- **Let's Encrypt** (free) - See `backend/SSL_SETUP.md` for details
- Commercial CA certificates
- Cloud provider SSL (AWS, Azure, etc.)

See `backend/SSL_SETUP.md` for detailed production setup instructions.

---

## Disable SSL

To disable SSL and go back to HTTP:

1. Set `USE_SSL=false` in `backend/.env`
2. Set `REACT_APP_USE_SSL=false` in `frontend/.env`
3. Restart both servers

