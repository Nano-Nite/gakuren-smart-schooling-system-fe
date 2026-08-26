# 🔧 Environment Setup Guide

Configure your frontend to work with your backend.

---

## Default Configuration

By default, the frontend is configured to connect to:
```
http://localhost:3000/v1/auth/login
```

This assumes your backend is running on `localhost:3000`.

---

## Option 1: Local Development (Default)

### If Backend is on `localhost:3000`
✅ **No configuration needed!** Start both:

```bash
# Terminal 1 - Backend
cd your-backend-folder
npm start  # or java -jar app.jar

# Terminal 2 - Frontend
cd gakuren-smart-schooling-system
npm run dev
```

Frontend: `http://localhost:5174`

---

## Option 2: Custom Backend URL

### If Backend is on Different Host/Port

**Edit `src/config/api.js`:**

```javascript
const API_CONFIG = {
  BASE_URL: 'http://192.168.1.100:8000',  // Change this
  LOGIN: '/v1/auth/login',
}
```

Or with environment variable (recommended):

---

## Option 3: Environment Variables (Production Ready)

### Create `.env` file

In project root, create `.env`:

```bash
# .env (for local development)
REACT_APP_API_URL=http://localhost:3000

# For Vite (React dev server)
VITE_API_URL=http://localhost:3000
```

### Create `.env.production`

For production deployment:

```bash
# .env.production
REACT_APP_API_URL=https://api.gakuren.co.id

VITE_API_URL=https://api.gakuren.co.id
```

### Create `.env.staging`

For staging/testing:

```bash
# .env.staging
REACT_APP_API_URL=https://api-staging.gakuren.co.id

VITE_API_URL=https://api-staging.gakuren.co.id
```

### Use Environment Variable in Code

**`src/config/api.js`:**
```javascript
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  LOGIN: '/v1/auth/login',
}
```

---

## Option 4: Different URLs for Different Environments

### Setup Multiple Environment Files

```
.env                    # Default (local dev)
.env.local              # Local overrides
.env.staging            # Staging server
.env.production         # Production server
```

### Example Configuration

**.env**
```
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Gakuren Dev
```

**.env.production**
```
VITE_API_URL=https://api.gakuren.co.id
VITE_APP_NAME=Gakuren
```

### Build for Different Environments

```bash
# Development
npm run dev

# Build for production
npm run build

# Production build uses .env.production
```

---

## Troubleshooting Configuration

### Issue: "Tidak dapat terhubung ke server"

**Check 1:** Backend is running
```bash
# Test if backend responds
curl http://localhost:3000/v1/auth/login
# Should return error (not "Connection refused")
```

**Check 2:** Correct URL in config
```javascript
// src/config/api.js
console.log(API_CONFIG.BASE_URL)  // Check console
```

**Check 3:** CORS enabled on backend
Backend must allow requests from frontend domain:
```javascript
// Example backend CORS config
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}))
```

**Check 4:** Environment variable loaded
```javascript
// In browser console
console.log(import.meta.env.VITE_API_URL)
```

---

## Backend CORS Configuration

### For Local Development

**Node.js/Express:**
```javascript
const cors = require('cors');
app.use(cors({
  origin: 'http://localhost:5174',
  credentials: true
}));
```

**Java/Spring:**
```java
@Configuration
public class CorsConfig {
  @Bean
  public WebMvcConfigurer corsConfigurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/v1/**")
          .allowedOrigins("http://localhost:5174")
          .allowedMethods("*")
          .allowCredentials(true);
      }
    };
  }
}
```

**Python/Flask:**
```python
from flask_cors import CORS
CORS(app, origins=["http://localhost:5174"])
```

### For Production

```javascript
// Allow HTTPS domain
app.use(cors({
  origin: 'https://gakuren.co.id',
  credentials: true
}));
```

---

## Network Configuration

### Firewall Settings

Make sure backend port is accessible:

```bash
# Linux/Mac - Check if port is listening
lsof -i :3000

# Windows - Check if port is listening
netstat -ano | findstr :3000

# Allow port in firewall
# Windows Defender: Allow app through firewall
# Linux: sudo ufw allow 3000
```

### Proxy Configuration (Optional)

If behind corporate proxy, set npm config:

