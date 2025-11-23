# Ngrok Setup Guide

## Quick Setup

### Step 1: Install Ngrok

Download from [ngrok.com](https://ngrok.com/download) or install via package manager:

```bash
# Windows (with Chocolatey)
choco install ngrok

# Mac
brew install ngrok

# Linux
# Download from ngrok.com
```

### Step 2: Start Your Backend Server

```bash
cd backend
npm start
```

Your backend should be running on `http://localhost:5000`

### Step 3: Start Ngrok Tunnel

In a **new terminal window**, run:

```bash
ngrok http 5000
```

You'll see output like:
```
Forwarding   https://unfacilitated-unhunted-randy.ngrok-free.dev -> http://localhost:5000
```

**Copy the HTTPS URL** (the one starting with `https://`)

### Step 4: Configure Frontend

Create or update `frontend/.env` file:

```env
REACT_APP_BACKEND_URL=https://unfacilitated-unhunted-randy.ngrok-free.dev
REACT_APP_USE_SSL=true
```

**Important:** 
- Use the **HTTPS URL** from ngrok (not HTTP)
- **Do NOT include `:5000`** - ngrok handles the port mapping automatically
- The URL should end with `.ngrok-free.dev` or `.ngrok.io`

### Step 5: Restart Frontend

```bash
cd frontend
npm start
```

---

## Common Issues

### Issue: Connection Timeout

**Possible Causes:**
1. **Ngrok tunnel is not running** - Make sure `ngrok http 5000` is active
2. **Backend server is not running** - Check that backend is running on port 5000
3. **Wrong URL in frontend** - Verify the URL in `frontend/.env` matches the ngrok HTTPS URL exactly

**Solution:**
1. Check ngrok terminal - it should show "Session Status: online"
2. Check backend terminal - it should show "Server running on..."
3. Verify the URL in `frontend/.env` matches exactly (no `:5000` at the end)

### Issue: URL includes `:5000`

**Problem:** The frontend is trying to connect to `https://your-ngrok-url.ngrok-free.dev:5000`

**Solution:** 
- Remove `:5000` from the URL in `frontend/.env`
- Ngrok URLs should be: `https://your-ngrok-url.ngrok-free.dev` (no port)

### Issue: "Invalid URL" or "Connection Refused"

**Solution:**
1. Make sure you're using the **HTTPS URL** from ngrok (not HTTP)
2. Check that ngrok is forwarding to the correct port (5000)
3. Restart both backend and frontend after changing `.env` file

---

## Ngrok Free vs Paid

### Free Plan (ngrok-free.dev)
- URLs change every time you restart ngrok
- May have connection limits
- Perfect for development and testing

### Paid Plan
- Static URLs (don't change)
- Better performance
- More features

---

## Alternative: Use Local IP Instead of Ngrok

If you're on the same network, you can use your local IP instead:

1. Find your IP address:
   - **Windows**: `ipconfig` (look for IPv4 Address)
   - **Mac/Linux**: `ifconfig` or `ip addr`

2. Update `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://192.168.1.100:5000
   REACT_APP_USE_SSL=false
   ```

3. Make sure backend is accessible from other devices on the same network

---

## Testing the Connection

### Test Backend Directly

```bash
curl https://your-ngrok-url.ngrok-free.dev
```

### Test from Browser

1. Open browser developer tools (F12)
2. Go to Network tab
3. Look for WebSocket connections - they should show as "101 Switching Protocols"
4. Check Console for connection logs

---

## Environment Variables Summary

### Frontend (`frontend/.env`)

```env
# For ngrok
REACT_APP_BACKEND_URL=https://your-ngrok-url.ngrok-free.dev
REACT_APP_USE_SSL=true

# For local development
# REACT_APP_BACKEND_URL=http://localhost:5000
# REACT_APP_USE_SSL=false
```

### Backend

No special configuration needed for ngrok - just run on port 5000.

---

## Quick Checklist

- [ ] Ngrok is installed
- [ ] Backend is running on port 5000
- [ ] Ngrok tunnel is active (`ngrok http 5000`)
- [ ] Copied the HTTPS URL from ngrok
- [ ] Updated `frontend/.env` with the ngrok URL (no `:5000`)
- [ ] Set `REACT_APP_USE_SSL=true` in frontend
- [ ] Restarted frontend server
- [ ] Checked browser console for connection logs

