export interface Gig {
  id: string
  title: string
  description: string
  category: string
  budget: number
  deadline: string
  status: 'open' | 'in-progress' | 'completed'
  postedBy: {
    id: string
    name: string
    email: string
    image?: string
  }
  createdAt: string
  bids: Bid[]
}

export interface Bid {
  id: string
  gigId: string
  bidderId: string
  bidderName: string
  bidderEmail: string
  bidderImage?: string
  amount: number
  estimatedTime: string
  proposal: string
  status: 'pending' | 'accepted' | 'rejected'
  createdAt: string
}

export interface Portfolio {
  id: string
  userId: string
  gigId: string
  gigTitle: string
  category: string
  completedAt: string
  rating?: number
  review?: string
}
