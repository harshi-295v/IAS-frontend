import React, { useRef, useState } from 'react'
import { api } from '../lib/api'

export function AdminUpload({ onImported }) {
  const [facultyFile, setFacultyFile] = useState(null)
  const [classFile, setClassFile] = useState(null)
  const [examFile, setExamFile] = useState(null)
  const [msg, setMsg] = useState('')
  // Button labels that change only AFTER successful upload
  const [facLabel, setFacLabel] = useState('Choose File')
  const [clsLabel, setClsLabel] = useState('Choose File')
  const [exmLabel, setExmLabel] = useState('Choose File')

  const facRef = useRef(null)
  const clsRef = useRef(null)
  const exmRef = useRef(null)

  async function up(endpoint, file) {
    if (!file) {
      setMsg('No file chosen')
      return
    }
    const isCsv = /\.csv$/i.test(file.name || '')
    if (!isCsv) {
      setMsg('Only CSV files are allowed')
      return
    }
    setMsg('Uploading...')
    try {
      const res = await api.uploadCsv(endpoint, file)
      const fname = file?.name ? ` (${file.name})` : ''
      const imported = res.imported ?? res.grouped ?? 'Imported'
      setMsg(`${imported} successfully${fname}`)
    } catch (e) {
      setMsg(e.message)
    }
  }

  function Row({ label, file, displayLabel, setFile, setLabel, inputRef, endpoint }) {
    const [open, setOpen] = useState(false)
    return (
      <div className="flex items-center gap-3">
        <span className="text-base font-medium min-w-[220px]">{label}</span>
        <input
          ref={inputRef}
          type="file"
          accept=".csv"
          className="hidden"
          onChange={e=>{
            const f = e.target.files?.[0]||null
            setFile(f)
            setMsg('')
            if (f) {
              // Auto-import immediately
              ;(async()=>{
                try {
                  setMsg(`Importing ${label.toLowerCase()}...`)
                  const res = await api.uploadCsv(endpoint, f)
                  const imported = res.imported ?? res.grouped ?? 'OK'
                  setMsg(`${label}: imported ${imported}${f?.name?` (${f.name})`:''}`)
                  setLabel('Uploaded')
                  try {
                    const type = endpoint.includes('exams') ? 'exams' : endpoint.includes('classrooms') ? 'classrooms' : endpoint.includes('faculty') ? 'faculty' : 'unknown'
                    onImported && onImported(type)
                  } catch {}
                } catch (err) {
                  setLabel('Choose File')
                  setMsg(err.message)
                } finally {
                  setOpen(false)
                }
              })()
            } else {
              setLabel('Choose File')
            }
          }}
        />
        <button
          type="button"
          onClick={()=>{
            if (displayLabel === 'Uploaded') setOpen(!open)
            else inputRef.current?.click()
          }}
          className={
            `px-4 py-2 rounded border text-base transition-colors ` +
            (displayLabel === 'Uploaded'
              ? 'bg-green-600 border-green-600 text-white hover:bg-green-700'
              : 'bg-white hover:bg-blue-50 hover:border-blue-600 hover:text-blue-700')
          }
        >
          <span className="truncate inline-block max-w-[280px] align-middle">{displayLabel}</span>
        </button>
        {displayLabel === 'Uploaded' && open && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50"
              onClick={()=> setMsg(`${label}: ${file?.name || 'No file selected'}`)}
            >
              View File
            </button>
            <button
              type="button"
              className="px-3 py-1 rounded border text-sm bg-white hover:bg-gray-50"
              onClick={()=> inputRef.current?.click()}
            >
              Change File
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <Row label="Upload Faculty CSV" endpoint="/upload/faculty" file={facultyFile} displayLabel={facLabel} setFile={setFacultyFile} setLabel={setFacLabel} inputRef={facRef} />
      <Row label="Upload Classrooms CSV" endpoint="/upload/classrooms" file={classFile} displayLabel={clsLabel} setFile={setClassFile} setLabel={setClsLabel} inputRef={clsRef} />
      <Row label="Upload Exams CSV" endpoint="/upload/exams?replace=1" file={examFile} displayLabel={exmLabel} setFile={setExamFile} setLabel={setExmLabel} inputRef={exmRef} />
      {msg && <pre className="text-base text-gray-700 whitespace-pre-wrap border border-blue-200 bg-blue-50 px-3 py-2 rounded">{msg}</pre>}
    </div>
  )
}
