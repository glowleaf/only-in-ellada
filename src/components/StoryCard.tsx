'use client'

import Link from 'next/link'
import { StoryWithDetails } from '@/types/database'
import { VoteButtons } from './VoteButtons'
import { formatDistanceToNow } from 'date-fns'

interface StoryCardProps {
  story: StoryWithDetails
}

export function StoryCard({ story }: StoryCardProps) {
  const getCategoryClass = (slug: string) => {
    return `category-tag ${slug}`
  }

  const formatTimeAgo = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true })
  }

  return (
    <div className="story-card">
      <div className="story-header">
        <div className="flex-1">
          <Link href={`/stories/${story.id}`}>
            <h2 className="story-title hover:text-blue-600 cursor-pointer">
              {story.title}
            </h2>
          </Link>
          <div className="story-content">
            {story.content.length > 300 
              ? `${story.content.substring(0, 300)}...` 
              : story.content
            }
          </div>
        </div>
        <VoteButtons 
          storyId={story.id}
          currentVotes={story.upvotes - story.downvotes}
          userVote={story.user_vote?.vote_type}
        />
      </div>
      <div className="story-footer">
        <div className="story-meta">
          <span className={getCategoryClass(story.categories.slug)}>
            {story.categories.emoji} {story.categories.name}
          </span>
          <span>🇬🇷 Greece</span>
          <span>{formatTimeAgo(story.created_at)}</span>
        </div>
        <Link href={`/stories/${story.id}`} className="hover:text-blue-600">
          💬 {story.comment_count}
        </Link>
      </div>
    </div>
  )
} 