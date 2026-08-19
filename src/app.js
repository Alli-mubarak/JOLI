import express from 'express';
import {pool} from '../config/db.js'; 
import connectPgSimple from 'connect-pg-simple';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import cors from 'cors';
import geoip from "geoip-lite";
import dotenv from 'dotenv';
import path from 'node:path';
import bodyParser from 'body-parser';
import { OAuth2Client } from 'google-auth-library';
import session from 'express-session';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import rateLimit  from 'express-rate-limit';
//import { sendCustomEmail } from '../Utils/mailer.js';
import { v2 as cloudinary } from 'cloudinary';

(async function() {

    
    // Upload an image
     const uploadResult = await cloudinary.uploader
       .upload(
           'https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg', {
               public_id: 'shoes',
           }
       )
       .catch((error) => {
           console.log(error);
       });
    
    console.log(uploadResult);
    
    // Optimize delivery by resizing and applying auto-format and auto-quality
    const optimizeUrl = cloudinary.url('shoes', {
        fetch_format: 'auto',
        quality: 'auto'
    });
    
    console.log(optimizeUrl);
    
    // Transform the image: auto-crop to square aspect_ratio
    const autoCropUrl = cloudinary.url('shoes', {
        crop: 'auto',
        gravity: 'auto',
        width: 500,
        height: 500,
    });
    
    console.log(autoCropUrl);    
})();

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// Middleware (e.g., JSON parsing)
app.use(express.json());
app.set('trust proxy', 1); // Triggers Express to trust the HTTPS headers from your host

app.use(express.static('icon'));
const __dirname = import.meta.dirname;
const __filename = fileURLToPath(import.meta.url);

// Initialize the built-in JavaScript internationalization display names utility
const countryNamesInEnglish = new Intl.DisplayNames(['en'], { type: 'region' });
//function for getting country from ip
function getCountryNameFromReq(req) {
  // Extract client IP address from request header
  const clientIp = req.headers['x-forwarded-for']
  // Lookup geolocation data using geoip-lite
  const geo = geoip.lookup(clientIp);
  let countryName = 'Unknown';
  if (geo && geo.country) {
    try {
      // Convert the 2-letter code (e.g., 'US') to full name (e.g., 'United States')
      countryName = countryNamesInEnglish.of(geo.country);
    } catch (error) {
      // Fallback to the country code if the lookup fails for any reason
      countryName = geo.country;
    }
    return countryName;
  }
}

