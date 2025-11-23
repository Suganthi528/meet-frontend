# Network Setup Guide - Accessing from Other Devices

## Issues Fixed

This update addresses several critical issues that prevented the application from working on other devices:

### 1. **Hardcoded Localhost URL** ✅
   - **Problem**: The frontend was hardcoded to connect to `http://localhost:5000`, which only works on the same machine.
   - **Solution**: Auto-detection of backend URL based on the current hostname. When accessing from another device, it automatically uses the correct IP address.

### 2. **Mobile Device Compatibility** ✅
   - **Problem**: Video constraints were too high for mobile devices, causing performance issues or failures.
   - **Solution**: 
     - Automatic mobile device detection
     - Flexible video constraints with ideal/max values for better compatibility
     - Proper mobile browser attributes (`playsInline`, `webkit-playsinline`)

### 3. **Events Section Not Visible** ✅
   - **Problem**: Events section only loaded if socket connection was successful, with no user feedback on connection issues.
   - **Solution**: 
     - Connection status indicator showing connection state
     - Better error messages when connection fails
     - Events section visibility tied to successful connection

### 4. **Participant Video Not Displaying** ✅
   - **Problem**: Multiple issues with WebRTC video streaming on different networks.
   - **Solution**:
     - Enhanced ICE servers for better NAT traversal
     - Better error handling for video playback
     - Track monitoring for connection issues
     - Improved autoplay handling for mobile devices

### 5. **Responsive Design** ✅
   - **Problem**: UI wasn't optimized for mobile devices.
   - **Solution**: Comprehensive mobile-responsive CSS with proper touch targets.

## Setup Instructions

### Step 1: Find Your Computer's IP Address

#### Windows:
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually Wireless LAN or Ethernet).

#### Mac/Linux:
```bash
ifconfig
# or
ip addr show
```
Look for "inet" address (not 127.0.0.1).

### Step 2: Configure Backend Server

The backend server now binds to all network interfaces (0.0.0.0) by default, allowing access from other devices.

**Start the backend:**
```bash
cd backend
npm start
```

The server will display:
```
🚀 Server running on http://localhost:5000
📱 Access from other devices: http://<your-ip-address>:5000
💡 To find your IP: Windows: ipconfig | Mac/Linux: ifconfig
```

### Step 3: Configure Frontend for Network Access

#### Option A: Environment Variable (Recommended)
Create a `.env` file in the `frontend` directory:

```env
REACT_APP_BACKEND_URL=http://YOUR_IP_ADDRESS:5000
```

Replace `YOUR_IP_ADDRESS` with your computer's IP address from Step 1.

#### Option B: Automatic Detection (Default)
The frontend now automatically detects the backend URL:
- If accessing from `localhost`, it uses `http://localhost:5000`
- If accessing from another device, it uses `http://<hostname>:5000`

**Note**: For Option B to work, make sure the hostname matches the IP where the backend is running.

### Step 4: Access from Other Devices

#### From Another Laptop (Same Network):
1. Make sure both devices are on the same Wi-Fi network
2. Open a browser on the other laptop
3. Navigate to: `http://YOUR_IP_ADDRESS:3000` (frontend) or the deployed frontend URL
4. The app will automatically connect to `http://YOUR_IP_ADDRESS:5000` (backend)

#### From Mobile Phone:
1. Connect your phone to the same Wi-Fi network
2. Open a mobile browser (Chrome, Safari)
3. Navigate to: `http://YOUR_IP_ADDRESS:3000` or your frontend URL
4. Grant camera and microphone permissions when prompted

### Step 5: Firewall Configuration

You may need to allow connections through your firewall:

#### Windows:
1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Allow Node.js or add ports 3000 and 5000

#### Mac:
1. System Preferences → Security & Privacy → Firewall
2. Click "Firewall Options"
3. Allow Node.js or add incoming connections for ports 3000 and 5000

## Troubleshooting

### Connection Issues

**Problem**: "Connection failed: Unable to reach server"

**Solutions**:
1. Verify backend is running: Check terminal for server start message
2. Check IP address: Ensure you're using the correct IP address
3. Check firewall: Make sure ports 3000 and 5000 are open
4. Check network: Ensure both devices are on the same network
5. Try accessing backend directly: Open `http://YOUR_IP:5000` in browser (should show CORS error, which means it's reachable)

### Video Not Displaying

**Problem**: Participant video doesn't show on other devices

**Solutions**:
1. **Check Permissions**: Ensure camera/mic permissions are granted
2. **Check Browser Console**: Open developer tools (F12) and check for errors
3. **Network Issues**: 
   - Check if WebRTC is supported (most modern browsers support it)
   - Try from Chrome or Firefox (best WebRTC support)
   - Check if your network blocks WebRTC (some corporate networks do)
4. **Mobile Specific**:
   - Use HTTPS if possible (WebRTC works better with HTTPS)
   - Try Chrome on Android or Safari on iOS
   - Ensure you're not using mobile data (WiFi works better)

### Events Section Not Visible

**Problem**: "Upcoming Events" section doesn't appear

**Solutions**:
1. Check connection status indicator at top of page
2. Verify socket connection is established (green indicator)
3. Check browser console for connection errors
4. Ensure backend server is running and accessible

### Mobile Browser Issues

**Problem**: App doesn't work properly on mobile

**Solutions**:
1. Use a modern browser (Chrome, Safari, Firefox)
2. Ensure you're using HTTPS in production (required for camera access on some mobile browsers)
3. Grant all permissions when prompted
4. Try landscape mode if video is cut off

## Production Deployment

For production deployment, consider:

1. **HTTPS**: Required for camera/mic access on many mobile browsers
2. **Environment Variables**: Set `REACT_APP_BACKEND_URL` to your production backend URL
3. **CORS Configuration**: Update CORS settings in `backend/Server.js` for production domain
4. **STUN/TURN Servers**: For better NAT traversal, consider adding TURN servers for users behind strict firewalls

## Additional Configuration

### Custom Backend URL
You can override the backend URL by setting the environment variable:

```bash
# Windows (PowerShell)
$env:REACT_APP_BACKEND_URL="http://192.168.1.100:5000"
npm start

# Mac/Linux
REACT_APP_BACKEND_URL=http://192.168.1.100:5000 npm start
```

### Custom Backend Host/Port
Set environment variables for the backend:

```bash
# Windows
$env:PORT=5000
$env:HOST="0.0.0.0"
npm start

# Mac/Linux
PORT=5000 HOST=0.0.0.0 npm start
```

## Testing Checklist

- [ ] Backend accessible from same device (localhost)
- [ ] Backend accessible from other device (IP address)
- [ ] Frontend connects to backend from same device
- [ ] Frontend connects to backend from other device
- [ ] Video works on desktop browser
- [ ] Video works on mobile browser
- [ ] Events section loads correctly
- [ ] Participant videos display on all devices
- [ ] Chat functionality works
- [ ] Permissions prompt works correctly

## Support

If you continue to experience issues:
1. Check browser console for errors (F12 → Console tab)
2. Check backend terminal for connection logs
3. Verify network connectivity between devices
4. Test with a simple ping: `ping YOUR_IP_ADDRESS`


