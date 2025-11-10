import React from 'react'
import { Link } from 'react-router-dom'

export function AdminMenu() {
  const items = [
    { to: '/admin/credentials', title: 'Generate Credentials', desc: 'Create login IDs and passwords, download PDF, and send notifications.' },
    { to: '/admin/manage', title: 'Manage Faculty', desc: 'Choose to Add or Remove faculty.' },
    { to: '/admin/scheduling', title: 'Scheduling', desc: 'Create and manage the invigilator schedule.' },
    { to: '/admin/history', title: 'Credential History', desc: 'View previously generated credentials and download PDFs.' },
  ]
  return (
    <div className="w-full min-h-[calc(100vh-160px)] grid place-items-center px-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl md:text-6xl font-semibold mb-10 text-center">Admin</h1>
        <div className="grid sm:grid-cols-2 gap-10 max-w-4xl mx-auto">
        {items.map((it)=> (
          <Link key={it.to} to={it.to} className="block border rounded-2xl p-10 bg-white hover:shadow-xl min-h-[220px]">
            <div className="text-3xl md:text-4xl font-semibold mb-4">{it.title}</div>
            <div className="text-xl text-gray-700 leading-relaxed">{it.desc}</div>
          </Link>
        ))}
        </div>
      </div>
    </div>
  )
}
