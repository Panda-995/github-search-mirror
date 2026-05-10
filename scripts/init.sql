CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DO $$
BEGIN
  CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  github_id varchar(255) UNIQUE,
  github_token text,
  password_hash text,
  email varchar(255) UNIQUE,
  name varchar(255),
  avatar text,
  role user_role DEFAULT 'USER',
  ai_config jsonb,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  is_public boolean DEFAULT false,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_full_name varchar(255) NOT NULL,
  repo_meta jsonb,
  note text,
  collection_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS search_history (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  query text NOT NULL,
  filters jsonb,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS filter_presets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar(255) NOT NULL,
  filters jsonb NOT NULL,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_full_name varchar(255) NOT NULL,
  content text NOT NULL,
  rating integer,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hot_searches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  keyword varchar(255) NOT NULL UNIQUE,
  count integer DEFAULT 1,
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS pinned_repos (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  repo_full_name varchar(255) NOT NULL UNIQUE,
  reason text,
  position integer DEFAULT 0,
  type varchar(50) DEFAULT 'trending',
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collections_user_id_idx ON collections(user_id);
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_collection_id_idx ON favorites(collection_id);
CREATE INDEX IF NOT EXISTS search_history_user_id_idx ON search_history(user_id);
CREATE INDEX IF NOT EXISTS comments_repo_full_name_idx ON comments(repo_full_name);
