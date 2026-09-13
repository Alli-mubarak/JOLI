import express from 'express';
import {pool, initDb} from '../config/db.js'; 
import mailRoutes from './router/mailer.js'; 
import authRoutes from './router/auth.js'; 
//import postRoutes from './router/posts.js'; 
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
import transporter from '../Utils/mailer.js';
import { v2 as cloudinary } from 'cloudinary';
import 'ejs';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json({limit: '10mb'}))

// Middleware (e.g., JSON parsing)
app.use(express.json({ limit: '10mb' })),
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

//session checker
const checkSession = (req, res, next) => {
  try{
    if (req.session) {
        next(); 
    } else {
        console.error("Unauthorized usage");
        res.status(401).json({ error: 'You must be logged in to do this' });
       
    }
  }catch(e){
    console.error(e);
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


// Configure and use the session middleware
const PostgresStore = connectPgSimple(session);

// session middleware (Saves sessions directly to Aiven Postgres)
app.use(session({
  store: new PostgresStore({ pool: pool, tableName: 'session',createTableIfMissing: true }),
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: { 
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, 
    secure: true
  }
}));

app.set('views', path.join(process.cwd(), 'dviews'))
app.set('view engine', 'ejs');
  
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
            is_verified = $4
            last_login_at = CURRENT_TIMESTAMP
        WHERE id = $5
        `,
        [
            profile.id,
            profile.displayName,
            profile.photos?.[0]?.value || null,
            true,
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
    is_verified,
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
    $9
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
    true,
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

//**********Helper functions *****""""""

//function for fetching post author details 
async function fetchAuthorDetails(authorId){
  try{
      const user = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [authorId]
  );
    const author = user.rows[0];
    const authorDetails = {
      profile_pic: author.profile_picture,
      username : author.username,
      is_active: author.is_active,
      is_verified: author.is_verified
    }
    return authorDetails;
  }catch(e){
    return console.error(e);
  }
}

//***"""""""""""
app.use('/api/m', mailRoutes);
app.use('/api/auth', authRoutes);
//app.use('/post', postRoutes);
//***********
// function for detecting post like
async function getPostLikeStatus(postId, userId){
  try{
    const result = await pool.query(
      "SELECT * FROM likes WHERE post_id = $1 AND user_id = $2", [postId, userId]
    );
    if(result.rows.length > 0){
      return true
    }else{
      return false
    }
  }
  catch(e){
    return console.error(e);
  }
}

//function for linkifying text
async function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

// --- Auth Routes ---

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


// post creation api
app.post('/api/create-post', checkSession, async (req, res) => {
  try{
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: 'You need to log in first!'});
  }
  
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: 'user id is required' });
  }
  const { content, images, postType } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Post must contain text content ' });
  }
  
  let mediaURLs;
  if(images){
    let imagesSize = 0;
    
  images.forEach(file =>{
    imagesSize += file.length
  });
  const imagesSizeInMb = (imagesSize / 1024 / 1024).toFixed(2);
    
  if(imagesSizeInMb > 10){
  return res.status(400).json({error: "images are too much or too large, crop them and retry or use different images"});
  }
  const uploadPromises = images.map((base64String) => {
    
      return cloudinary.uploader.upload(base64String, {
        folder: `postPictures/${userId}`,
        resource_type: 'image' // Cloudinary auto-detects the jpeg metadata inside the string
      });
    });
    
 const uploadResults = await Promise.all(uploadPromises);
    console.log(uploadResults);
    const urls = uploadResults.map(result => {
     return  cloudinary.url(result.public_id, {
      fetch_format: 'auto',       // f_auto: Serves WebP to Chrome, AVIF to iOS automatically
      quality: 'auto',            // q_auto: Compresses file size without losing visual quality
      width: 500,                 // c_limit,w_600: Resizes down if the user's canvas crop 
      crop: 'limit',              // was massive, saving your free tier bandwidth
      secure: true
    });
    
    });
    const optimizedUrls = await Promise.all(urls);
    console.log(optimizedUrls);
    mediaURLs =  JSON.stringify(optimizedUrls);
  }else{
    mediaURLs =  [];
  }
    
const queryText = `
  INSERT INTO posts (user_id, content, media_urls, post_type)
  VALUES ($1, $2, $3, $4)
  RETURNING *;
`;
    const values = [userId, content.trim(), mediaURLs, postType];
    

    const result = await pool.query(queryText, values);

    if (postType === 'reply' && parent_id) {
      await pool.query(
        'UPDATE posts SET reply_count = reply_count + 1 WHERE id = $1',
        [parent_id]
      );
    }
    const newPost = result.rows[0];
    console.log('Post successfully created!');
    console.log(newPost);
    return res.status(201).json(newPost);

  } catch (error) {
    console.error('Error creating post:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


//post liking api
app.post('/api/posts/:postId/like', checkSession,  async (req, res) => {
  try {
    const { postId } = req.params;
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    
    const userId = req.user.id

    if (!userId || !postId) {
        return res.status(400).json({ error: 'Missing userId or postId' });
    }
    const toggleWithStatusQuery = `
        WITH deleted AS (
            DELETE FROM likes 
            WHERE user_id = $1 AND post_id = $2
            RETURNING *
        ),
        inserted AS (
            INSERT INTO likes (user_id, post_id)
            SELECT $1, $2
            WHERE NOT EXISTS (SELECT 1 FROM deleted)
            RETURNING *
        )
        UPDATE posts
        SET like_count = like_count + (
            CASE 
                WHEN EXISTS (SELECT 1 FROM inserted) THEN 1
                ELSE -1
            END
        )
        WHERE id = $2
        RETURNING 
            like_count,
            CASE 
                WHEN EXISTS (SELECT 1 FROM inserted) THEN 'inserted'
                ELSE 'deleted'
            END AS action;
    `;

    
        const result = await pool.query(toggleWithStatusQuery, [userId, postId]);

        // Guard rails if the post ID doesn't exist in the system
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Post not found' });
        }

        // Destructure values from database response row
        const { like_count, action } = result.rows[0];

        // Send payload structure back to frontend
        return res.status(200).json({ 
            success: true, 
            action: action,          // Sends 'inserted' or 'deleted'
            likesCount: like_count  // Sends absolute truth number
        });

    } catch (error) {
        console.error('Error toggling like:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

//friendships api 
//api for friend request 
app.post('/api/friendship/request', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const senderId = req.user.id; 
    const { receiverId } = req.body;
    
    if (!receiverId) {
        return res.status(400).json({ error: 'Missing receiver id' });
    }
    
    //  Validation: Cannot friend yourself
    if (senderId === parseInt(receiverId)) {
        return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }
    const checkReceiver = await pool.query("SELECT * FROM users WHERE id = $1", [receiverId]);
    if (checkReceiver.rows.length === 0) {
            return res.status(403).json({ 
                error: 'Receiver not found.' 
            });
    }
    
        const query = `
            INSERT INTO friendships (sender_id, receiver_id, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) 
            DO NOTHING
            RETURNING status;
        `;

        const result = await pool.query(query, [senderId, receiverId]);

        // Handle Conflicts (If the row already exists)
        if (result.rows.length === 0) {
            // Check why it failed to find out if it's already pending, accepted, or blocked
            const checkQuery = `
                SELECT sender_id, receiver_id, status 
                FROM friendships 
                WHERE (sender_id = $1 AND receiver_id = $2) 
                   OR (sender_id = $2 AND receiver_id = $1);
            `;
            const checkResult = await pool.query(checkQuery, [senderId, receiverId]);
            const existing = checkResult.rows[0];

            if (existing.status === 'accepted') {
                return res.status(409).json({ error: "You are already friends with this user." });
            }
            if (existing.status === 'pending') {
                if (existing.sender_id === senderId) {
                    return res.status(409).json({ error: "Friend request is already pending." });
                } else {
                    return res.status(400).json({ 
                        error: "This user has already sent you a request. Accept it instead." 
                    });
                }
            }
            if (existing.status === 'blocked') {
                return res.status(403).json({ error: "Action not allowed." });
            }
        }

        // Success Response
        return res.status(201).json({ 
            message: "Friend request sent successfully.", 
            status: "pending" 
        });

    } catch (error) {
        console.error("Friend request error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for friendship acceptance 
app.post('/api/friendship/accept', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const receiverId = req.user.id; // The authenticated user accepting the request
    const { senderId } = req.body;  // The user who originally sent the request
    
    if (!senderId) {
        return res.status(400).json({ error: 'Missing sender id' });
    }
    

        // Update the status to 'accepted' ONLY if it is currently 'pending'
        // and the current user is truly the receiver of that specific request.
        const query = `
            UPDATE friendships
            SET status = 'accepted',
                updated_at = CURRENT_TIMESTAMP
            WHERE sender_id = $1 
              AND receiver_id = $2 
              AND status = 'pending'
            RETURNING *;
        `;

        const result = await pool.query(query, [senderId, receiverId]);

        // If no rows were updated, either the request doesn't exist,
        // it's already accepted/blocked, or the roles are reversed.
        if (result.rows.length === 0) {
            // Verify why the update failed to give clean feedback
            const checkQuery = `
                SELECT sender_id, receiver_id, status 
                FROM friendships 
                WHERE (sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1);
            `;
            const checkResult = await pool.query(checkQuery, [senderId, receiverId]);

            if (checkResult.rows.length === 0) {
                return res.status(444).json({ error: "Friend request not found." });
            }

            const record = checkResult.rows[0];

            if (record.status === 'accepted') {
                return res.status(409).json({ error: "You are already friends." });
            }
            if (record.status === 'blocked') {
                return res.status(403).json({ error: "Action not allowed." });
            }
            if (record.status === 'pending' && record.sender_id === receiverId) {
                return res.status(400).json({ 
                    error: "You cannot accept a request you sent. Wait for them to accept." 
                });
            }
        }

        // Success Response
        return res.status(200).json({
            message: "Friend request accepted successfully.",
            friendship: result.rows[0]
        });

    } catch (error) {
        console.error("Accept friend request error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for getting user's friendship list
app.get('/user/friends', checkSession,  async (req, res) => {
  try {
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
  }

    const userId = req.user.id;
    const query = "SELECT * FROM friendships WHERE (sender_id = $1 OR receiver_id = $1)"

    const result = await pool.query(query, [userId]);

     return res.status(200).json({
            friendships: result.rows
        });

    } catch (error) {
        console.error("Fetch friendship list error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});


//user role change api
app.get('/api/change-role/user/:id/:newRole', checkSession, limiter, async(req,res) => {
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
});

//***********///
//default page  route
app.get('/',(req, res)=>{
console.log('default path requested! \n');
  if (req.isAuthenticated() && req.user){
   return  res.redirect('/home');
  }
  res.sendFile(path.join(__dirname, "../", "/views/index.html"));
});

//robots.txt configuration 
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send(
        `User-agent: *\n` +
        `Allow: /profile/\n` +
        `Allow: /post/\n` +
        `Disallow: /api/\n` +
        `Disallow: /settings/\n` +
        `Sitemap: https://joli-indol.vercel.app`
    );
});

