import { useCallback, useEffect, useRef, useState } from 'react'
import { getCloudAuthErrorMessage } from '../lib/cloudAuth'
import { syncProgressWithCloud } from '../lib/cloudProgress'
import { getAuthRedirectUrl, getSupabaseClient, isSupabaseConfigured } from '../lib/supabaseClient'

export default function useCloudProgressSync({ progress, onProgressMerged }) {
  const client = getSupabaseClient()
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(isSupabaseConfigured ? 'checking' : 'unconfigured')
  const [message, setMessage] = useState('')
  const [lastSyncedAt, setLastSyncedAt] = useState('')
  const progressRef = useRef(progress)
  const userRef = useRef(user)
  const syncingRef = useRef(false)
  const pendingRef = useRef(false)
  const runSyncRef = useRef(null)

  useEffect(() => {
    progressRef.current = progress
  }, [progress])

  useEffect(() => {
    userRef.current = user
  }, [user])

  const runSync = useCallback(async () => {
    if (!client || !user) return
    if (!navigator.onLine) {
      setStatus('offline')
      return
    }
    if (syncingRef.current) {
      pendingRef.current = true
      return
    }

    syncingRef.current = true
    setStatus('syncing')
    setMessage('')
    try {
      const merged = await syncProgressWithCloud(client, progressRef.current)
      progressRef.current = merged
      onProgressMerged(merged)
      setStatus('synced')
      setLastSyncedAt(new Date().toISOString())
    } catch (error) {
      setStatus(navigator.onLine ? 'error' : 'offline')
      setMessage(error.message || '云端同步失败')
    } finally {
      syncingRef.current = false
      if (pendingRef.current) {
        pendingRef.current = false
        window.setTimeout(() => runSyncRef.current?.(), 0)
      }
    }
  }, [client, onProgressMerged, user])

  useEffect(() => {
    runSyncRef.current = runSync
  }, [runSync])

  const checkSession = useCallback(async () => {
    if (!client) return false
    const { data, error } = await client.auth.getSession()
    if (error) {
      setStatus('error')
      setMessage(getCloudAuthErrorMessage(error))
      return false
    }

    const currentUser = data.session?.user || null
    setUser(currentUser)
    if (currentUser) {
      setStatus('syncing')
      setMessage('')
      return true
    }

    setStatus((current) => (current === 'link-sent' ? current : 'signed-out'))
    return false
  }, [client])

  useEffect(() => {
    if (!client) return undefined

    checkSession()

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      if (currentUser) {
        setStatus('syncing')
        setMessage('')
      } else {
        setStatus((current) => (current === 'link-sent' ? current : 'signed-out'))
        setLastSyncedAt('')
      }
    })

    const handleOnline = () => runSyncRef.current?.()
    const handleOffline = () => setStatus(userRef.current ? 'offline' : 'signed-out')
    const handleFocus = () => checkSession()
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') checkSession()
    }
    const handleStorage = (event) => {
      if (!event.key || event.key.startsWith('sb-')) checkSession()
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('storage', handleStorage)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      authListener.subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('storage', handleStorage)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [checkSession, client])

  useEffect(() => {
    if (!user) return undefined
    const timer = window.setTimeout(() => runSyncRef.current?.(), 500)
    return () => window.clearTimeout(timer)
  }, [progress, user])

  const signIn = useCallback(async (email) => {
    if (!client) return
    setStatus('checking')
    setMessage('')
    const { error } = await client.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: getAuthRedirectUrl() },
    })
    if (error) {
      setStatus('error')
      setMessage(getCloudAuthErrorMessage(error))
      return
    }
    setStatus('link-sent')
    setMessage('登录链接已发送。请在需要登录的这台设备上打开邮件链接；在其他设备点击，只会登录其他设备。')
  }, [client])

  const signOut = useCallback(async () => {
    if (!client) return
    const { error } = await client.auth.signOut()
    if (error) {
      setMessage(error.message)
      return
    }
    setUser(null)
    setStatus('signed-out')
    setMessage('')
  }, [client])

  return {
    configured: isSupabaseConfigured,
    email: user?.email || '',
    lastSyncedAt,
    message,
    checkSession,
    signIn,
    signOut,
    status,
    syncNow: runSync,
  }
}
