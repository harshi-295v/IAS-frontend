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
      // Admin login: allow any identifier (backend verifies ADMIN_EMAIL/ADMIN_PASSWORD)
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
          <label className="block text-xl mb-2">{role === 'admin' ? 'Email' : 'ID'}</label>
          <input
            className="w-full border rounded px-7 py-5 text-2xl"
            type="text"
            placeholder={role === 'admin' ? 'Your admin email (e.g., admin@example.com)' : 'Your assigned Login ID (e.g., FAC-ABC123)'}
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
            placeholder={role === 'admin' ? 'Your admin password' : 'Your password'}
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
