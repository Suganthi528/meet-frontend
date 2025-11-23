# Connection Error Troubleshooting Guide

## Quick Fixes

### 1. Check Your .env File

**Location:** `frontend/.env`

**Must contain:**
```env
REACT_APP_BACKEND_URL=https://unfacilitated-unhunted-randy.ngrok-free.dev
REACT_APP_USE_SSL=true
```

**CRITICAL:** 
- ✅ Use HTTPS (not HTTP)
- ✅ NO `:5000` at the end
- ✅ URL should match exactly what ngrok shows

### 2. Restart Frontend After .env Changes

React does NOT automatically reload `.env` files. You MUST restart:

```bash
# Stop the frontend (Ctrl+C)
# Then restart:
cd frontend
npm start
```

### 3. Verify Ngrok is Running

In a separate terminal, run:
```bash
ngrok http 5000
```

You should see:
```
Forwarding   https://unfacilitated-unhunted-randy.ngrok-free.dev -> http://localhost:5000
```

**Important:** 
- The HTTPS URL is what you need (not HTTP)
- Copy the EXACT URL shown
- Make sure it matches your `.env` file

### 4. Verify Backend is Running

```bash
cd backend
npm start
```

You should see:
```
🚀 Server running on http://localhost:5000
```

---

## Step-by-Step Debugging

### Step 1: Check Browser Console

1. Open browser (F12)
2. Go to **Console** tab
3. Look for these logs:
   - `🔗 Final backend URL: ...`
   - `📝 Using REACT_APP_BACKEND_URL: ...`
   - `❌ Socket connection error: ...`

**What to check:**
- Does the URL show `:5000` at the end? → **WRONG** (remove it)
- Does the URL use HTTP instead of HTTPS? → **WRONG** (use HTTPS)
- Does the URL match your ngrok URL exactly? → Should match

### Step 2: Verify Environment Variables

In browser console, check:
```javascript
// Should show your ngrok URL
console.log(process.env.REACT_APP_BACKEND_URL);
```

If it shows `undefined`, your `.env` file isn't being read:
1. Check file is named exactly `.env` (not `.env.txt`)
2. Check file is in `frontend/` directory
3. Restart frontend server

### Step 3: Test Backend Directly

Open a new terminal and test:

```bash
# Test if backend is accessible
curl http://localhost:5000

# Test if ngrok is forwarding correctly
curl https://unfacilitated-unhunted-randy.ngrok-free.dev
```

Both should return something (even if it's an error, it means the connection works).

### Step 4: Check Ngrok Web Interface

1. Open browser
2. Go to: `http://localhost:4040` (ngrok web interface)
3. Check if requests are coming through
4. Look for any errors

---

## Common Issues and Solutions

### Issue: URL Still Has `:5000`

**Symptom:** Backend URL shows `https://...ngrok-free.dev:5000`

**Solution:**
1. Check `frontend/.env` - remove `:5000` if present
2. Restart frontend server
3. Clear browser cache (Ctrl+Shift+R)

### Issue: "Connection Timeout"

**Possible Causes:**
1. Backend not running
2. Ngrok not running
3. Wrong URL in .env
4. Firewall blocking connection

**Solution:**
1. Verify backend is running: `curl http://localhost:5000`
2. Verify ngrok is running: Check terminal with `ngrok http 5000`
3. Verify URL in `.env` matches ngrok HTTPS URL exactly
4. Check firewall settings

### Issue: "CORS Error"

**Symptom:** Browser console shows CORS-related errors

**Solution:**
1. Check backend `Server.js` has CORS enabled:
   ```javascript
   app.use(cors());
   ```
2. Make sure backend allows your frontend origin

### Issue: Environment Variable Not Loading

**Symptom:** `process.env.REACT_APP_BACKEND_URL` is `undefined`

**Solution:**
1. File must be named exactly `.env` (not `.env.txt` or `.env.local`)
2. File must be in `frontend/` directory (same level as `package.json`)
3. Variables must start with `REACT_APP_`
4. Restart frontend server after changes
5. Clear browser cache

### Issue: Ngrok URL Changed

**Symptom:** Ngrok shows a different URL than what's in `.env`

**Solution:**
1. Ngrok free URLs change when you restart ngrok
2. Update `frontend/.env` with the new URL
3. Restart frontend server

---

## Complete Reset Procedure

If nothing works, try this complete reset:

1. **Stop everything:**
   - Stop frontend (Ctrl+C)
   - Stop backend (Ctrl+C)
   - Stop ngrok (Ctrl+C)

2. **Start backend:**
   ```bash
   cd backend
   npm start
   ```
   Wait for: `🚀 Server running on http://localhost:5000`

3. **Start ngrok:**
   ```bash
   ngrok http 5000
   ```
   Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.dev`)

4. **Update frontend/.env:**
   ```env
   REACT_APP_BACKEND_URL=https://abc123.ngrok-free.dev
   REACT_APP_USE_SSL=true
   ```
   **NO `:5000` at the end!**

5. **Start frontend:**
   ```bash
   cd frontend
   npm start
   ```

6. **Check browser console:**
   - Should see: `🔗 Final backend URL: https://abc123.ngrok-free.dev`
   - Should NOT see: `:5000` anywhere
   - Should connect successfully

---

## Still Not Working?

### Check These:

1. **Backend logs** - Are there any errors?
2. **Ngrok logs** - Are requests reaching ngrok?
3. **Browser Network tab** - What's the actual request URL?
4. **Firewall** - Is port 5000 blocked?
5. **Antivirus** - Is it blocking connections?

### Get More Debug Info:

Add this to browser console:
```javascript
// Check what URL is being used
console.log('Backend URL:', process.env.REACT_APP_BACKEND_URL);
console.log('Current URL:', window.location.href);
```

### Test Direct Connection:

Try connecting directly to ngrok URL in browser:
```
https://unfacilitated-unhunted-randy.ngrok-free.dev
```

If this doesn't work, ngrok isn't forwarding correctly.

---

## Alternative: Use Local IP Instead

If ngrok keeps causing issues, use your local IP:

1. Find your IP:
   - Windows: `ipconfig` → Look for IPv4 Address
   - Mac/Linux: `ifconfig` → Look for inet

2. Update `frontend/.env`:
   ```env
   REACT_APP_BACKEND_URL=http://192.168.1.100:5000
   REACT_APP_USE_SSL=false
   ```
   (Replace `192.168.1.100` with your actual IP)

3. Restart frontend

**Note:** This only works on the same network (not from internet).

