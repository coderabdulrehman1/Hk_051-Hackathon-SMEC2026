'use client'

import { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import dynamic from 'next/dynamic'

// Dynamically import QR scanner to avoid SSR issues
const QRScanner = dynamic(() => import('./components/QRScanner'), {
  ssr: false,
})

interface Friend {
  id: string
  name: string
  connectedAt: string
}

export default function Home() {
  const [userId, setUserId] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [friends, setFriends] = useState<Friend[]>([])
  const [showScanner, setShowScanner] = useState(false)
  const [isRegistered, setIsRegistered] = useState(false)
  const generateQRCode = async (id: string, name: string) => {
    try {
      const userData = JSON.stringify({ userId: id, userName: name })
      const qr = await QRCode.toDataURL(userData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrCode(qr)
    } catch (err) {
      console.error('Error generating QR code:', err)
    }
  }

  useEffect(() => {
    const storedUserName = localStorage.getItem('userName')
    // Load user data from localStorage
    const storedUserId = localStorage.getItem('userId')
    const storedFriends = localStorage.getItem('friends')

    if (storedUserId && storedUserName) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUserName(storedUserName)
      setIsRegistered(true)
      setUserId(storedUserId)
      generateQRCode(storedUserId, storedUserName)
    }

    if (storedFriends) {
      setFriends(JSON.parse(storedFriends))
    }
  }, [])

  

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!userName.trim()) return

    const newUserId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    setUserId(newUserId)
    
    localStorage.setItem('userId', newUserId)
    localStorage.setItem('userName', userName)
    
    generateQRCode(newUserId, userName)
    setIsRegistered(true)
  }

  const handleScan = (data: string) => {
    try {
      console.log('Scanned data:', data)
      
      // Parse the JSON data
      const friendData = JSON.parse(data)
      
      // Validate the data structure
      if (!friendData.userId || !friendData.userName) {
        alert('Invalid QR code format. Please scan a valid QR Connect code.')
        return
      }
      
      // Check if already friends
      if (friends.some(f => f.id === friendData.userId)) {
        alert('Already connected with this user!')
        setShowScanner(false)
        return
      }

      // Check if scanning own QR code
      if (friendData.userId === userId) {
        alert('Cannot connect with yourself!')
        setShowScanner(false)
        return
      }

      const newFriend: Friend = {
        id: friendData.userId,
        name: friendData.userName,
        connectedAt: new Date().toLocaleString(),
      }

      const updatedFriends = [...friends, newFriend]
      setFriends(updatedFriends)
      localStorage.setItem('friends', JSON.stringify(updatedFriends))
      
      setShowScanner(false)
      alert(`✅ Successfully connected with ${friendData.userName}!`)
    } catch (err) {
      console.error('Invalid QR code:', err)
      alert('❌ Invalid QR code. Please scan a QR Connect code.')
    }
  }

  const handleRemoveFriend = (friendId: string) => {
    const updatedFriends = friends.filter(f => f.id !== friendId)
    setFriends(updatedFriends)
    localStorage.setItem('friends', JSON.stringify(updatedFriends))
  }

  const handleReset = () => {
    if (confirm('Are you sure you want to reset? This will delete all your data.')) {
      localStorage.clear()
      setUserId('')
      setUserName('')
      setQrCode('')
      setFriends([])
      setIsRegistered(false)
    }
  }

  if (!isRegistered) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
            QR Connect
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Connect with friends instantly
          </p>
          
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your Name
              </label>
              <input
                type="text"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                placeholder="Your name"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none text-gray-800"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
            >
              Get Started
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome, {userName}!</h1>
              <p className="text-sm text-gray-500 mt-1">User ID: {userId}</p>
            </div>
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Reset
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* QR Code Display */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Your QR Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Let others scan this code to connect with you
            </p>
            {qrCode && (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img src={qrCode} alt="Your QR Code" className="rounded-lg shadow-md" />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      const link = document.createElement('a')
                      link.href = qrCode
                      link.download = `qr-code-${userName}.png`
                      link.click()
                    }}
                    className="flex-1 bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                  >
                    📥 Download
                  </button>
                </div>
                <p className="text-xs text-center text-gray-500">
                  Download to connect with friends
                </p>
              </div>
            )}
          </div>

          {/* QR Scanner */}
          <div className="bg-white rounded-2xl shadow-2xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Scan QR Code</h2>
            <p className="text-sm text-gray-600 mb-4">
              Scan a friend&apos;s QR code to connect
            </p>
            
            {!showScanner ? (
              <button
                onClick={() => setShowScanner(true)}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg"
              >
                Open Scanner
              </button>
            ) : (
              <div className="space-y-4">
                <QRScanner onScan={handleScan} />
                <button
                  onClick={() => setShowScanner(false)}
                  className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition-colors"
                >
                  Close Scanner
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Friends List */}
        <div className="bg-white rounded-2xl shadow-2xl p-6 mt-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">
            My Friends ({friends.length})
          </h2>
          
          {friends.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No friends yet. Scan a QR code to connect!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <h3 className="font-semibold text-gray-800">{friend.name}</h3>
                    <p className="text-xs text-gray-500">Connected: {friend.connectedAt}</p>
                  </div>
                  <button
                    onClick={() => handleRemoveFriend(friend.id)}
                    className="px-3 py-1 bg-red-500 text-white text-sm rounded hover:bg-red-600 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
