import React, { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { api } from '../../lib/api'
import { useAuth } from '../../context/AuthContext'

export function Login() {
  const { setAuth } = useAuth()
  const nav = useNavigate()
  const { role = 'admin' } = useParams()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function onSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      // Validation for admin role: ID and password patterns
      if (role === 'admin') {
        const idRegex = /^Vu[^A-Za-z0-9]\d{3}$/
        if (!idRegex.test(email)) {
          throw new Error('ID must be exactly 6 characters: Vu + 1 symbol + 3 digits (e.g., Vu@123)')
        }
        const passRegex = /^(?=(?:.*\d){2,})(?=.*[a-z])(?=(?:.*[^A-Za-z0-9]){1,}).+$/
        if (!passRegex.test(password)) {
          throw new Error('Password must include at least 2 digits, 1 special character, and 1 lowercase letter')
        }
      }
      const res = await api.login(email, password, role)
      setAuth(res)
      const r = (res?.user?.role || role)
      nav(r === 'admin' ? '/admin' : '/faculty')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-5xl mx-auto p-12 sm:p-16 border rounded-lg shadow-sm bg-white">
      <h1 className="text-6xl font-semibold mb-8">{role === 'admin' ? 'Admin' : 'Faculty'} Login</h1>
      <form onSubmit={onSubmit} className="space-y-7">
        <div>
          <label className="block text-xl mb-2">ID</label>
          <input
            className="w-full border rounded px-7 py-5 text-2xl"
            type="text"
            placeholder={role === 'admin' ? 'Vu followed by 1 symbol and 3 digits (e.g., Vu@835)' : 'Your assigned Login ID (e.g., FAC-ABC123)'}
            value={email}
            onChange={e=>setEmail(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xl mb-2">Password</label>
          <input
            className="w-full border rounded px-7 py-5 text-2xl"
            type="password"
            placeholder={role === 'admin' ? 'e.g., ab@12 (2 digits, 1 special, 1 lowercase)' : 'Your password'}
            value={password}
            onChange={e=>setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="text-red-600 text-xl">{error}</div>}
        <button disabled={loading} className="px-10 py-5 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 text-2xl">
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
