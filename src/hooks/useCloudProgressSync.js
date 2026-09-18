import { useCallback, useEffect, useRef, useState } from 'react'
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

  useEffect(() => {
    if (!client) return undefined
    let mounted = true

    client.auth.getSession().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        setStatus('error')
        setMessage(error.message)
        return
      }
      const currentUser = data.session?.user || null
      setUser(currentUser)
      setStatus(currentUser ? 'syncing' : 'signed-out')
    })

    const { data: authListener } = client.auth.onAuthStateChange((_event, session) => {
      const currentUser = session?.user || null
      setUser(currentUser)
      setStatus(currentUser ? 'syncing' : 'signed-out')
      if (!currentUser) setLastSyncedAt('')
    })

    const handleOnline = () => runSyncRef.current?.()
    const handleOffline = () => setStatus(userRef.current ? 'offline' : 'signed-out')
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [client])

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
      setMessage(error.message)
      return
    }
    setStatus('link-sent')
    setMessage('登录链接已发送，请在邮件中点击确认')
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
    signIn,
    signOut,
    status,
    syncNow: runSync,
  }
}
