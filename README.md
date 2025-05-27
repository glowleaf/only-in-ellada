# Only in Ellada 🇬🇷

A community platform for sharing frustrating and absurd experiences unique to Greece. Built with Next.js 14, TypeScript, Tailwind CSS, and Supabase.

## Features

- 🔐 **Authentication** - Google, GitHub, and email sign-in via Supabase Auth
- 📝 **Story Sharing** - Create and share your Greece experiences
- 🗳️ **Voting System** - Upvote/downvote stories Reddit-style
- 💬 **Comments** - Nested comment system (coming soon)
- 🏷️ **Categories** - Filter by Bureaucracy, Transport, Service, Culture, etc.
- 📱 **Responsive Design** - Mobile-first design with Tailwind CSS
- ⚡ **Real-time Updates** - Live voting and comments via Supabase

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Authentication**: Supabase Auth with OAuth providers
- **Styling**: Tailwind CSS with custom components
- **Deployment**: Vercel (recommended)

## Quick Start

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd only-in-ellada
npm install
\`\`\`

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Copy \`.env.example\` to \`.env.local\` and fill in your Supabase credentials:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Set up Database Schema

Run this SQL in your Supabase SQL Editor:

\`\`\`sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#1565c0',
  emoji VARCHAR(10)
);

-- Stories table
CREATE TABLE stories (
  id SERIAL PRIMARY KEY,
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  category_id INTEGER REFERENCES categories(id),
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Comments table
CREATE TABLE comments (
  id SERIAL PRIMARY KEY,
  content TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Votes table
CREATE TABLE votes (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  story_id INTEGER REFERENCES stories(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, story_id)
);

-- Insert sample categories
INSERT INTO categories (name, slug, color, emoji) VALUES
('Bureaucracy', 'bureaucracy', '#c62828', '🏛️'),
('Transport', 'transport', '#2e7d32', '🚌'),
('Service', 'service', '#7b1fa2', '🍽️'),
('Culture', 'culture', '#ef6c00', '🎭'),
('Healthcare', 'healthcare', '#1565c0', '🏥'),
('Banking', 'banking', '#5d4037', '🏦'),
('Tourism', 'tourism', '#00695c', '🏝️');

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Stories policies
CREATE POLICY "Anyone can view stories" ON stories FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create stories" ON stories FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own stories" ON stories FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own stories" ON stories FOR DELETE USING (auth.uid() = user_id);

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON comments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Votes policies
CREATE POLICY "Anyone can view votes" ON votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can vote" ON votes FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can update own votes" ON votes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON votes FOR DELETE USING (auth.uid() = user_id);

-- Categories are public read-only
CREATE POLICY "Anyone can view categories" ON categories FOR SELECT USING (true);

-- Function to handle user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create user profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update story vote counts
CREATE OR REPLACE FUNCTION update_story_votes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.vote_type = 'up' THEN
      UPDATE stories SET upvotes = upvotes + 1 WHERE id = NEW.story_id;
    ELSE
      UPDATE stories SET downvotes = downvotes + 1 WHERE id = NEW.story_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.vote_type = 'up' THEN
      UPDATE stories SET upvotes = GREATEST(0, upvotes - 1) WHERE id = OLD.story_id;
    ELSE
      UPDATE stories SET downvotes = GREATEST(0, downvotes - 1) WHERE id = OLD.story_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle vote type change
    IF OLD.vote_type = 'up' AND NEW.vote_type = 'down' THEN
      UPDATE stories SET upvotes = GREATEST(0, upvotes - 1), downvotes = downvotes + 1 WHERE id = NEW.story_id;
    ELSIF OLD.vote_type = 'down' AND NEW.vote_type = 'up' THEN
      UPDATE stories SET downvotes = GREATEST(0, downvotes - 1), upvotes = upvotes + 1 WHERE id = NEW.story_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically update vote counts
CREATE TRIGGER votes_update_story_counts
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW EXECUTE FUNCTION update_story_votes();
\`\`\`

### 4. Configure Authentication

In your Supabase dashboard:

1. Go to Authentication > Settings
2. Add your site URL: \`http://localhost:3000\`
3. Add redirect URLs: \`http://localhost:3000/auth/callback\`
4. Enable the providers you want (Google, GitHub, etc.)
5. Configure OAuth provider credentials

### 5. Run the Development Server

\`\`\`bash
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Project Structure

\`\`\`
src/
├── app/
│   ├── auth/callback/          # Auth callback route
│   ├── stories/[id]/          # Individual story pages
│   ├── globals.css            # Global styles
│   ├── layout.tsx             # Root layout
│   └── page.tsx               # Homepage
├── components/
│   ├── AuthProvider.tsx       # Auth context provider
│   ├── AuthModal.tsx          # Sign in/up modal
│   ├── Header.tsx             # Navigation header
│   ├── StoryCard.tsx          # Story display component
│   ├── VoteButtons.tsx        # Voting interface
│   └── CreateStoryModal.tsx   # Story creation form
├── lib/
│   └── supabase.ts            # Supabase client config
└── types/
    └── database.ts            # TypeScript types
\`\`\`

## Sample Data

The schema includes sample categories. You can add sample stories manually or create them through the UI.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Add environment variables in Vercel dashboard
4. Update Supabase auth settings with your production URL

### Environment Variables for Production

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=https://your-domain.com
\`\`\`

## Features Roadmap

- [ ] Individual story pages with comments
- [ ] User profiles and karma system
- [ ] Search functionality
- [ ] Email notifications
- [ ] Moderation tools
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Greek/English)
- [ ] RSS feeds
- [ ] Social media sharing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the Supabase documentation
- Review the Next.js documentation
