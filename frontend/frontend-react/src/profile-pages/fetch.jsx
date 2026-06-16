//Data fetch from backend

/*
import { useState, useEffect } from 'react'

function ProfilePageWithAPI() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch('/api/profile')
      if (!response.ok) throw new Error('Failed to fetch profile')
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const saveProfile = async (updatedProfile) => {
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProfile)
      })
      if (!response.ok) throw new Error('Failed to save profile')
      const data = await response.json()
      setProfile(data)
    } catch (err) {
      setError(err.message)
    }
  }

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  if (!profile) return <div>No profile found</div>

  return <ProfilePage profile={profile} onSave={saveProfile} />
}

*/