//database tables setup
const initDb = async () => {
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
  `;
  try {
    await pool.query(setupScript);
    console.log('✅ PostgreSQL Users table is ready.');
  } catch (err) {
    console.error('❌ Database initialization failed:', err.message);
  }
};

app.use(cors({
  origin: 'https://joli-indol.vercel.app/', 
  credentials: true // Crucial: Allows the browser to send cookies back and forth
}));

//configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.'
});

// apply limiter to routes starting with /api/auth/
//app.use('/api/auth/', limiter);

// Configure and use the session middleware
const PostgresStore = connectPgSimple(session);

// session middleware (Saves sessions directly to Aiven Postgres)
app.use(session({
  store: new PostgresStore({ pool: pool, tableName: 'session',createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, 
    secure: true
  }
}));
  
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//middleware - logs the method, path, ip address and time to the console
app.use(function middleware(req,res,next){
let d = new Date();
const countryName = getCountryNameFromReq(req);
let currentTime = d.toLocaleString();
console.log(req.method, req.path, req.hostname, req.ip, countryName, currentTime,);
  
// console.log('--- Session Debug ---');
//  console.log('Incoming Cookie:', req.headers.cookie);
//   console.log('Session ID:', req.sessionID);
//  console.log('Session Data in memory:', req.session);
//  console.log('Is Authenticated?:', req.isAuthenticated ? req.isAuthenticated() : 'No passport');
//  console.log('User object:', req.user);
next();
});

// cloudinary configuration
    cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET 
    });

// Configure Passport Google Strategy
// updated Passport Google Strategy with Async/Await Database Logic
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    state: true,
    passReqToCallback: true  // this will make the req object available for access
  
  },
  async (req, accessToken, refreshToken, profile, done) => {
    const countryName = getCountryNameFromReq(req);
  try {
    // Structure the data coming from Google profile payload
    const google_id = profile.id;
    const result = await pool.query(
    "SELECT * FROM users WHERE google_id = $1",
    [google_id]
  );

   let user = result.rows[0];
    if (user) {
    return done(null, user);
    }
    const email = profile.emails[0].value;

   const existing = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
   );
    if (existing.rows.length > 0) {

    user = existing.rows[0];

    await pool.query(
        `
        UPDATE users
        SET
            google_id = $1,
            google_full_name = $2,
            profile_picture = $3,
            last_login_at = CURRENT_TIMESTAMP
        WHERE id = $4
        `,
        [
            profile.id,
            profile.displayName,
            profile.photos?.[0]?.value || null,
            user.id
        ]
    );

    return done(null, user);
    }
    const username =
    profile.displayName
        .toLowerCase()
        .replace(/\s+/g, "") +
    Math.floor(Math.random() * 10000);
    const preferences = { theme: 'light', notifications: true, language: 'en-US' };
    const country = countryName;

const newUser = await pool.query(
`
INSERT INTO users
(
    username,
    email,
    password,
    google_id,
    google_full_name,
    profile_picture,
    preferences,
    country,
    last_login_at
)

VALUES
(
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    $7,
    $8,
    CURRENT_TIMESTAMP
)

RETURNING *;
`,
[
    username,
    profile.emails[0].value,
    null,
    profile.id,
    profile.displayName,
    profile.photos?.[0]?.value || null,
    preferences,
    country
]);
    return done(null, newUser.rows[0]);
    
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
));

// Add the Local Strategy for Email/Password
passport.use(new LocalStrategy(
  {
       usernameField: 'identifier', 
      passwordField: 'password'
            },
            async (identifier, password, done) => {
                try {
                    // Search PostgreSQL for a matching email OR username
                    const result = await pool.query(
                        'SELECT * FROM users WHERE email = $1 OR username = $1',
                        [identifier.toLowerCase().trim()]
                    );

                    if (result.rows.length === 0) {
                        return done(null, false, { message: 'Invalid credentials.' });
                    }

                    const user = result.rows[0];

                    // Check if they only signed up via Google and don't have a password
                    if (!user.password) {
                        return done(null, false, { message: 'Please sign in using Google.' });
                    }

                    // Compare hashes
                    const isMatch = await bcrypt.compare(password, user.password);
                    if (!isMatch) {
                        return done(null, false, { message: 'Invalid credentials.' });
                    }

                    // Success! Pass the user object to Passport
                    return done(null, user);

        } catch (err) {
            return done(err);
        }
    }
));

// Serialize and Deserialize User Session Data
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// 2. Take the ID from the session and look up the full user object
passport.deserializeUser(async (id, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = result.rows[0];
    
    done(null, user); // This attaches the user object to req.user
  } catch (err) {
    done(err, null);
  }
});

// --- Auth Routes ---

//sign up API
app.post('/api/auth/sign-up', limiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
   if (username.length < 5) {
      return res.status(400).json({ message: 'Username is too short!' });
    }
    

    // Check if email is taken
    const emails = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email]
  );
    let existingEmail;
    if (emails){
   existingEmail = emails.rows[0];
    }
    
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists' });
    }

    // Check if username is taken
    const usernames = await pool.query(
    "SELECT * FROM users WHERE username = $1",
    [username]
  );
    let existingUsername;
    if (usernames){
   existingUsername = usernames.rows[0];
    }
    
    if (existingUsername) {
      return res.status(400).json({ message: 'Username is taken, choose another one!' });
    }
    const countryName = getCountryNameFromReq(req);
  
// Hash password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const country = countryName;
    const preferences = { theme: 'light', notifications: true, language: 'en-US' };

    const newUser = await pool.query(
`
INSERT INTO users
(
    username,
    email,
    password,
    profile_picture,
    preferences,
    country,
    last_login_at
)

VALUES
(
    $1,
    $2,
    $3,
    $4,
    $5,
    $6,
    CURRENT_TIMESTAMP
)

RETURNING *;
`,
[
    username.toLowerCase(),
    email.toLowerCase(),
    hashedPassword,
    null,
    preferences,
    country
]);
    
    // Log the user in automatically
    // Convert the new user document to a plain JavaScript object
  const userObj = newUser.rows[0];
        req.login(userObj, (err) => {
            if (err) {
                return next(err); // Handles passport login errors
            }
            // Success! The session is created!
            res.status(201).json({ message: 'Registration successful!' });
        });
   
  } catch (err) {
    console.log(err+ ', ' + err.message);
    res.status(500).json({ error: err.message });
  }
});

//  Email or Username Login
app.post('/api/auth/login', limiter, (req, res, next) => {
  // 1. Extract values to validate that the frontend sent the required data
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ message: 'Email/Username and password are required.' });
  }

  // Invoke Passport's Local Strategy
  // "info" contains the custom error messages we wrote inside the strategy
  passport.authenticate('local', (err, user, info) => {
    
    //  A critical server or database error occurred
    if (err) {
      console.error('Passport Auth Error:', err);
      return next(err); 
    }

    //  Authentication failed (wrong password, account doesn't exist, etc.)
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Invalid credentials!.' });
    }

    //  Credentials are correct! Establish the user session
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Session creation failed:', loginErr);
        return next(loginErr);
      }

      return res.status(200).json({
        message: 'Logged in successfully.',
       user: { id: user.id, username: user.username, email: user.email }
    });
    });
  })(req, res, next); // Necessary to pass the request and response objects to Passport
});

// Trigger Google Sign-Up / Login Flow
app.get('/api/auth/google', limiter,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

//  Google OAuth Callback Route
app.get('/auth/google/callback', limiter, (req, res, next) => {
  passport.authenticate('google', (err, user, info) => {
    // Catch the TokenError / Bad Request gracefully
    if (err) {
      if (err.name === 'TokenError') {
        console.log('Caught PWA Double-Exchange TokenError. Redirecting to app check.');
        // If the cookie was already written successfully on the first trigger, 
        // redirecting them straight to the dashboard will show them logged in.
        return res.redirect('/');
      }
      return next(err);
    }
    
    if (!user) {
      return res.redirect('/');
    }

    req.logIn(user, (loginErr) => {
      if (loginErr) return next(loginErr);
      return res.redirect('/home');
    });
  })(req, res, next);
});



app.post('/api/create-post', async (req, res) => {
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: 'You need to log in first!'});
  }
  const { content, media_urls, post_type, parent_id, root_id } = req.body;
  const user_id = req.user.id;

  // 1. Validation: Post must have text or media
  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }
  if (!content && (!media_urls || media_urls.length === 0)) {
    return res.status(400).json({ error: 'Post must contain text content or media' });
  }

  try {
    // 2. Safely insert post using parameterized queries ($1, $2, etc.)
    const queryText = `
      INSERT INTO posts (user_id, content, media_urls, post_type, parent_id, root_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    // Convert media_urls array to a valid JSON string for our JSONB column
    const mediaJson = media_urls ? JSON.stringify(media_urls) : '[]';

    const values = [
      user_id,
      content || null,
      mediaJson,
      post_type || 'original',
      parent_id || null,
      root_id || null
    ];

    const result = await pool.query(queryText, values);

    // 3. Optional step: If it's a reply, increment parent's reply counter
    if (post_type === 'reply' && parent_id) {
      await pool.query(
        'UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1',
        [parent_id]
      );
    }

    // 4. Return the newly created post
    return res.status(201).json(result.rows[0]);

  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


//default page  route
app.get('/',(req, res)=>{
console.log(req.query)
console.log('default path requested! \n');
  if (req.isAuthenticated() && req.user){
   return  res.redirect('/home');
  }
  res.sendFile(path.join(__dirname, "../", "/views/index.html"));
});

//homepage route
app.get('/home',(req, res)=>{
console.log('home page  requested! \n');
  
  res.sendFile(path.join(__dirname, "../", "/views/feeds.html"));
});

//followers page route
app.get('/followers',(req, res)=>{
console.log('followers page  requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/friends.html"));
});

//Add post page route
app.get('/create-post',(req, res)=>{
console.log('add post page  requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/addpost.html"));
});

//cropper test page
app.get('/test-cropper',(req, res)=>{
console.log('image cropper page  requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/cropper.html"));
});

//messages page route
app.get('/messages',(req, res)=>{
console.log('messages page  requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/messages.html"));
});

//search page route
app.get('/search',(req, res)=>{
console.log('add post page  requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/search.html"));
});

//admin page route
app.get('/admin/dashboard',(req, res)=>{
console.log('admin page  requested! \n');
  if (!req.user){
  return  res.redirect('/');
 }
  if(req.user.role !== 'admin'){
    return res.redirect('/home');
  }
  res.sendFile(path.join(__dirname, "../", "/views/admin.html"));
});

//user check route
app.get('/api/auth/user',  (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false, user: null });
  }
});

app.get('/login-failed', (req, res) => {
  res.send('Authentication failed. Please try again.');
});

// Logout Route
app.get('/api/auth/logout', limiter, (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    
    // Destroy the session in Database 
    req.session.destroy((err) => {
      if (err) return res.send('Error logging out');
      
      // Clear the cookie on the client side
      res.clearCookie('connect.sid');
      res.redirect('/');
    });
  });
});

//user details download route
//app.get('/user/:id/download-txt', async (req, res) => {
app.get('/user/download-txt', async (req, res) => {
  if(!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  if(!req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  
  const userId = req.user.id
  try {
    // Fetch user data from MongoDB
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    //Format the user information nicely for the .txt file
    const userEntries = user.entries.map(e => ({entryId:  e._id, content:  e.description, created:  e.createdAt.toLocaleString(), lastUpdated:  e.updatedAt.toLocaleString()}))
    const formattedEntries = user.entries && user.entries.length > 0
      ? userEntries.map((item, index) => {
          return `  ${index + 1}. [
         entryId : ${item.entryId},
         content: ${item.content},
         created : ${item.created},
         last updated: ${item.lastUpdated}
        ]`;
        }).join('\n')
      : '  No entries found.';
    const country = user.country || 'unknown';
    const fileContent = [
      `User Profile Report`,
      `===================`,
      `ID:         ${user._id}`,
      `Name:       ${user.displayName}`,
      `Email:      ${user.email}`,
      `Country:    ${country}`,
      `Entries:    ${user.entries.length} entries`,
       `${formattedEntries}`,
      `Role:       ${user.role}`,
      `Joined On:  ${new Date(user.createdAt).toLocaleString()}`,
      `===================`,
      `Generated on: ${new Date().toLocaleString()}`
    ].join('\n'); // Separates lines correctly for text files

    //Set headers to force download and define the file extension
    res.attachment(`${user.displayName.replace(/\s+/g, '_')}_profile.txt`);
    res.type('text/plain');

    // Send the text content out directly
    return res.send(fileContent);

  } catch (error) {
    console.error('Error exporting user data:', error);
    
    // Pro Tip: Make sure headers weren't already sent before replying with an error
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Failed to generate user file.' });
    }
  }
});

//fetch all users at once
app.get('/api/users/summary-optimized', async (req, res) => {
  if(!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  try {
    // Runs both database actions at the exact same time
    const [totalCount, usersList] = await Promise.all([
      User.countDocuments({}), // Fast internal database counter
      User.find({}).select('email entries -_id country') // Fetches emails
    ]);

    return res.status(200).json({
      success: true,
      totalUsers: totalCount,
      users: usersList.map(u => ({id:u._id, createdAt:u.createdAt, email: u.email, country: u.country || 'unknown', entries: u.entries.length}))
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
});
    //temporary api
app.get('/api/alter-table/kshhyruurj', async (req, res) =>{
      try{
      //  await pool.query(`
        //    TRUNCATE TABLE session
      //  `);

        res.json({
            success: true,
            message: "Updated successfully."
        });

    } catch (err) {
        console.error(err);

        res.status(500).json({
            success: false,
            error: err.message
        });
    }
});

//fetch all users
app.get('/api/get-all-users', limiter, async(req, res) => {
  try{
    if(!req.user || req.user.role !== "admin"){
      return res.json({
        error: "You are not authorised to do this"
    })
    }
   const users = await pool.query(
        "SELECT * FROM users"
   );
      res.json({
      totalUsers : users.rows.length,
      users: users.rows 
      });
  }
    
  catch(e){
    res.json({
      error: e,
      errorMessage: e.message
    })
  }

});

//api for uploading pictures 
app.post('/upload/profile-picture', limiter, async(req,res) =>{
  if(!req.isAuthenticated() || !req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  
  try{
    const {picture} = req.body
  }
  catch(error){
    console.error(error)
   res.json({
     error: error
   })
  }
});

// user role change api
app.get('/api/change-role/user/:id/:newRole', limiter, async(req,res) => {
  const {newRole, id} = req.params;
 try{
   if(!newRole && !id){
   return res.json({
      error: 'role or id is missing'
    });
   }
   const getUser = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
   const user = getUser.rows[0];
  const roles = ["user","moderator","admin"];
  if(!user){
   return res.status(400).json({
      error: 'user not found!'
    });
  }
   if(!roles.includes(newRole)){
    return res.json({
      error: 'role does not exist!'
    });
   }
   if(user.role === newRole){
    return res.json({
      error: 'user already has the role!'
    });
   }
   if(!req.user){
    return res.json({
      error: 'You need to log in first!'
    });
   }
   const initiatorRole = req.user.role
   if(initiatorRole !== roles[2]){
    return res.json({
     error: 'You are not authorised to do this!'
    });
  }
   
       await pool.query(
        `
        UPDATE users
        SET role = $1
         WHERE id = $2
        `,
        [
            newRole,
            id
        ]
    );
   res.json({
     message: `user role changed to ${newRole}`,
     userId: id
   })
  }
  catch(error){
    res.json({
      error: error,
      errorMessage: error.message
    })
  }
})
    

//response to all wrong paths
app.use((req, res)=>{
console.log('wrong path invoked \n');
  res.sendFile(path.join(__dirname, "../", "/views/error.html"));
});

// database pinger to prevent powering off
async function pingAivenDatabase() {
  try {
    // Reuses an idle connection from existing pool
    await pool.query('SELECT 1;');
    console.log(`[${new Date().toISOString()}] Aiven DB pool keep-alive successful.`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Aiven DB pool keep-alive failed:`, error.message);
  }
}
// ½ hour in milliseconds (30 mins * 60 secs * 1000 ms)
const HALF_HOUR = 30 * 60 * 1000;

//start server
async function startServer(){
  try{
  console.log('🔄 Connecting to Aiven PostgreSQL...');
    const result = await pool.query('SELECT NOW()');
    
    console.log('✅ Database connected successfully!');
    console.log(`🕒 Aiven Server Time: ${result.rows[0].now}`);

    // 2. Start the server
                 
 const listener = app.listen(process.env.PORT,()=>{
  console.log("app is listening on port ", listener.address().port,'\n');
});
    await initDb();
    pingAivenDatabase();
    setInterval(pingAivenDatabase, HALF_HOUR);
  }catch (err){
    console.error('❌ Database connection failed! Server shutting down...');
    console.error(err.message);
    process.exit(1); 
  }
}
startServer(); 
