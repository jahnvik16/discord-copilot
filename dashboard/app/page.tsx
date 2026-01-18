'use client'

import { useState, useEffect } from 'react'
import { updateSystemInstructions, getSystemInstructions, resetMemory, updateAllowedChannel, getBotConfig } from './actions'
import { Upload, Trash2, Save, FileText, Bot, Shield, Brain } from 'lucide-react'

export default function Dashboard() {
  const [instructions, setInstructions] = useState('')
  const [channelId, setChannelId] = useState('')
  const [memorySummary, setMemorySummary] = useState<string | null>(null)
  const [memoryCharCount, setMemoryCharCount] = useState(0)
  const [configLastUpdated, setConfigLastUpdated] = useState<string | null>(null)
  const [configPreview, setConfigPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState('')

  // Load initial data
  useEffect(() => {
    Promise.all([
      getSystemInstructions(),
      getBotConfig(),
      fetch('/api/memory/preview').then(res => res.json()),
      fetch('/api/config/status').then(res => res.json())
    ]).then(([instr, config, memory, status]) => {
      setInstructions(instr)
      if (config) {
        setChannelId(config.discord_channel_id || '')
      }
      if (memory) {
        setMemorySummary(memory.summary)
        setMemoryCharCount(memory.char_count)
      }
      if (status) {
        setConfigLastUpdated(status.last_updated_at)
        setConfigPreview(status.instruction_preview)
      }
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await updateSystemInstructions(instructions)
      const statusRes = await fetch('/api/config/status')
      const status = await statusRes.json()
      setConfigLastUpdated(status.last_updated_at)
      setConfigPreview(status.instruction_preview)
      alert('Instructions saved!')
    } catch (e: any) {
      alert('Error saving: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to clear the bot\'s memory? This cannot be undone.')) return
    try {
      await resetMemory()
      alert('Memory cleared.')
    } catch (e: any) {
      alert('Error resetting memory: ' + e.message)
    }
  }

  const handleSaveChannel = async () => {
    try {
      await updateAllowedChannel(channelId)
      alert('Channel Access Control updated!')
    } catch (e: any) {
      alert('Error updating channel: ' + e.message)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return
    const file = e.target.files[0]

    setUploading(true)
    setUploadStatus('Uploading and processing...')

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      const json = await res.json()
      if (res.ok) {
        setUploadStatus(`Success! Processed ${json.chunksProcessed} text chunks.`)
      } else {
        setUploadStatus('Error: ' + json.error)
      }
    } catch (err: any) {
      setUploadStatus('Error uploading: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <Bot className="w-10 h-10 text-emerald-400" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-indigo-400 bg-clip-text text-transparent">
              Discord Copilot Control
            </h1>
            <p className="text-slate-400">Manage your AI Assistant</p>
          </div>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

          {/* System Instructions */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2 text-indigo-400" />
              System Instructions
            </h2>
            <textarea
              className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none resize-none transition-all"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Enter system instructions for the bot..."
              disabled={loading}
            />
            <div className="mt-4 flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving...' : 'Save Config'}</span>
              </button>
            </div>
            {/* Config Status Section */}
            <div className="mt-4 pt-4 border-t border-slate-800 text-xs text-slate-500">
              <p>Last applied at: {configLastUpdated ? new Date(configLastUpdated).toLocaleString() : 'Never'}</p>
              <p className="mt-1 italic truncate">
                Instruction preview: {configPreview || 'None'}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {/* Current Memory Panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Brain className="w-5 h-5 mr-2 text-indigo-400" />
                Current Memory
              </h2>
              <div className="space-y-2">
                <textarea
                  className="w-full h-32 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 outline-none resize-none"
                  value={memorySummary || 'No active memory'}
                  readOnly
                  disabled
                />
                <p className="text-xs text-slate-500 text-right">
                  {memoryCharCount} characters
                </p>
              </div>
            </div>

            {/* Knowledge Base */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Upload className="w-5 h-5 mr-2 text-emerald-400" />
                Knowledge Base
              </h2>
              <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center hover:border-emerald-500/50 transition-colors bg-slate-950/50 group cursor-pointer relative">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleUpload}
                  disabled={uploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-slate-400 group-hover:text-emerald-400 transition-colors">
                  {uploading ? (
                    <div className="animate-pulse">Processing PDF...</div>
                  ) : (
                    <>
                      <p className="font-medium">Click to upload PDF</p>
                      <p className="text-xs mt-1 text-slate-500">Extracts text and generates embeddings</p>
                    </>
                  )}
                </div>
              </div>
              {uploadStatus && (
                <div className={`mt-4 text-sm p-3 rounded-lg ${uploadStatus.startsWith('Error') ? 'bg-red-900/20 text-red-400' : 'bg-emerald-900/20 text-emerald-400'}`}>
                  {uploadStatus}
                </div>
              )}
            </div>

            {/* Discord Access Control */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-2 text-indigo-400" />
                Discord Access Control
              </h2>
              <div className="space-y-4">
                <p className="text-sm text-slate-400">
                  Restrict the bot to a specific Discord Channel ID. Leave empty to allow all (not recommended).
                </p>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={channelId}
                    onChange={(e) => setChannelId(e.target.value)}
                    placeholder="123456789012345678"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                  <button
                    onClick={handleSaveChannel}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
              <h2 className="text-xl font-semibold mb-4 text-red-400 flex items-center">
                <Trash2 className="w-5 h-5 mr-2" />
                Danger Zone
              </h2>
              <p className="text-slate-400 text-sm mb-4">
                Clear all short-term conversation memory. The bot will lose context of current chats.
              </p>
              <button
                onClick={handleReset}
                className="w-full flex justify-center items-center space-x-2 bg-red-950 hover:bg-red-900 border border-red-900 text-red-400 px-4 py-3 rounded-lg transition-colors"
              >
                <span>Reset Session Memory</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
