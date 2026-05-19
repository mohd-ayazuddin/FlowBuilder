# FlowBuilder SaaS - Supabase Setup Guide

This guide will walk you through setting up Supabase for your FlowBuilder SaaS application.

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up or log in
2. Click "New Project"
3. Enter a project name (e.g., "flowbuilder")
4. Set a secure database password
5. Choose the closest region
6. Click "Create new project"
7. Wait for the project to be provisioned (~2 minutes)

## Step 2: Get Your API Keys

1. In your Supabase dashboard, go to **Settings** → **API**
2. You'll find two values:
   - **Project URL**: `https://xxxxx.supabase.co` (the `xxxxx` is your project ref)
   - **anon public key**: A long string starting with `eyJ...`

3. Update your `.env.local` file:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 3: Set Up the Database Schema

1. In your Supabase dashboard, go to **SQL Editor**
2. Click "New Query"
3. Copy and paste the entire contents of `supabase-schema.sql` from this project
4. Click "Run" to execute the SQL

This will create:
- `profiles` table (auto-synced with auth users)
- `flows` table (stores workflow data)
- Row Level Security policies (users can only access their own data)
- Auto-profile-creation trigger
- Auto-updated_at trigger
- Performance indexes

## Step 4: Configure Authentication

1. In your Supabase dashboard, go to **Authentication** → **Providers**
2. Ensure **Email** is enabled (it should be by default)
3. Configure email settings:
   - Enable "Confirm email" if you want email verification (optional)
   - Set your site URL under **URL Configuration**

4. Under **Authentication** → **URL Configuration**:
   - Site URL: `http://localhost:3000` (for development)
   - Redirect URLs: Add `http://localhost:3000/auth/callback`

## Step 5: Test the Setup

1. Start your development server: `npm run dev`
2. Go to `http://localhost:3000/signup`
3. Create an account
4. You should be redirected to the dashboard
5. Verify the profile was created in Supabase (Table Editor → profiles)

## Database Schema Overview

### profiles
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Matches auth.users.id |
| name | TEXT | User's display name |
| email | TEXT | User's email (unique) |
| avatar_url | TEXT | Profile picture URL |
| created_at | TIMESTAMPTZ | Account creation date |
| updated_at | TIMESTAMPTZ | Last profile update |

### flows
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Unique flow identifier |
| user_id | UUID | Owner's profile ID |
| title | TEXT | Flow name |
| description | TEXT | Flow description |
| thumbnail | TEXT | Preview image URL |
| canvas_data | JSONB | Serialized nodes & edges |
| theme | TEXT | Light/dark preference |
| node_count | INTEGER | Number of nodes |
| is_pinned | BOOLEAN | Pinned to top |
| is_favorite | BOOLEAN | Starred/favorited |
| created_at | TIMESTAMPTZ | Flow creation date |
| updated_at | TIMESTAMPTZ | Last edit (auto-updated) |

## Security

- **Row Level Security (RLS)** is enabled on all tables
- Users can only read/write their own data
- The `anon` key is safe to use in client-side code (RLS protects the data)
- Auth middleware protects routes from unauthenticated access
