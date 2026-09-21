/**
 * api/client.js — Axios base client for IssueRouter backend.
 * Uses VITE_API_URL if configured, otherwise falls back to /api.
 */
import axios from 'axios'

let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '')
if (rawApiUrl.endsWith('/api')) {
  rawApiUrl = rawApiUrl.slice(0, -4).replace(/\/+$/, '')
}
const API_BASE = rawApiUrl ? `${rawApiUrl}/api` : '/api'

const client = axios.create({
  baseURL: API_BASE,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach auth token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`
  }
  return config
})

// Response interceptor — normalise errors
client.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err?.response?.data?.detail ?? err?.message ?? 'Unknown error'
    console.error('[API Error]', msg)
    return Promise.reject(new Error(msg))
  }
)

export function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('token')
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extraHeaders,
  }
}

export async function authFetch(inputUrl, options = {}) {
  const token = localStorage.getItem('token')
  const isFormData = options.body instanceof FormData
  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  let resolvedUrl = inputUrl
  if (rawApiUrl && inputUrl.startsWith('/api')) {
    resolvedUrl = `${rawApiUrl}${inputUrl}`
  }

  try {
    const res = await fetch(resolvedUrl, { ...options, headers })
    return res
  } catch (err) {
    if (!rawApiUrl && resolvedUrl.startsWith('/api/')) {
      const fallbackUrl = `http://localhost:8000${resolvedUrl}`
      return fetch(fallbackUrl, { ...options, headers })
    }
    throw err
  }
}

export function getMediaUrl(url) {
  if (!url) return ''
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  const cleanPath = url.startsWith('/') ? url : `/${url}`
  if (rawApiUrl) {
    return `${rawApiUrl}${cleanPath}`
  }
  return cleanPath
}

export default client
