'use client'

import { useState, useEffect } from 'react'
import { Header } from '@/components/Header'
import { StoryCard } from '@/components/StoryCard'
import { CreateStoryModal } from '@/components/CreateStoryModal'
import { useAuth } from '@/components/AuthProvider'
import { createClientComponentClient } from '@/lib/supabase'
import { StoryWithDetails, Category } from '@/types/database'

export default function Home() {
  const { user } = useAuth()
  const [stories, setStories] = useState<StoryWithDetails[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('new')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchCategories()
    fetchStories()
  }, [selectedCategory, sortBy])

  const fetchCategories = async () => {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('name')
    
    if (data) setCategories(data)
  }

  const fetchStories = async () => {
    setLoading(true)
    
    let query = supabase
      .from('stories')
      .select(`
        *,
        users (id, name, email, avatar_url),
        categories (id, name, slug, emoji, color),
        votes (vote_type)
      `)

    // Filter by category
    if (selectedCategory !== 'all') {
      const category = categories.find(c => c.slug === selectedCategory)
      if (category) {
        query = query.eq('category_id', category.id)
      }
    }

    // Add user vote if logged in
    if (user) {
      query = query.eq('votes.user_id', user.id)
    }

    // Sort
    switch (sortBy) {
      case 'top':
        query = query.order('upvotes', { ascending: false })
        break
      case 'new':
      default:
        query = query.order('created_at', { ascending: false })
        break
    }

    const { data } = await query

    if (data) {
      // Transform data to include comment counts and user votes
      const storiesWithDetails: StoryWithDetails[] = await Promise.all(
        data.map(async (story: any) => {
          // Get comment count
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('story_id', story.id)

          return {
            ...story,
            comment_count: count || 0,
            user_vote: story.votes?.[0] || null
          }
        })
      )

      setStories(storiesWithDetails)
    }
    
    setLoading(false)
  }

  const filters = [
    { key: 'all', label: '🕐 New', active: selectedCategory === 'all' && sortBy === 'new' },
    { key: 'top', label: '🔥 Top', active: sortBy === 'top' },
    ...categories.map(cat => ({
      key: cat.slug,
      label: `${cat.emoji} ${cat.name}`,
      active: selectedCategory === cat.slug
    }))
  ]

  const handleFilterClick = (filterKey: string) => {
    if (filterKey === 'top') {
      setSortBy('top')
      setSelectedCategory('all')
    } else if (filterKey === 'all') {
      setSortBy('new')
      setSelectedCategory('all')
    } else {
      setSelectedCategory(filterKey)
      setSortBy('new')
    }
  }

  return (
    <>
      <Header />
      
      <div className="container">
        <div className="hero">
          <h1>Share your 🇬🇷 Greece story</h1>
          <p>We love Greece ❤️</p>
          <div className="hero-description">
            But we also experience many crazy and frustrating things we've never experienced 
            anywhere else in the world. Experiences that just make you pull your hair out, or laugh at 
            how completely absurd and Kafka-esque basic service interactions can be in Greece, 
            with businesses, government services, or even just restaurants.
            <br /><br />
            When we complain, the usual response from Greeks online is "if you don't like it, leave". 
            But that doesn't seem to be a very productive approach.
            <br /><br />
            We want to collect these stories to understand patterns, find solutions, and maybe just 
            have a good laugh (or cry) together. Because sometimes you need to know you're not alone 
            in experiencing the beautiful madness that is Greece.
          </div>
          <button 
            className="post-button"
            onClick={() => setShowCreateModal(true)}
          >
            ➕ Post your Greece story
          </button>
        </div>

        <div className="filters">
          {filters.map(filter => (
            <button
              key={filter.key}
              className={`filter-button ${filter.active ? 'active' : ''}`}
              onClick={() => handleFilterClick(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading stories...</div>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-500">No stories found. Be the first to share your experience!</div>
          </div>
        ) : (
          <div>
            {stories.map(story => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateStoryModal 
          onClose={() => setShowCreateModal(false)}
          onStoryCreated={fetchStories}
        />
      )}
    </>
  )
}
