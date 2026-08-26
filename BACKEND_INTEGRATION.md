# 🔐 Backend Integration Guide

## Overview

The Gakuren frontend has been fully integrated with your backend API. The login flow now uses your production endpoints and handles authentication with proper error handling, token management, and security features.

---

## ✅ What's Integrated

### API Integration
- ✅ Real backend login endpoint: `http://localhost:3000/v1/auth/login`
- ✅ JWT token handling (access & refresh tokens)
- ✅ Automatic token storage in sessionStorage
- ✅ Bearer token authentication in requests
- ✅ Error handling with user-friendly messages

### Authentication Flow
1. User enters email & password
2. Frontend sends POST request to your login API
3. Backend returns user data + JWT tokens
4. Frontend stores tokens in sessionStorage
5. User is redirected to dashboard
6. Dashboard uses real user data from response

### Security Features
- ✅ SessionStorage (cleared when tab closes)
- ✅ Bearer token for API requests
- ✅ Automatic logout on 401 (unauthorized)
- ✅ Input validation
- ✅ Error message sanitization

---

## 📁 File Structure

```
src/
├── config/
│   └── api.js                 # API configuration & constants
├── utils/
│   └── api.js                 # API utilities & authentication functions
├── pages/
│   ├── Login.jsx              # Login page (integrated with API)
│   ├── Dashboard.jsx          # Dashboard (uses real user data)
│   └── Home.jsx               # Landing page
├── App.jsx                    # Routing with auth protection
└── components/
    └── Navbar.jsx             # Navigation
```

---

## 🔧 Configuration

### API Endpoint

Edit `src/config/api.js` to change the backend URL:

```javascript
const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  LOGIN: '/v1/auth/login',
}
```

### Environment Variable (Optional)

Create a `.env` file in the project root:

```
REACT_APP_API_URL=http://localhost:3000
```

Then build and it will use this URL instead of the default.

---

## 📡 API Integration Details

### Login Request

The frontend sends:
```javascript
POST http://localhost:3000/v1/auth/login
Content-Type: application/json

{
  "email": "admin@yopmail.com",
  "password": "admin123"
}
```

### Login Response (Expected Format)

Your backend should return:
```json
{
  "data": {
    "menu": ["Dashboard", "Students", "Teachers", ...],
    "permission": ["dashboard.view", "student.view", ...],
    "token": {
      "access_token": "eyJ...",
      "expired_in": 300,
      "refresh_expired_in": 620637,
      "refresh_token": "eyJ...",
      "token_type": "bearer"
    },
    "user_data": {
      "code": "SMAITATB2",
      "tenant_name": "SMA-IT AT-TAUBAH 2",
      "timezone": "asia/jakarta",
      "user_name": "Admin",
      "email": "admin@yopmail.com",
      "phone": "081212121212",
      "address": "dummy address",
      "role_name": "Admin",
      "role_level": 10,
      "tenant_version": "1.0.0",
      "user_version": "1.0.0"
    }
  },
  "error": null,
  "message": "Login successful"
}
```

---

## 🛠️ API Utilities

### Available Functions

#### `loginUser(email, password)`
Logs in a user and stores token + user data.

```javascript
import { loginUser } from './utils/api'

try {
  const response = await loginUser('admin@yopmail.com', 'password123')
  console.log('Login successful!', response.data.user_data)
} catch (error) {
  console.error('Login failed:', error.message)
}
```

#### `logoutUser()`
Clears all authentication data.

```javascript
import { logoutUser } from './utils/api'

logoutUser()
// Redirect to login
```

#### `isUserAuthenticated()`
Check if user is logged in.

```javascript
import { isUserAuthenticated } from './utils/api'

if (isUserAuthenticated()) {
  // User is logged in
}
```

#### `getUserData()`
Get stored user data.

```javascript
import { getUserData } from './utils/api'

const user = getUserData()
console.log(user.user_name, user.email)
```

#### `getAccessToken()`
Get the access token (for API requests).

```javascript
import { getAccessToken } from './utils/api'

const token = getAccessToken()
```

#### `hasPermission(permission)`
Check if user has specific permission.

```javascript
import { hasPermission } from './utils/api'

if (hasPermission('dashboard.view')) {
  // Show dashboard
}
```

#### `apiRequest(endpoint, options)`
Make authenticated API requests.

```javascript
import { apiRequest } from './utils/api'

try {
  const data = await apiRequest('/v1/students', {
    method: 'GET',
  })
  console.log('Students:', data)
} catch (error) {
  console.error('Request failed:', error.message)
}
```

---

## 🔄 Token Management

### SessionStorage Keys

Tokens are stored in sessionStorage with these keys:

