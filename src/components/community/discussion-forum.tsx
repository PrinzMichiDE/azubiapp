/**
 * Diskussionsforum für Azubi-Community
 * Discussion forum for apprentice community
 */
'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ChatBubbleLeftRightIcon,
  HandRaiseIcon,
  HeartIcon,
  ShareIcon,
  FlagIcon,
  UserGroupIcon,
  AcademicCapIcon,
  BriefcaseIcon
} from '@heroicons/react/24/outline'

interface ForumPost {
  id: string
  title: string
  content: string
  author: {
    id: string
    name: string
    apprenticeshipYear: number
    profession: string
    avatar?: string
  }
  category: 'Frage' | 'Diskussion' | 'Tipp' | 'Erfahrung' | 'Prüfung'
  tags: string[]
  likes: number
  replies: number
  isLiked: boolean
  isPinned: boolean
  createdAt: string
  lastActivity: string
}

interface DiscussionForumProps {
  posts: ForumPost[]
  currentUserId: string
  onCreatePost?: () => void
  onLikePost?: (postId: string) => void
  onReplyPost?: (postId: string) => void
  onReportPost?: (postId: string) => void
  className?: string
}

/**
 * Diskussionsforum für soziales Lernen in der Azubi-Community
 * Discussion forum for social learning in the apprentice community
 * 
 * Features:
 * - Kategorisierte Diskussionen (Fragen, Tipps, Erfahrungen)
 * - Peer-to-Peer Learning zwischen Azubis
 * - Ausbilder-Moderation und Expertise
 * - Gamification (Likes, Best Answers)
 * - Mobile-optimierte Darstellung
 * 
 * @param posts - Forum-Posts / Forum posts
 * @param currentUserId - Aktuelle Benutzer-ID / Current user ID
 * @param onCreatePost - Post-Erstellungs-Callback / Post creation callback
 * @param onLikePost - Like-Callback / Like callback
 * @param onReplyPost - Antwort-Callback / Reply callback
 * @param onReportPost - Melde-Callback / Report callback
 */
export function DiscussionForum({
  posts,
  currentUserId,
  onCreatePost,
  onLikePost,
  onReplyPost,
  onReportPost,
  className
}: DiscussionForumProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'unanswered'>('latest')

  const categories = [
    { id: 'all', name: 'Alle', icon: ChatBubbleLeftRightIcon },
    { id: 'Frage', name: 'Fragen', icon: HandRaiseIcon },
    { id: 'Diskussion', name: 'Diskussionen', icon: UserGroupIcon },
    { id: 'Tipp', name: 'Tipps', icon: AcademicCapIcon },
    { id: 'Erfahrung', name: 'Erfahrungen', icon: ShareIcon },
    { id: 'Prüfung', name: 'Prüfungen', icon: BriefcaseIcon }
  ]

  // Filter und sortieren
  const filteredPosts = posts
    .filter(post => selectedCategory === 'all' || post.category === selectedCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.likes - a.likes
        case 'unanswered':
          return a.replies - b.replies
        case 'latest':
        default:
          return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      }
    })

  const getCategoryColor = (category: string) => {
    const colors = {
      'Frage': 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
      'Diskussion': 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
      'Tipp': 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
      'Erfahrung': 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
      'Prüfung': 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
  }

  const getYearBadge = (year: number) => {
    const colors = {
      1: 'bg-green-50 text-green-700 border-green-200',
      2: 'bg-blue-50 text-blue-700 border-blue-200',
      3: 'bg-purple-50 text-purple-700 border-purple-200'
    }
    return colors[year as keyof typeof colors] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header mit Aktionen */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-6 w-6 mr-2" />
              Azubi-Community Forum
            </CardTitle>
            <Button onClick={onCreatePost}>
              Neuen Beitrag erstellen
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Filter und Sortierung */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Kategorie-Filter */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => {
                const Icon = category.icon
                return (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category.id)}
                    className="flex items-center space-x-1"
                  >
                    <Icon className="h-4 w-4" />
                    <span>{category.name}</span>
                  </Button>
                )
              })}
            </div>

            {/* Sortierung */}
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Sortieren:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 bg-white dark:bg-gray-800"
              >
                <option value="latest">Neueste</option>
                <option value="popular">Beliebteste</option>
                <option value="unanswered">Unbeantwortet</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Posts Liste */}
      <div className="space-y-4">
        {filteredPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className={cn(
              'hover:shadow-md transition-shadow',
              post.isPinned && 'border-l-4 border-l-yellow-500'
            )}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <Badge className={getCategoryColor(post.category)}>
                          {post.category}
                        </Badge>
                        {post.isPinned && (
                          <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                            📌 Angepinnt
                          </Badge>
                        )}
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
                        {post.title}
                      </h3>
                      
                      <p className="text-gray-600 dark:text-gray-400 line-clamp-3 mb-3">
                        {post.content}
                      </p>
                    </div>
                  </div>

                  {/* Author Info */}
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2">
                      {post.author.avatar ? (
                        <img
                          src={post.author.avatar}
                          alt={post.author.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
                          <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                            {post.author.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {post.author.name}
                        </p>
                        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
                          <Badge 
                            variant="outline" 
                            className={cn('text-xs', getYearBadge(post.author.apprenticeshipYear))}
                          >
                            {post.author.apprenticeshipYear}. Lehrjahr
                          </Badge>
                          <span>{post.author.profession}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tags */}
                  {post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {post.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {/* Aktionen */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
                      <span>{new Date(post.createdAt).toLocaleDateString('de-DE')}</span>
                      <span>•</span>
                      <span>{post.replies} Antworten</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onLikePost?.(post.id)}
                        className={cn(
                          'flex items-center space-x-1',
                          post.isLiked && 'text-red-500'
                        )}
                      >
                        <HeartIcon className={cn(
                          'h-4 w-4',
                          post.isLiked && 'fill-current'
                        )} />
                        <span>{post.likes}</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReplyPost?.(post.id)}
                        className="flex items-center space-x-1"
                      >
                        <ChatBubbleLeftRightIcon className="h-4 w-4" />
                        <span>Antworten</span>
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onReportPost?.(post.id)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <FlagIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {filteredPosts.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Keine Beiträge gefunden
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {selectedCategory === 'all' 
                ? 'Noch keine Diskussionen gestartet.'
                : `Keine Beiträge in der Kategorie "${selectedCategory}" gefunden.`
              }
            </p>
            <Button onClick={onCreatePost}>
              Ersten Beitrag erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Community Stats */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                {posts.length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Beiträge</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {posts.reduce((sum, p) => sum + p.replies, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Antworten</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {posts.reduce((sum, p) => sum + p.likes, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Likes</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {new Set(posts.map(p => p.author.id)).size}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Teilnehmer</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
