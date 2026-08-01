import axios from 'axios'

const TOKEN_KEY = 'qstp.token'
const USER_KEY = 'qstp.user'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// A 401 while we believe we're already signed in means the session was rejected
// server-side (expired/invalid token) — clear it and force back to the login screen
// instead of leaving the page stuck showing stale data or an endless spinner.
// (A 401 from a login attempt itself, before any token exists, is left alone so the
// login form can show its own "invalid credentials" message.)
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.reload()
    }
    return Promise.reject(error)
  }
)

export default client
