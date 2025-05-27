'use client'

import { useState } from 'react'
import { useAuth } from './AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'

interface VoteButtonsProps {
  storyId: number
  currentVotes: number
  userVote?: 'up' | 'down'
}

export function VoteButtons({ storyId, currentVotes, userVote }: VoteButtonsProps) {
  const { user } = useAuth()
  const [votes, setVotes] = useState(currentVotes)
  const [currentUserVote, setCurrentUserVote] = useState<'up' | 'down' | null>(userVote || null)
  const [isLoading, setIsLoading] = useState(false)
  const supabase = createClientComponentClient()

  const handleVote = async (voteType: 'up' | 'down') => {
    if (!user || isLoading) return

    setIsLoading(true)

    try {
      if (currentUserVote === voteType) {
        // Remove vote if clicking the same button
        await supabase
          .from('votes')
          .delete()
          .eq('user_id', user.id)
          .eq('story_id', storyId)

        const voteChange = voteType === 'up' ? -1 : 1
        setVotes(prev => prev + voteChange)
        setCurrentUserVote(null)
      } else {
        // Add or change vote
        await supabase
          .from('votes')
          .upsert({
            user_id: user.id,
            story_id: storyId,
            vote_type: voteType
          })

        let voteChange = 0
        if (currentUserVote) {
          // Changing from one vote to another
          voteChange = voteType === 'up' ? 2 : -2
        } else {
          // Adding new vote
          voteChange = voteType === 'up' ? 1 : -1
        }

        setVotes(prev => prev + voteChange)
        setCurrentUserVote(voteType)
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="votes">
      <button
        onClick={() => handleVote('up')}
        disabled={!user || isLoading}
        className={`text-lg ${currentUserVote === 'up' ? 'text-green-600' : 'text-gray-400'} ${
          !user ? 'cursor-not-allowed' : 'hover:text-green-600'
        }`}
      >
        ↑
      </button>
      <span className="vote-count">{votes}</span>
      <button
        onClick={() => handleVote('down')}
        disabled={!user || isLoading}
        className={`text-lg ${currentUserVote === 'down' ? 'text-red-600' : 'text-gray-400'} ${
          !user ? 'cursor-not-allowed' : 'hover:text-red-600'
        }`}
      >
        ↓
      </button>
    </div>
  )
} 