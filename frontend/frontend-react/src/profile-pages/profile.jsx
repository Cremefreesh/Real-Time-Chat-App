/* 
//profile page definition
import { useState } from 'react'

function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false)
  const [profile, setProfile] = useState({
    name: user.username,
    email: user.email,
    bio: 'Software developer' //not yet added to database 
    status: active      // come back and track activity of user
  })

  return (
    <div className="profile-page">
      <h1>Profile</h1>
      {isEditing ? (
        <ViewMode profile={profile} setIsEditing={setIsEditing} />
      )}
    </div>
  )
}
  */
