# Voice Todo Setup Guide

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be ready (~2 minutes)

## 2. Set Up Database

1. Go to **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase-schema.sql` and run it
3. This creates the `items` table with sample data

## 3. Configure Environment Variables

Create a file called `.env.local` in the project root with:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

Find these values in Supabase:
- Go to **Project Settings** → **API**
- Copy the **Project URL** and **anon public** key

## 4. Enable Realtime

1. Go to **Database** → **Replication**
2. Enable replication for the `items` table

## 5. Run the App

```bash
npm run dev
```

Visit http://localhost:3000

