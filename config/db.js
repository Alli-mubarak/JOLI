
import pg from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const globalForPg = global;

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Step up one level to reach the root directory where pg-ca.pem is located
const pgCaPath = path.join(__dirname, '..', 'pg-ca.pem');

  const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: fs.readFileSync(pgCaPath).toString(),
  },
  max: 1,                 // Tight limit for free tier
  idleTimeoutMillis: 5000,
  connectionTimeoutMillis: 20000, // Fail quickly (20s) instead of hanging indefinitely
};

//database tables setup
const initDb = async (pool) => {
  const setupScript = `
    CREATE EXTENSION IF NOT EXISTS "citext";
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username CITEXT UNIQUE NOT NULL,
        email CITEXT UNIQUE NOT NULL,
        password VARCHAR(255),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        is_private BOOLEAN NOT NULL DEFAULT FALSE,
        is_verified BOOLEAN NOT NULL DEFAULT FALSE,
        google_id VARCHAR(255) UNIQUE,
        google_full_name VARCHAR(255), 
        phone_number VARCHAR(255),
        country VARCHAR(50) NOT NULL,
        bio TEXT,
    profile_picture TEXT,
    cover_photo TEXT,
    website VARCHAR(255),
    location VARCHAR(100),
    date_of_birth DATE,
    gender VARCHAR(20),
    role VARCHAR(20) NOT NULL DEFAULT 'user'
        CHECK (role IN (
            'user',
            'moderator',
            'admin'
        )),
    followers_count INTEGER NOT NULL DEFAULT 0,
    following_count INTEGER NOT NULL DEFAULT 0,
    posts_count INTEGER NOT NULL DEFAULT 0,
        preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
        posts JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        last_login_at TIMESTAMP WITH TIME ZONE,
        CONSTRAINT username_length_check CHECK (char_length(username) >= 3),
        CONSTRAINT email_format_check CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,4}$')
    );

    CREATE TABLE IF NOT exists posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Assumes your users table also uses UUID
    content TEXT,
    media_urls JSONB DEFAULT '[]'::jsonb,
    post_type VARCHAR(20) DEFAULT 'original' NOT NULL,
    parent_id UUID,
    root_id UUID,
    like_count INTEGER DEFAULT 0 NOT NULL,
    repost_count INTEGER DEFAULT 0 NOT NULL,
    reply_count INTEGER DEFAULT 0 NOT NULL,
    view_count BIGINT DEFAULT 0 NOT NULL,
    is_pinned BOOLEAN DEFAULT false NOT NULL,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_parent FOREIGN KEY (parent_id) REFERENCES posts(id) ON DELETE SET NULL,
    CONSTRAINT fk_root FOREIGN KEY (root_id) REFERENCES posts(id) ON DELETE SET NULL,
    CONSTRAINT check_counts_positive CHECK (
        like_count >= 0 AND repost_count >= 0 AND reply_count >= 0 AND view_count >= 0
    )
);
   CREATE TABLE IF NOT exists likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_user_post_like UNIQUE (user_id, post_id)
);
CREATE TABLE IF NOT exists comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
    content TEXT NOT NULL,                                      
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT exists friendships (
    sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'blocked'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevents duplicates like (1, 2) and (1, 2)
    PRIMARY KEY (sender_id, receiver_id),
    
    -- Prevents users from friending themselves
    CONSTRAINT check_not_self CHECK (sender_id <> receiver_id)
);
CREATE TABLE IF NOT exists password_resets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT exists messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
    receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_read BOOLEAN DEFAULT FALSE
);
CREATE TABLE IF NOT exists conversations (
   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL ,
    friend_id UUID REFERENCES users(id) ON DELETE SET NULL,
    last_message TEXT,
    friend_pic TEXT,
    friend_username CITEXT UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Prevents users from having conversations with themselves
    CONSTRAINT check_not_self CHECK (user_id <> friend_id)
);
  `;
  try {
    await pool.query(setupScript);
    console.log('✅ PostgreSQL tables are ready.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
};
    

const pool = globalForPg.pgPool || new pg.Pool(dbConfig);
export {pool, initDb}
if (process.env.NODE_ENV !== 'production') globalForPg.pgPool = pool;
  