//homepage route
app.get('/home',(req, res)=>{
console.log('home page  requested! \n');
  
  res.sendFile(path.join(__dirname, "../", "/views/feeds.html"));
});

//followers page route
app.get('/friends',(req, res)=>{
console.log('followers page requested! \n');
 // if (req.isAuthenticated()){
 //  return  res.redirect('/');
//  }
  res.sendFile(path.join(__dirname, "../", "/views/friends.html"));
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

app.get('/login-failed', (req, res) => {
  res.send('Authentication failed. Please try again.');
});

//user details download route
app.get('/user/download-txt', checkSession, async (req, res) => {
  if(!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  if(!req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  
  const userId = req.user.id
  try {
    // Fetch user data from AIVEN DV
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    if (result.rows.length < 1) {
      return res.status(404).json({ error: 'User not found' });
    }
const user = result.rows[0];
    //Format the user information nicely for the .txt file
    
    const country = user.country || 'unknown';
    const fileContent = [
      `User Profile Report`,
      `===================`,
      `ID:         ${user.id}`,
      `Username:   ${user.username}`,
      `Email:      ${user.email}`,
      `Country:    ${country}`,
      `Role:       ${user.role}`,
      `Joined On:  ${new Date(user.created_at).toLocaleString()}`,
      `===================`,
      `Generated on: ${new Date().toLocaleString()}`
    ].join('\n'); // Separates lines correctly for text files

    //Set headers to force download and define the file extension
    res.attachment(`${user.username.replace(/\s+/g, '_')}_profile.txt`);
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

//fetch all users
app.get('/api/get-all-users', checkSession, limiter, async(req, res) => {
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

//fetch friends to add
app.get('/api/get-users', checkSession, limiter, async(req, res) => {
  try{
    let users
    if(req.user && req.isAuthenticated()){
      users = await pool.query(
        "SELECT id, username, is_active, is_verified, profile_picture, bio FROM users where is_private IS FALSE AND id != $1 LIMIT 10",
        [req.user.id]
   );
      return res.status(200).json({
        users: users.rows 
    })
    }
   users = await pool.query(
        "SELECT id, username, is_active, is_verified, profile_picture, bio FROM users where is_private IS FALSE LIMIT 10"
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
app.post('/upload/profile-picture', checkSession, limiter, async(req,res) =>{
  try{
  if(!req.isAuthenticated() || !req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  
  
    const { imageStr } = req.body;
    const id = req.user.id

    if (!imageStr) {
      return res.status(400).json({ error: 'No image data provided.' });
    }

    // Send the base64 string directly to Cloudinary
    const cloudinaryResponse = await cloudinary.uploader.upload(imageStr, {
      folder: 'users_profile_pictures',
    })
    .catch((error) => {
           console.log(error);
       });
    
    const optimizedImageUrl = cloudinary.url(cloudinaryResponse.public_id, {
      // --- PASTE YOUR CLOUDINARY OPTIMIZATION CODES HERE ---
      fetch_format: 'auto',       // f_auto: Serves WebP to Chrome, AVIF to iOS automatically
      quality: 'auto',            // q_auto: Compresses file size without losing visual quality
      width: 500,                 // c_limit,w_600: Resizes down if the user's canvas crop 
      crop: 'limit',              // was massive, saving your free tier bandwidth
      secure: true
    });
    
 
    const getUser = await pool.query(
    "SELECT * FROM users WHERE id = $1",
    [id]
  );
    const user = getUser.rows[0];
    if(!user){
   return res.status(400).json({
      error: 'user not found!'
    });
    }

    await pool.query(
        `
        UPDATE users
        SET profile_picture = $1
         WHERE id = $2
        `,
        [
            optimizedImageUrl,
            id
        ]
    );
    console.log( `${user.username} successfully changed their profile picture `);
    res.status(201).json({
      message : `${req.user.username} changed their profile picture `,
      status: 'successful',
      newImageUrl : optimizedImageUrl
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Upload failed' });
  
  }
});

//api for mailing
app.get('/send-mail', checkSession, async(req, res) => {
  try{
if(!req.isAuthenticated() || !req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
}
    // Function to send mail
  const mailOption1 = {
    from: process.env.EMAIL_USER,
    to: req.user.email,
    subject: 'Welcome to JOLI',
    text: `Hi ${req.user.username}, thanks for joining us on JOLI!`,
  };

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: req.user.email,
    subject: 'New notification on JOLI',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Notification on JOLI</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f5f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.05); overflow: hidden;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="padding: 20px; background: linear-gradient(135deg, #555 0%, #333 100%);">
              <img src="https://joli-indol.vercel.app/images/joli-dark.png" alt="joli logo" style="height: 150px; width: auto;"/>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 40px 30px; color: #333333; font-size: 16px; line-height: 1.6;">
              <h2 style="margin-top: 0; color: #111111; font-size: 20px;">Hey ${req.user.username},</h2>
              <p style="margin-bottom: 25px;">Someone just interacted with your profile! Log back in to see your new friend requests, comments, and messages.</p>
              
              <!-- Styled Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #555;">
                    <a href="https://joli-indol.vercel.app" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 6px;">View Notifications</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-bottom: 0; font-size: 14px; color: #666666;">If you didn't request this email, you can safely ignore it.</p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #fafafa; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
              <p style="margin: 0 0 10px 0;">&copy; 2026 JOLI. All rights reserved.</p>
              <p style="margin: 0;"><a href="https://joli-indol.vercel.app" style="color: #667eea; text-decoration: underline;">Unsubscribe from these alerts</a></p>
            </td>
          </tr>

        </table>
      </body>
      </html>
    `,
  };

  
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
res.status(200).json({
      message : "mail sent successfully"
    });
    
  }
  catch(err){
    console.error(err);
    return res.status(500).json({ error: 'mail sending failed' });
  }
});

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
    await initDb(pool);
    pingAivenDatabase();
    setInterval(pingAivenDatabase, HALF_HOUR);
  }catch (err){
    console.error('❌ Database connection failed! Server shutting down...');
    console.error(err.message);
    process.exit(1); 
  }
}
startServer(); 
