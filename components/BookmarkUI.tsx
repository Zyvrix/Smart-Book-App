'use client'

import type { User } from '@supabase/supabase-js'

interface Bookmark {
  id: string
  url: string
  title: string
  created_at: string
}

interface Props {
  user: User
  bookmarks: Bookmark[]
  newTitle: string
  newUrl: string
  setNewTitle: (v: string) => void
  setNewUrl: (v: string) => void
  addBookmark: (e: React.FormEvent) => void
  deleteBookmark: (id: string) => void
  signOut: () => void
}

export default function BookmarkUI({
  user,
  bookmarks,
  newTitle,
  newUrl,
  setNewTitle,
  setNewUrl,
  addBookmark,
  deleteBookmark,
  signOut,
}: Props) {
  return (
    <div className="min-h-screen bg-[#f6f1e8] text-[#2e2a25]">

      {/* nav */}
      <div className="flex justify-between items-center px-10 py-6 border-b border-[#e6ddd1] bg-white/70 backdrop-blur-md">
        <h1 className="text-xl font-semibold tracking-wide">
          Smart <span className="text-[#8b6f47]">Bookmarks</span>
        </h1>

        <div className="flex items-center gap-4">
          <span className="text-sm text-[#7c746a]">{user.email}</span>
          <button
            onClick={signOut}
            className="px-4 py-2 rounded-lg bg-[#8b6f47] text-white text-sm hover:bg-[#735a38] transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* content */}
      <div className="max-w-5xl mx-auto px-6 py-12">

        {/* header */}
        <div className="mb-12">
          <h2 className="text-4xl font-semibold mb-3">
            Your Collection
          </h2>
          <p className="text-[#7c746a]">
            Save and organize your favorite links in one calm space.
          </p>
        </div>

        {/* add bookmark */}
        <div className="bg-white border border-[#e6ddd1] rounded-2xl p-8 shadow-sm mb-12">
          <form onSubmit={addBookmark} className="space-y-5">
            <input
              type="text"
              placeholder="Bookmark title"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#e6ddd1] focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
              required
            />
            <input
              type="url"
              placeholder="https://example.com"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-[#e6ddd1] focus:outline-none focus:ring-2 focus:ring-[#8b6f47]"
              required
            />
            <button
              type="submit"
              className="w-full py-3 rounded-lg bg-[#8b6f47] text-white font-medium hover:bg-[#735a38] transition"
            >
              Add Bookmark
            </button>
          </form>
        </div>

        {/* bookmark grid */}
        {bookmarks.length === 0 ? (
          <div className="text-center py-20 text-[#8f867c]">
            No bookmarks yet.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bookmarks.map((bookmark) => (
              <div
                key={bookmark.id}
                className="bg-white border border-[#e6ddd1] rounded-2xl p-6 hover:shadow-md transition group"
              >
                <h3 className="font-semibold text-lg mb-2 group-hover:text-[#8b6f47] transition">
                  {bookmark.title}
                </h3>

                <a
                  href={bookmark.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-[#8b6f47] break-all"
                >
                  {bookmark.url}
                </a>

                <div className="flex justify-between items-center mt-6">
                  <span className="text-xs text-[#a49c91]">
                    {new Date(bookmark.created_at).toLocaleDateString()}
                  </span>

                  <button
                    onClick={() => deleteBookmark(bookmark.id)}
                    className="text-sm text-red-500 hover:text-red-700 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* footer */}
      <div className="text-center py-8 text-sm text-[#a49c91] border-t border-[#e6ddd1]">
        Crafted with care by <span className="text-[#8b6f47] font-medium"><a href="https://www.linkedin.com/in/dineshyadav9256/">Dinesh</a></span>
      </div>

    </div>
  )
}
