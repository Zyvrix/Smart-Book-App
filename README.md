# Smart Bookmark App

A real-time bookmark manager built with Next.js, Supabase, and Google OAuth. This application allows users to save, organize, and manage their bookmarks with real-time synchronization across multiple tabs and devices.

## Features

- Google OAuth authentication (no email/password)
- Add bookmarks with URL and title
- Private bookmarks 
- Real-time updates across tabs without page refresh
- Delete bookmarks
- Deployed on Vercel with live URL

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Authentication**: Supabase Auth (Google OAuth)
- **Database**: Supabase
- **Real-time**: Supabase Realtime
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

## Live Demo



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

In the Supabase SQL Editor, run this setup.sql file.

#### Configure Google OAuth in Supabase

1. In your Supabase project, go to **Authentication** → **Providers**
2. Enable the **Google** provider
3. Note down the **Callback URL** (Redirect URL) - you'll need this for Google Console

### 3. Set Up Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google+ API**
4. Go to **Credentials** → **Create Credentials** → **OAuth client ID**
5. Configure the OAuth consent screen (User type:External)
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

1. Go to Google Cloud Console → APIs & Services → Credentials
2. Open your OAuth 2.0 Client ID
3. In Authorized redirect URIs, add: https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
4. Save

#### Supabase URL Configuration

1. In Supabase → Authentication → URL Configuration:
Site URL → https://your-app.vercel.app
3.Add your Vercel domain inside Redirect URLs
4. Save

## Problems Encountered and Solutions

### Problem 1: Google OAuth Redirect Loop

**Issue**: After signing in with Google, the app redirected back to the login page instead of staying authenticated..

**Solution**: 
- Implemented /api/auth/callback route.
- Used createServerClient from @supabase/ssr.
- Called supabase.auth.exchangeCodeForSession(code) correctly.
- Ensured redirect URL matched Supabase dashboard configuration

### Problem 2: Real-time Updates Not Working Across Tabs

**Issue**: When adding a bookmark in one tab, it didn't appear in other open tabs without refresh.

**Solution**:
- Enabled Supabase Realtime for the bookmarks table using `alter publication supabase_realtime add table bookmarks;`
- Set up a real-time subscription using `supabase.channel()` with postgres_changes event listener
- Filtered the subscription by user_id to ensure users only receive updates for their own bookmarks
- Properly cleaned up the subscription on component unmount

### Problem 3: When deleting a bookmark, it did not disappear instantly unless the page was refreshed.

**Issue**: The realtime payload for DELETE events requires payload.old, and UI was relying only on database response.

**Solution**:
- Added optimistic UI update (remove from state immediately).
- Added proper handling for payload.old in realtime subscription.
- Added rollback logic in case delete fails.

### Problem 4: Supabase Realtime Subscription Issues

**Issue**: Realtime was not triggering for specific user bookmarks.

**Solution**:
- Added filter inside subscription:
  filter: `user_id=eq.${user.id}`
-This ensured only the logged-in user's data was tracked.

## How It Works

### Authentication Flow

(User → Google → Supabase → Your App)
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



## Project Structure

```
smart-bookmark-app/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── callback/
│   │           └── route.ts      
│   ├── globals.css                
│   ├── layout.tsx                 
│   └── page.tsx                   
├── components/
|   └──bookmarkUI.tsx
├── lib/
│   └── supabase.ts                
├── .env.local.example             
├── .gitignore    
├── eslint.config.mjs                 
├── next.config.js                 
├── package.json                   
├── postcss.config.js              
├── README.md      
├── setup.sql                
├── tailwind.config.js             
└── tsconfig.json                  
```


## License

MIT

## Contact

For questions or issues, please open an issue on the GitHub repository.
