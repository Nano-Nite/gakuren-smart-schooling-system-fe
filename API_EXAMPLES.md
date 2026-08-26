# 🚀 Quick API Integration Examples

## Basic Setup (Already Done ✅)

Your login and dashboard are already integrated with the backend API.

---

## Example 1: Simple API Call

**Get all students from backend:**

```javascript
import { apiRequest } from './utils/api'

export default function StudentList() {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const data = await apiRequest('/v1/students', {
          method: 'GET'
        })
        setStudents(data.data) // Assuming response has data property
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error}</p>

  return (
    <div>
      {students.map(student => (
        <div key={student.id}>{student.name}</div>
      ))}
    </div>
  )
}
```

---

## Example 2: POST Request (Create Data)

**Add a new attendance record:**

```javascript
import { apiRequest } from './utils/api'

async function markAttendance(studentId, status) {
  try {
    const response = await apiRequest('/v1/attendance', {
      method: 'POST',
      body: {
        student_id: studentId,
        status: status, // HADIR, SAKIT, ALPHA, etc.
        date: new Date().toISOString()
      }
    })
    console.log('Attendance marked:', response.data)
  } catch (error) {
    console.error('Failed to mark attendance:', error.message)
  }
}
```

---

## Example 3: PUT Request (Update Data)

**Update student information:**

```javascript
import { apiRequest } from './utils/api'

async function updateStudent(studentId, updates) {
  try {
    const response = await apiRequest(`/v1/students/${studentId}`, {
      method: 'PUT',
      body: updates
    })
    return response.data
  } catch (error) {
    console.error('Failed to update student:', error.message)
  }
}

// Usage
updateStudent(123, {
  name: 'New Name',
  email: 'newemail@school.id'
})
```

---

## Example 4: DELETE Request (Remove Data)

**Delete a student:**

```javascript
import { apiRequest } from './utils/api'

async function deleteStudent(studentId) {
  try {
    await apiRequest(`/v1/students/${studentId}`, {
      method: 'DELETE'
    })
    console.log('Student deleted')
  } catch (error) {
    console.error('Failed to delete student:', error.message)
  }
}
```

---

## Example 5: Check User Permissions

**Hide/show features based on permissions:**

```javascript
import { hasPermission } from './utils/api'

function Dashboard() {
  return (
    <div>
      {hasPermission('student.view') && (
        <section>
          <h2>Students</h2>
          {/* Student list */}
        </section>
      )}

      {hasPermission('attendance.create') && (
        <button>Mark Attendance</button>
      )}

      {hasPermission('attendance.delete') && (
        <button>Delete Record</button>
      )}
    </div>
  )
}
```

---

## Example 6: Display User Information

**Show logged-in user info:**

```javascript
import { getUserData, getAccessToken } from './utils/api'

function UserProfile() {
  const user = getUserData()
  const token = getAccessToken()

  return (
    <div>
      <h1>Welcome, {user?.user_name}!</h1>
      <p>Email: {user?.email}</p>
      <p>Role: {user?.role_name}</p>
      <p>School: {user?.tenant_name}</p>
      <p>Token: {token?.substring(0, 20)}...</p>
    </div>
  )
}
```

---

## Example 7: Error Handling with Toast

**Display user-friendly error messages:**

```javascript
import { apiRequest } from './utils/api'
import { toast } from 'react-hot-toast' // or your toast library

async function addTeacher(data) {
  try {
    const response = await apiRequest('/v1/teachers', {
      method: 'POST',
      body: data
    })
    toast.success('Teacher added successfully!')
    return response.data
  } catch (error) {
    if (error.message.includes('already exists')) {
      toast.error('Teacher with this email already exists')
    } else if (error.message.includes('Network')) {
      toast.error('Connection lost. Check your internet.')
    } else {
      toast.error(error.message)
    }
  }
}
```

---

## Example 8: Loading with Skeleton

**Show loading state while fetching:**

```javascript
import { apiRequest } from './utils/api'

function ClassList() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadClasses = async () => {
      try {
        const data = await apiRequest('/v1/classes')
        setClasses(data.data)
      } finally {
        setLoading(false)
      }
    }
    loadClasses()
  }, [])

  return (
    <div>
      {loading ? (
        // Skeleton loader
        <>
          <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse" />
          <div className="h-12 bg-gray-200 rounded mb-4 animate-pulse" />
        </>
      ) : (
        classes.map(cls => (
          <div key={cls.id} className="p-4 border rounded mb-4">
            {cls.name}
          </div>
        ))
      )}
    </div>
  )
}
```

---

## Example 9: Logout Anywhere

**Log out user from any component:**

```javascript
import { logoutUser } from './utils/api'
import { useNavigate } from 'react-router-dom'

function UserMenu() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      // Optional: Call backend logout endpoint
      // await apiRequest('/v1/auth/logout', { method: 'POST' })
      
      logoutUser()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  )
}
```

---

## Example 10: API Configuration for Different Environments

**Use different APIs for dev/prod:**

```javascript
// .env.development
REACT_APP_API_URL=http://localhost:3000

// .env.production
REACT_APP_API_URL=https://api.gakuren.co.id

// In your code, it automatically uses the right one!
```

---

## Common API Response Formats

### Success with data array
```javascript
{
  "data": [
    { id: 1, name: "John" },
    { id: 2, name: "Jane" }
  ],
  "message": "Success"
}
```

### Success with single object
```javascript
{
  "data": {
    "id": 1,
    "name": "John",
    "email": "john@school.id"
  },
  "message": "Success"
}
```

### Error response
```javascript
{
  "data": null,
  "error": "INVALID_EMAIL",
  "message": "Email already registered"
}
```

---

## Testing in Browser Console

You can test API calls directly in browser console (F12):

```javascript
// Test login
const { loginUser } = await import('./utils/api.js')
await loginUser('admin@yopmail.com', 'password123')

// Get user data
const { getUserData } = await import('./utils/api.js')
const user = getUserData()
console.log(user)

// Make API call
const { apiRequest } = await import('./utils/api.js')
const students = await apiRequest('/v1/students')
console.log(students)

// Check permissions
const { hasPermission } = await import('./utils/api.js')
console.log(hasPermission('student.create'))
```

---

## Debugging Tips

### 1. Check Network Requests
Open DevTools → Network tab → Filter by XHR/Fetch

### 2. View Stored Tokens
Open DevTools → Application → SessionStorage
Look for: `accessToken`, `userData`, `permissions`

### 3. Log API Calls
Add to `src/utils/api.js`:
```javascript
console.log('API Request:', method, url, body)
console.log('API Response:', data)
```

### 4. Test Failed Requests
Temporarily disconnect internet or use DevTools to throttle network

### 5. View Error Details
All API errors are logged to console with full details

---

## Quick Reference

```javascript
// Login
import { loginUser } from './utils/api'
await loginUser(email, password)

// Logout
import { logoutUser } from './utils/api'
logoutUser()

// Check auth
import { isUserAuthenticated } from './utils/api'
if (isUserAuthenticated()) { ... }

// Get user
import { getUserData } from './utils/api'
const user = getUserData()

// Get token
import { getAccessToken } from './utils/api'
const token = getAccessToken()

// Check permission
import { hasPermission } from './utils/api'
if (hasPermission('dashboard.view')) { ... }

// Make request
import { apiRequest } from './utils/api'
const data = await apiRequest('/v1/endpoint', options)
```

---

**Happy coding! 🎉**