```bash
npm config set proxy http://proxy-server:port
npm config set https-proxy https://proxy-server:port
```

---

## HTTPS / SSL Configuration

### For Local Development with HTTPS

**Using Vite SSL:**

```bash
# 1. Generate certificate
openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365

# 2. Update vite.config.js
import https from 'https'
import fs from 'fs'

export default {
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem')
    }
  }
}

# 3. Run dev server
npm run dev  # Will use HTTPS
```

### For Production HTTPS

Update backend URL:
```bash
# .env.production
VITE_API_URL=https://your-api-domain.com
```

Ensure backend also uses HTTPS:
```bash
# Backend config
https://your-api-domain.com/v1/auth/login
```

---

## Testing Configuration

### Quick Test

```javascript
// Open browser console (F12) and test:
fetch('http://localhost:3000/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@yopmail.com',
    password: 'admin123'
  })
})
.then(r => r.json())
.then(d => console.log('Response:', d))
.catch(e => console.error('Error:', e))
```

### Debug API Calls

**Add logging to `src/utils/api.js`:**

```javascript
export const apiRequest = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint)
  console.log('📤 Request:', url, options.body)
  
  // ... rest of function ...
  
  console.log('📥 Response:', data)
  return data
}
```

---

## Different Development Scenarios

### Scenario 1: Local Backend
```bash
# Backend
npm start  # localhost:3000

# Frontend
npm run dev  # localhost:5174

# Config
VITE_API_URL=http://localhost:3000
```

### Scenario 2: Remote Backend (Same Network)
```bash
# Backend on 192.168.1.100:3000

# Config
VITE_API_URL=http://192.168.1.100:3000
```

### Scenario 3: Cloud Backend (Production)
```bash
# Backend on cloud.example.com

# Config
VITE_API_URL=https://api.example.com
```

### Scenario 4: Docker Compose

**docker-compose.yml:**
```yaml
version: '3'
services:
  backend:
    image: gakuren-backend:latest
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production

  frontend:
    image: gakuren-frontend:latest
    ports:
      - "5174:5174"
    environment:
      - VITE_API_URL=http://backend:3000
    depends_on:
      - backend
```

---

## Verification Checklist

After configuration, verify:

- [ ] `.env` file created (if using env vars)
- [ ] `VITE_API_URL` or `BASE_URL` points to correct backend
- [ ] Backend is running and accessible
- [ ] CORS is enabled on backend
- [ ] No firewall blocking connection
- [ ] Can curl backend: `curl http://localhost:3000`
- [ ] Network tab shows successful request to login endpoint
- [ ] Login works with test credentials
- [ ] Dashboard displays user data

---

## Quick Reference

| Scenario | Configuration |
|----------|---------------|
| Local dev, backend on localhost:3000 | Default (no change needed) |
| Backend on different port | Edit `src/config/api.js` `BASE_URL` |
| Backend on different machine | Use `VITE_API_URL` env var |
| Production | Use `.env.production` with HTTPS URL |
| Docker/Containers | Use service name (e.g., `http://backend:3000`) |

---

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| CORS error | Enable CORS on backend |
| Connection refused | Check backend is running |
| Wrong port | Verify backend port in config |
| Environment var not loaded | Restart dev server after editing `.env` |
| HTTPS error | Use HTTPS URL for production |
| Can't connect from other device | Use IP address instead of localhost |

---

## Environment Variables Reference

### Vite Variables
```javascript
// In code
console.log(import.meta.env.VITE_API_URL)

// In config
const url = process.env.REACT_APP_API_URL || 'default'
```

### .env Naming
- `VITE_*` — Exposed to frontend
- `VITE_API_URL` — Your backend API URL

### Build-time vs Runtime
- **Build-time:** Baked into bundle (current approach)
- **Runtime:** Loaded from server at startup (more flexible)

---

## Next Steps

1. ✅ Configure backend URL
2. ✅ Ensure backend is running
3. ✅ Test login endpoint
4. ✅ Run `npm run dev`
5. ✅ Test login in browser
6. ✅ Check Network tab for requests
7. ✅ Verify tokens stored
8. ✅ Test logout
9. ✅ Test protected routes

---

**You're all set! 🚀**

For more help, see [BACKEND_INTEGRATION.md](BACKEND_INTEGRATION.md)
