# Smart Bookmark App

A real-time bookmark manager built with Next.js, Supabase, and Google OAuth. This application allows users to save, organize, and manage their bookmarks with real-time synchronization across multiple tabs and devices.

## Features

- Google OAuth authentication (no email/password)
- Add bookmarks with URL and title
- Private bookmarks (each user sees only their own)
- Real-time updates across tabs without page refresh
- Delete bookmarks
- Deployed on Vercel with live URL

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase (PostgreSQL)
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Live Demo

[Live URL will be here after deployment]

## Setup Instructions

### Prerequisites

- Node.js 18+ installed
- A Supabase account
- A Google Cloud Console account (for OAuth)
- A Vercel account (for deployment)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd smart-bookmark-app
npm install
```

### 2. Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the database to initialize

#### Create the Bookmarks Table

In the Supabase SQL Editor, run this SQL:

```sql
-- Create bookmarks table
create table bookmarks (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  url text not null,
  title text not null,
  user_id uuid references auth.users(id) on delete cascade not null
);

-- Enable Row Level Security
alter table bookmarks enable row level security;

-- Create policy: Users can only see their own bookmarks
create policy "Users can view own bookmarks"
  on bookmarks for select
  using (auth.uid() = user_id);

-- Create policy: Users can insert their own bookmarks
create policy "Users can insert own bookmarks"
  on bookmarks for insert
  with check (auth.uid() = user_id);

-- Create policy: Users can delete their own bookmarks
create policy "Users can delete own bookmarks"
  on bookmarks for delete
  using (auth.uid() = user_id);

-- Create policy: Users can update their own bookmarks
create policy "Users can update own bookmarks"
  on bookmarks for update
  using (auth.uid() = user_id);

-- Enable realtime
alter publication supabase_realtime add table bookmarks;
```

#### Configure Google OAuth in Supabase

1. In your Supabase project, go to **Authentication** → **Providers**
2. Enable the **Google** provider
3. Note down the **Callback URL** (Redirect URL) - you'll need this for Google Console

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen:
   - User Type: External
   - Add your app name, user support email, and developer contact
   - Add scopes: `email`, `profile`, `openid`
6. Create OAuth 2.0 Client ID:
   - Application type: Web application
   - Authorized redirect URIs: Add the callback URL from Supabase (from step 2.2 above)
   - Also add: `http://localhost:3000/api/auth/callback` for local development
7. Copy the **Client ID** and **Client Secret**
8. Go back to Supabase → **Authentication** → **Providers** → **Google**
9. Paste the Client ID and Client Secret
10. Save the configuration

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Get these values from:
- Supabase Dashboard → Project Settings → API
- Copy the Project URL and anon/public key

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

### 6. Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Select your GitHub repository
5. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
6. Click "Deploy"
7. After deployment, copy the Vercel URL

#### Update Google OAuth Redirect URIs

1. Go back to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add your Vercel URL to Authorized redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback`
4. Save

## Problems Encountered and Solutions

### Problem 1: Google OAuth Redirect Loop

**Issue**: After Google authentication, users were stuck in a redirect loop.

**Solution**: 
- Implemented a proper OAuth callback route handler at `/api/auth/callback/route.ts`
- Used `createRouteHandlerClient` from Supabase Auth Helpers to properly exchange the authorization code for a session
- Ensured the redirect URL in Google Console matched exactly with the callback URL configured in Supabase

### Problem 2: Real-time Updates Not Working Across Tabs

**Issue**: When adding a bookmark in one tab, it didn't appear in other open tabs without refresh.

**Solution**:
- Enabled Supabase Realtime for the bookmarks table using `alter publication supabase_realtime add table bookmarks;`
- Set up a real-time subscription using `supabase.channel()` with postgres_changes event listener
- Filtered the subscription by user_id to ensure users only receive updates for their own bookmarks
- Properly cleaned up the subscription on component unmount

### Problem 3: Row Level Security Blocking Bookmark Operations

**Issue**: Users couldn't insert or view their bookmarks even after authentication.

**Solution**:
- Created proper RLS policies for all CRUD operations (SELECT, INSERT, UPDATE, DELETE)
- Each policy checks that `auth.uid() = user_id` to ensure users can only access their own data
- Enabled RLS on the bookmarks table with `alter table bookmarks enable row level security;`

### Problem 4: TypeScript Type Errors with Supabase Client

**Issue**: TypeScript errors when using Supabase client in client components.

**Solution**:
- Used `createClientComponentClient` from `@supabase/auth-helpers-nextjs` for client components
- Used `createRouteHandlerClient` for API route handlers
- Properly typed the Bookmark interface to match the database schema

### Problem 5: Environment Variables Not Loading in Production

**Issue**: App crashed on Vercel due to missing environment variables.

**Solution**:
- Added all required environment variables in Vercel project settings
- Used `NEXT_PUBLIC_` prefix for client-side environment variables
- Created `.env.local.example` to document required variables
- Added `.env.local` to `.gitignore` to prevent committing secrets

### Problem 6: Auth State Persistence Issues

**Issue**: Users were logged out on page refresh.

**Solution**:
- Used `onAuthStateChange` listener to properly track auth state changes
- Implemented `checkUser()` function on component mount to restore session
- Stored user state in React state with proper initialization

## How It Works

### Authentication Flow

1. User clicks "Sign in with Google"
2. Supabase redirects to Google OAuth consent screen
3. User authorizes the application
4. Google redirects back to `/api/auth/callback` with authorization code
5. Callback handler exchanges code for session
6. User is redirected to home page with active session

### Real-time Synchronization

1. On login, app subscribes to bookmark changes for the current user
2. Any INSERT/UPDATE/DELETE operation on bookmarks table triggers a real-time event
3. Event is filtered by user_id (server-side filtering)
4. Client receives event and updates local state
5. UI updates automatically without page refresh
6. Works across multiple tabs and devices simultaneously

### Data Privacy

- Each bookmark has a `user_id` foreign key linked to the authenticated user
- Row Level Security (RLS) ensures users can only:
  - View their own bookmarks
  - Insert bookmarks with their own user_id
  - Update their own bookmarks
  - Delete their own bookmarks
- Server-side enforcement prevents any data leakage

## Testing

To test the real-time functionality:

1. Open the app in two different browser tabs
2. Sign in with your Google account
3. Add a bookmark in one tab
4. Watch it appear immediately in the other tab without refresh
5. Delete a bookmark in one tab
6. See it disappear from the other tab instantly

## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts       # OAuth callback handler
│   ├── globals.css                # Global styles
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main page with bookmark UI
├── lib/
│   └── supabase.ts                # Supabase client configuration
├── .env.local.example             # Environment variables template
├── .gitignore                     # Git ignore file
├── next.config.js                 # Next.js configuration
├── package.json                   # Dependencies
├── postcss.config.js              # PostCSS configuration
├── README.md                      # This file
├── tailwind.config.js             # Tailwind CSS configuration
└── tsconfig.json                  # TypeScript configuration
```

## Future Enhancements

- Add bookmark folders/categories
- Implement search and filtering
- Add bookmark tags
- Export/import bookmarks
- Share bookmarks with other users
- Browser extension for quick bookmarking
- Bookmark descriptions and notes

## License

MIT

## Contact

For questions or issues, please open an issue on the GitHub repository.