| Key | Value |
|-----|-------|
| `accessToken` | JWT access token for API requests |
| `refreshToken` | JWT refresh token for renewing access |
| `tokenExpiry` | Token expiration time (in seconds) |
| `userData` | User profile data (JSON) |
| `menuItems` | Navigation menu items (JSON) |
| `permissions` | User permissions array (JSON) |
| `isAuthenticated` | Authentication status (`true`/`false`) |

### Token Lifecycle

```
1. User logs in
   ↓
2. Backend returns access_token & refresh_token
   ↓
3. Frontend stores tokens in sessionStorage
   ↓
4. Token automatically added to API requests (Authorization: Bearer ...)
   ↓
5. When token expires:
   - Backend returns 401 Unauthorized
   - Frontend clears sessionStorage
   - User redirected to login page
```

---

## 🚀 Testing the Integration

### Step 1: Start Backend
Ensure your backend is running on `http://localhost:3000`

### Step 2: Start Frontend
```bash
npm run dev
```
App will be available at `http://localhost:5174`

### Step 3: Test Login
1. Navigate to `http://localhost:5174/login`
2. Enter your test credentials:
   - Email: `admin@yopmail.com`
   - Password: `admin123`
3. Click "Masuk"

### Expected Results
- ✅ Successful login redirects to dashboard
- ✅ Dashboard displays user name from API response
- ✅ Logout clears all data and returns to login
- ✅ Direct access to `/dashboard` redirects to `/login` if not authenticated

---

## 🐛 Troubleshooting

### Error: "Tidak dapat terhubung ke server"

**Cause**: Backend is not running or wrong URL  
**Solution**:
1. Check backend is running on `http://localhost:3000`
2. Update URL in `src/config/api.js` if different
3. Check network tab in DevTools (F12) to see failed request

### Error: "Email atau password salah"

**Cause**: Invalid credentials  
**Solution**: Use correct test credentials or check backend logs

### User data not showing on dashboard

**Cause**: API response format mismatch  
**Solution**: Check that backend returns exactly the format shown in [Login Response](#login-response-expected-format)

### Token not working in other API calls

**Cause**: Missing Bearer token in request headers  
**Solution**: Use `apiRequest()` utility function which automatically adds token

---

## 📋 Next Steps

### 1. Environment-based Configuration
Replace hardcoded API URL with environment variables:

```bash
# .env
REACT_APP_API_URL=https://api.production.com
```

### 2. Implement Token Refresh
When access token expires, use refresh token to get new one:

```javascript
// Add to src/utils/api.js
export const refreshAccessToken = async () => {
  const refreshToken = sessionStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN)
  // Call backend refresh endpoint
  // Update tokens
}
```

### 3. Add More API Endpoints
Use the `apiRequest()` utility to call other backend endpoints:

```javascript
// Get students
const students = await apiRequest('/v1/students', { method: 'GET' })

// Create attendance record
await apiRequest('/v1/attendance', {
  method: 'POST',
  body: { student_id: 123, status: 'HADIR' }
})
```

### 4. Permission-based UI
Hide/show features based on user permissions:

```javascript
import { hasPermission } from './utils/api'

function MyComponent() {
  return (
    <>
      {hasPermission('student.create') && (
        <button>Tambah Siswa</button>
      )}
    </>
  )
}
```

### 5. Error Handling Middleware
Wrap API calls with consistent error handling:

```javascript
const handleApiError = (error) => {
  if (error.message.includes('Unauthorized')) {
    // Redirect to login
  } else if (error.message.includes('Network')) {
    // Show offline message
  } else {
    // Show generic error
  }
}
```

---

## 📚 API Response Handling

### Success Response
```javascript
{
  "data": { /* actual data */ },
  "error": null,
  "message": "Success message"
}
```

### Error Response
```javascript
{
  "data": null,
  "error": "error_code",
  "message": "Error description"
}
```

The `apiRequest()` utility automatically:
- ✅ Checks for `error` field
- ✅ Throws error if request failed
- ✅ Handles 401 responses
- ✅ Converts response to JSON

---

## 🔐 Security Best Practices

### ✅ What's Implemented
- SessionStorage (clears on tab close)
- Bearer token authentication
- HTTPS ready
- CORS-compatible
- Token included in all API requests

### ✅ Recommended for Production
- Use HTTPS only
- Implement token refresh mechanism
- Add CSRF protection
- Validate all inputs
- Implement rate limiting
- Add logging/monitoring
- Use httpOnly cookies (more secure than sessionStorage)

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review backend API response format
3. Check browser console (F12) for errors
4. Check network tab to see actual requests/responses

---

**✨ Your frontend is now fully integrated with your backend!**

Login with your real credentials and start building! 🚀
