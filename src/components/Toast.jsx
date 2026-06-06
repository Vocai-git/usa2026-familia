import { useState, useCallback } from 'react'

let _showToast = null

export const showToast = (msg) => _showToast?.(msg)

export function useToast() {
  return { showToast: (msg) => _showToast?.(msg) }
}

export default function Toast() {
  const [msg, setMsg] = useState(null)

  _showToast = useCallback((message) => {
    setMsg(message)
    setTimeout(() => setMsg(null), 2500)
  }, [])

  if (!msg) return null
  return <div className="toast">{msg}</div>
}
