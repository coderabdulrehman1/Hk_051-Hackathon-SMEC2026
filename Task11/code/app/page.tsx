'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Briefcase, Plus, Clock, DollarSign, User, Award, LogOut, Filter } from 'lucide-react'
import { Gig, Bid, Portfolio } from '@/types'

export default function Home() {
  const { data: session, status } = useSession()
  const [activeTab, setActiveTab] = useState<'gigs' | 'my-gigs' | 'my-bids' | 'portfolio'>('gigs')
  const [showCreateGig, setShowCreateGig] = useState(false)
  const [showBidModal, setShowBidModal] = useState(false)
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null)
  const [gigs, setGigs] = useState<Gig[]>([])
  const [filterCategory, setFilterCategory] = useState<string>('all')

  // Load data from localStorage
  useEffect(() => {
    if (session) {
      const storedGigs = localStorage.getItem('gigs')
      if (storedGigs) {
        setGigs(JSON.parse(storedGigs))
      }
    }
  }, [session])

  // Save gigs to localStorage
  const saveGigs = (updatedGigs: Gig[]) => {
    setGigs(updatedGigs)
    localStorage.setItem('gigs', JSON.stringify(updatedGigs))
  }

  // Create new gig
  const handleCreateGig = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const newGig: Gig = {
      id: 'gig_' + Date.now(),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      category: formData.get('category') as string,
      budget: Number(formData.get('budget')),
      deadline: formData.get('deadline') as string,
      status: 'open',
      postedBy: {
        id: session!.user!.id!,
        name: session!.user!.name!,
        email: session!.user!.email!,
        image: session!.user!.image || undefined,
      },
      createdAt: new Date().toISOString(),
      bids: [],
    }

    saveGigs([...gigs, newGig])
    setShowCreateGig(false)
    e.currentTarget.reset()
  }

  // Submit bid
  const handleSubmitBid = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selectedGig) return

    const formData = new FormData(e.currentTarget)
    
    const newBid: Bid = {
      id: 'bid_' + Date.now(),
      gigId: selectedGig.id,
      bidderId: session!.user!.id!,
      bidderName: session!.user!.name!,
      bidderEmail: session!.user!.email!,
      bidderImage: session!.user!.image || undefined,
      amount: Number(formData.get('amount')),
      estimatedTime: formData.get('estimatedTime') as string,
      proposal: formData.get('proposal') as string,
      status: 'pending',
      createdAt: new Date().toISOString(),
    }

    const updatedGigs = gigs.map(gig => {
      if (gig.id === selectedGig.id) {
        return { ...gig, bids: [...gig.bids, newBid] }
      }
      return gig
    })

    saveGigs(updatedGigs)
    setShowBidModal(false)
    setSelectedGig(null)
    alert('Bid submitted successfully!')
  }

  // Accept bid
  const handleAcceptBid = (gigId: string, bidId: string) => {
    const updatedGigs = gigs.map(gig => {
      if (gig.id === gigId) {
        const updatedBids = gig.bids.map(bid => {
          if (bid.id === bidId) {
            return { ...bid, status: 'accepted' as const }
          }
          return bid
        })
        return { ...gig, status: 'in-progress' as const, bids: updatedBids }
      }
      return gig
    })

    saveGigs(updatedGigs)
    alert('Bid accepted! Gig is now in progress.')
  }

  // Complete gig
  const handleCompleteGig = (gigId: string) => {
    const gig = gigs.find(g => g.id === gigId)
    if (!gig) return

    const acceptedBid = gig.bids.find(b => b.status === 'accepted')
    if (!acceptedBid) return

    // Update gig status
    const updatedGigs = gigs.map(g => {
      if (g.id === gigId) {
        return { ...g, status: 'completed' as const }
      }
      return g
    })
    saveGigs(updatedGigs)

    // Add to portfolio
    const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]')
    const newPortfolio: Portfolio = {
      // eslint-disable-next-line react-hooks/purity
      id: 'portfolio_' + Date.now(),
      userId: acceptedBid.bidderId,
      gigId: gig.id,
      gigTitle: gig.title,
      category: gig.category,
      completedAt: new Date().toISOString(),
    }
    localStorage.setItem('portfolios', JSON.stringify([...portfolios, newPortfolio]))

    alert('Gig marked as completed! Added to portfolio.')
  }

  // Get filtered gigs
  const getFilteredGigs = () => {
    let filtered = gigs
    if (filterCategory !== 'all') {
      filtered = filtered.filter(g => g.category === filterCategory)
    }
    return filtered.filter(g => g.status === 'open')
  }

  // Get my gigs
  const getMyGigs = () => {
    return gigs.filter(g => g.postedBy.id === session?.user?.id)
  }

  // Get my bids
  const getMyBids = () => {
    const myBids: (Bid & { gig: Gig })[] = []
    gigs.forEach(gig => {
      gig.bids.forEach(bid => {
        if (bid.bidderId === session?.user?.id) {
          myBids.push({ ...bid, gig })
        }
      })
    })
    return myBids
  }

  // Get my portfolio
  const getMyPortfolio = (): Portfolio[] => {
    const portfolios = JSON.parse(localStorage.getItem('portfolios') || '[]')
    return portfolios.filter((p: Portfolio) => p.userId === session?.user?.id)
  }

  // Login screen
  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="mb-6">
            <Briefcase className="w-16 h-16 mx-auto text-purple-600 mb-4" />
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Student Gigs</h1>
            <p className="text-gray-600">Find quick tasks or offer your skills</p>
          </div>
          
          <button
            onClick={() => signIn('google')}
            className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 px-6 rounded-lg font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-3"
          >
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <p className="mt-6 text-sm text-gray-500">
            Sign in to post gigs, bid on tasks, and build your portfolio
          </p>
        </div>
      </div>
    )
  }

  const categories = ['all', 'tutoring', 'design', 'writing', 'coding', 'other']

  return (
    <div className="min-h-screen p-4 py-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-4 md:p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <img
                src={session.user?.image || ''}
                alt={session.user?.name || ''}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h2 className="font-bold text-gray-800">{session.user?.name}</h2>
                <p className="text-sm text-gray-500">{session.user?.email}</p>
              </div>
            </div>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl p-2 mb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveTab('gigs')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'gigs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Gigs
            </button>
            <button
              onClick={() => setActiveTab('my-gigs')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'my-gigs'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Gigs
            </button>
            <button
              onClick={() => setActiveTab('my-bids')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'my-bids'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              My Bids
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`flex-1 min-w-[120px] py-3 px-4 rounded-lg font-medium transition-colors ${
                activeTab === 'portfolio'
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Portfolio
            </button>
          </div>
        </div>

        {/* Create Gig Button */}
        {activeTab === 'gigs' && (
          <button
            onClick={() => setShowCreateGig(true)}
            className="w-full md:w-auto mb-6 flex items-center justify-center gap-2 px-6 py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Post New Gig
          </button>
        )}

        {/* Filter for All Gigs */}
        {activeTab === 'gigs' && (
          <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-5 h-5 text-gray-600" />
              <span className="font-medium text-gray-700">Filter by Category</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                    filterCategory === cat
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {/* All Gigs Tab */}
          {activeTab === 'gigs' && (
            <>
              {getFilteredGigs().length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">No gigs available. Be the first to post one!</p>
                </div>
              ) : (
                getFilteredGigs().map(gig => (
                  <div key={gig.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-3">
                          <img
                            src={gig.postedBy.image || ''}
                            alt={gig.postedBy.name}
                            className="w-10 h-10 rounded-full"
                          />
                          <div>
                            <h3 className="text-xl font-bold text-gray-800">{gig.title}</h3>
                            <p className="text-sm text-gray-500">by {gig.postedBy.name}</p>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-3">{gig.description}</p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                            {gig.category}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            Budget: ${gig.budget}
                          </span>
                          <span className="flex items-center gap-1 text-gray-600">
                            <Clock className="w-4 h-4" />
                            Due: {new Date(gig.deadline).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {gig.postedBy.id !== session.user?.id && (
                        <button
                          onClick={() => {
                            setSelectedGig(gig)
                            setShowBidModal(true)
                          }}
                          disabled={gig.bids.some(b => b.bidderId === session.user?.id)}
                          className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                          {gig.bids.some(b => b.bidderId === session.user?.id) ? 'Bid Submitted' : 'Place Bid'}
                        </button>
                      )}
                    </div>
                    {gig.bids.length > 0 && (
                      <div className="pt-3 border-t">
                        <p className="text-sm text-gray-600 font-medium mb-2">{gig.bids.length} bid(s) received</p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* My Gigs Tab */}
          {activeTab === 'my-gigs' && (
            <>
              {getMyGigs().length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">You haven&apos;t posted any gigs yet</p>
                  <button
                    onClick={() => {
                      setActiveTab('gigs')
                      setShowCreateGig(true)
                    }}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Post Your First Gig
                  </button>
                </div>
              ) : (
                getMyGigs().map(gig => (
                  <div key={gig.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{gig.title}</h3>
                          <p className="text-sm text-gray-500 capitalize">Status: {gig.status}</p>
                        </div>
                        {gig.status === 'in-progress' && (
                          <button
                            onClick={() => handleCompleteGig(gig.id)}
                            className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-colors text-sm"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-600 mb-3">{gig.description}</p>
                      <div className="flex flex-wrap gap-3 text-sm">
                        <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                          {gig.category}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          ${gig.budget}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {new Date(gig.deadline).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {gig.bids.length > 0 && (
                      <div className="pt-4 border-t">
                        <h4 className="font-semibold text-gray-800 mb-3">Bids ({gig.bids.length})</h4>
                        <div className="space-y-3">
                          {gig.bids.map(bid => (
                            <div key={bid.id} className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={bid.bidderImage || ''}
                                    alt={bid.bidderName}
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div>
                                    <p className="font-medium text-gray-800">{bid.bidderName}</p>
                                    <p className="text-xs text-gray-500">{bid.bidderEmail}</p>
                                  </div>
                                </div>
                                {bid.status === 'pending' && gig.status === 'open' && (
                                  <button
                                    onClick={() => handleAcceptBid(gig.id, bid.id)}
                                    className="px-4 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600 transition-colors"
                                  >
                                    Accept
                                  </button>
                                )}
                                {bid.status === 'accepted' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                                    Accepted
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">{bid.proposal}</p>
                              <div className="flex gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-4 h-4" />
                                  ${bid.amount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {bid.estimatedTime}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </>
          )}

          {/* My Bids Tab */}
          {activeTab === 'my-bids' && (
            <>
              {getMyBids().length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <DollarSign className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 mb-4">You haven&apos;t placed any bids yet</p>
                  <button
                    onClick={() => setActiveTab('gigs')}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                  >
                    Browse Gigs
                  </button>
                </div>
              ) : (
                getMyBids().map(({ gig, ...bid }) => (
                  <div key={bid.id} className="bg-white rounded-xl shadow-lg p-6">
                    <div className="mb-4">
                      <h3 className="text-xl font-bold text-gray-800 mb-1">{gig.title}</h3>
                      <p className="text-sm text-gray-500 mb-2">Posted by {gig.postedBy.name}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          bid.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          bid.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {bid.status === 'pending' ? 'Pending' : bid.status === 'accepted' ? 'Accepted' : 'Rejected'}
                        </span>
                        {gig.status === 'completed' && (
                          <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-600 mb-3">{bid.proposal}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="flex items-center gap-1 text-gray-600">
                          <DollarSign className="w-4 h-4" />
                          Your bid: ${bid.amount}
                        </span>
                        <span className="flex items-center gap-1 text-gray-600">
                          <Clock className="w-4 h-4" />
                          {bid.estimatedTime}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </>
          )}

          {/* Portfolio Tab */}
          {activeTab === 'portfolio' && (
            <>
              {getMyPortfolio().length === 0 ? (
                <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                  <Award className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Your portfolio is empty. Complete gigs to build it!</p>
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-2xl font-bold text-gray-800 mb-6">My Portfolio</h3>
                  <div className="space-y-4">
                    {getMyPortfolio().map(item => (
                      <div key={item.id} className="p-4 bg-gray-50 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">{item.gigTitle}</h4>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full capitalize">
                            {item.category}
                          </span>
                          <span>Completed: {new Date(item.completedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create Gig Modal */}
      {showCreateGig && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Post New Gig</h2>
            <form onSubmit={handleCreateGig} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., Need help with calculus homework"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Describe what you need help with..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  name="category"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                >
                  <option value="tutoring">Tutoring</option>
                  <option value="design">Design</option>
                  <option value="writing">Writing</option>
                  <option value="coding">Coding</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Budget ($)</label>
                <input
                  type="number"
                  name="budget"
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Deadline</label>
                <input
                  type="date"
                  name="deadline"
                  required
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateGig(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Post Gig
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bid Modal */}
      {showBidModal && selectedGig && (
        <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Place Your Bid</h2>
            <p className="text-gray-600 mb-4">For: {selectedGig.title}</p>
            <form onSubmit={handleSubmitBid} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Bid Amount ($)
                </label>
                <input
                  type="number"
                  name="amount"
                  required
                  min="1"
                  max={selectedGig.budget}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder={`Max: $${selectedGig.budget}`}
                />
                <p className="text-xs text-gray-500 mt-1">Budget: ${selectedGig.budget}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimated Time to Complete
                </label>
                <input
                  type="text"
                  name="estimatedTime"
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="e.g., 2 hours, 1 day"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Proposal
                </label>
                <textarea
                  name="proposal"
                  required
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                  placeholder="Explain why you're the best fit for this task..."
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowBidModal(false)
                    setSelectedGig(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Submit Bid
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
