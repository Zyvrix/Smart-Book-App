'use client'
import BookmarkUI from '@/components/BookmarkUI'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface Bookmark {
  id: string
  url: string
  title: string
  user_id: string
  created_at: string
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null)
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newTitle, setNewTitle] = useState('')

  // Auth 

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }

    init()

    const { data: { subscription } } =
      supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
      })

    return () => subscription.unsubscribe()
  }, [])

  // fething bookmarks & realtime updates

  useEffect(() => {
    if (!user) return

    fetchBookmarks()

    const channel = supabase
      .channel('bookmarks-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookmarks',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            setBookmarks((current) => {
              const exists = current.find(b => b.id === payload.new.id)
              if (exists) return current
              return [payload.new as Bookmark, ...current]
            })
          }

          if (payload.eventType === 'DELETE' && payload.old) {
            setBookmarks((current) =>
              current.filter((bookmark) => bookmark.id !== payload.old.id)
            )
          }

          if (payload.eventType === 'UPDATE' && payload.new) {
            setBookmarks((current) =>
              current.map((bookmark) =>
                bookmark.id === payload.new.id
                  ? (payload.new as Bookmark)
                  : bookmark
              )
            )
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime status:', status)
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  const fetchBookmarks = async () => {
    const { data } = await supabase
      .from('bookmarks')
      .select('*')
      .order('created_at', { ascending: false })

    setBookmarks(data || [])
  }

  // auth 

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback`,
      },
    })
  }

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    setBookmarks([])
  }

  // add bookmark

  const addBookmark = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newUrl || !newTitle || !user) return

    const { data, error } = await supabase
      .from('bookmarks')
      .insert([
        {
          url: newUrl,
          title: newTitle,
          user_id: user.id,

        },
      ])
      .select()

    if (error) {
      console.error(error)
      return
    }

    if (data && data.length > 0) {
      setBookmarks((prev) => [data[0] as Bookmark, ...prev])
    }

    setNewUrl('')
    setNewTitle('')
  }

  // Delete bookmark

  const deleteBookmark = async (id: string) => {
    setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))

    const { error } = await supabase
      .from('bookmarks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(error)
      fetchBookmarks()
    }
  }

  // --UI-- 

  if (loading) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Loading...</div>
    </div>
  )
}

if (!user) {
  return (
    <div className="min-h-screen bg-[#f4efe6] flex items-center justify-center relative overflow-hidden">

      {/* Soft organic blobs */}
      <div className="absolute w-[500px] h-[500px] bg-[#e7dccb] rounded-full blur-3xl -top-32 -left-32 opacity-70" />
      <div className="absolute w-[400px] h-[400px] bg-[#d8cbb8] rounded-full blur-3xl -bottom-32 -right-32 opacity-60" />

      <div className="relative z-10 bg-white/60 backdrop-blur-xl border border-[#e0d6c6] shadow-xl rounded-3xl p-12 max-w-lg w-full text-center">

        <h1 className="text-4xl font-semibold tracking-tight text-[#3e3a34] mb-4">
          Smart <span className="text-[#8b6f47]">Bookmarks App</span>
        </h1>

        <p className="text-[#6e665c] mb-8 leading-relaxed">
          A calm space for your favorite links.
          Organized beautifully. Synced instantly.
        </p>

        <button
          onClick={signInWithGoogle}
          className="w-full py-4 rounded-xl font-medium bg-[#8b6f47] text-white hover:bg-[#745a37] transition-all duration-300 shadow-md"
        >
          Continue with Google
        </button>

        <p className="text-xs text-[#9c9284] mt-6">
          Secure sign-in powered by Google OAuth
        </p>

      
      </div>
      
    </div>
  )
}



return (
  <BookmarkUI
    user={user}
    bookmarks={bookmarks}
    newTitle={newTitle}
    newUrl={newUrl}
    setNewTitle={setNewTitle}
    setNewUrl={setNewUrl}
    addBookmark={addBookmark}
    deleteBookmark={deleteBookmark}
    signOut={signOut}
  />
)
}