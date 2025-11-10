import React from 'react'
import { Link } from 'react-router-dom'

export function AdminManageLanding() {
  return (
    <div className="w-full min-h-[calc(100vh-160px)] grid place-items-center px-4">
      <div className="w-full max-w-5xl">
        <h1 className="text-5xl md:text-6xl font-semibold mb-10 text-center">Manage Faculty</h1>
        <div className="grid sm:grid-cols-2 gap-10 max-w-4xl mx-auto">
          <Link to="/admin/manage/add" className="block border rounded-2xl p-10 bg-white hover:shadow-xl min-h-[200px]">
            <div className="text-3xl md:text-4xl font-semibold mb-3">Add Faculty</div>
            <div className="text-xl text-gray-700">Add a new faculty and email credentials.</div>
          </Link>
          <Link to="/admin/manage/remove" className="block border rounded-2xl p-10 bg-white hover:shadow-xl min-h-[200px]">
            <div className="text-3xl md:text-4xl font-semibold mb-3">Remove Faculty</div>
            <div className="text-xl text-gray-700">Remove access for an existing faculty by ID/Email/Login ID.</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
