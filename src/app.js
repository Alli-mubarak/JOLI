import express from 'express';
import {pool, initDb} from '../config/db.js'; 
import mailRoutes from './router/mailer.js'; 
import authRoutes from './router/auth.js'; 
import postRoutes from './router/posts.js'; 
import userRoutes from './router/users.js'; 
import friendshipRoutes from './router/friendship.js'; 
import cRoutes from './router/conversations.js'; 
import mRoutes from './router/messages.js'; 
import connectPgSimple from 'connect-pg-simple';
import fs from 'fs';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import cors from 'cors';
import dotenv from 'dotenv';
import passport from 'passport';
import path from 'node:path';
import bodyParser from 'body-parser';
import { OAuth2Client } from 'google-auth-library';
import session from 'express-session';
import rateLimit  from 'express-rate-limit';
import transporter from '../Utils/mailer.js';
import { v2 as cloudinary } from 'cloudinary';
import jwt from 'jsonwebtoken';
import http from 'http';
import { Server } from 'socket.io';
import 'ejs';

dotenv.config();
const app = express();
const server = http.createServer(app);
app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json({limit: '10mb'}))

// Middleware (e.g., JSON parsing)
app.use(express.json({ limit: '10mb' })),
app.set('trust proxy', 1); // Triggers Express to trust the HTTPS headers from your host

app.use(express.static('icon'));
const __dirname = import.meta.dirname;
const __filename = fileURLToPath(import.meta.url);

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

const sessionMiddleware = session({
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
});

app.use(sessionMiddleware);
app.set('views', path.join(process.cwd(), 'dviews'))
app.set('view engine', 'ejs');
  
app.use(express.static(path.join(__dirname, 'public')));

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

//middleware - logs the method, path, ip address and time to the console
app.use(function middleware(req,res,next){
let d = new Date();
const countryName = req.headers['x-vercel-ip-country'];
let currentTime = d.toLocaleString();
console.log(req.method, req.path, req.hostname, req.ip, countryName, currentTime,);
  //fetch request location from vercel
console.log(req.headers['x-vercel-ip-country'], req.headers['x-vercel-ip-country-region'], req.headers['x-vercel-ip-city'])
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

//***""""ROUTES CONFIGURATION"""""""
app.use('/api/m', mailRoutes);
app.use('/api/auth', authRoutes);
app.use('/post', postRoutes);
app.use('/user', userRoutes);
app.use('/api/friendship', friendshipRoutes);
app.use('/api/conversation', cRoutes);
app.use('/api/message', mRoutes);
//***********

//endpoint for a unified search
app.get('/api/search', async (req, res) => {
  const { q } = req.query; // URL example: /api/search?q=basketball
  console.log("searching for :", q);
  if(req.user) console.log("by: ", req.user);
  
  if (!q) return res.json({ users: [], posts: [] });

  try {
    // Format query for full-text search (e.g., 'basketball' -> 'basketball:*')
    const formattedQuery = `${q.trim().split(/\s+/).join(' | ')}:*`;

    // 1. Search Users
    const userQuery = `
      SELECT id, username, is_active, is_verified, last_seen, bio, profile_picture
      FROM users 
      WHERE to_tsvector('english', username) @@ to_tsquery('english', $1)
      LIMIT 5;
    `;
    
    // 2. Search Posts (ordered by relevancy ranking)
    const postQuery = `
      SELECT id, content, created_at, user_id, media_urls, ts_rank(to_tsvector('english', content), to_tsquery('english', $1)) as rank
      FROM posts 
      WHERE to_tsvector('english', content) @@ to_tsquery('english', $1)
      ORDER BY rank DESC
      LIMIT 15;
    `;

    const [usersResult, postsResult] = await Promise.all([
      pool.query(userQuery, [formattedQuery]),
      pool.query(postQuery, [formattedQuery])
    ]);

    res.json({
      users: usersResult.rows,
      posts: postsResult.rows
    });

  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
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

//friends page route
app.get('/friends',(req, res)=>{
console.log('followers page requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/friends.html"));
});

//cropper test page
app.get('/test-cropper',(req, res)=>{
console.log('image cropper page  requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/cropper.html"));
});

//messages page route
app.get('/messages',(req, res)=>{
console.log('messages page  requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/messages.html"));
});

//search page route
app.get('/search',(req, res)=>{
console.log('add post page  requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/search.html"));
});

//search page route
app.get('/inbox',(req, res)=>{
console.log('add post page  requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/inbox.html"));
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

// socket io configuration 
const io = new Server(server, {
  transports: ["websocket"],
  pingTimeout: 5000, 
  pingInterval: 10000
});


io.engine.use(sessionMiddleware);
io.engine.use(passport.initialize());
io.engine.use(passport.session());


//Connection & 1:1 Chat Architecture
io.on("connection", async(socket) => {
  const req = socket.request;

  if (!req.user || !req.isAuthenticated()) {
    console.log('Rejected unauthenticated socket connection.');
    return socket.disconnect(true);
  }

  console.log(`User connected to socket: ${req.user.username}`);
  const currentUserId = req.user.id;
  console.log(`👤 User connected: ${currentUserId} (Socket: ${socket.id})`);

  // Pro Trick: Force user into a private room named after their own User ID.
  // This allows you to message a user across all their open devices/tabs easily.
  socket.join(currentUserId);

  // Mark user as online in your database or Redis cache here...
  try {
    const setOnline = await pool.query(`
      UPDATE users 
      SET is_active = true 
      WHERE id = $1;
    `,[currentUserId]);
    console.log(currentUserId, "is active");
  } catch (err) {
    console.error('Database disconnect error:', err);
    return ;
  }

  // Handle 1:1 Messages
  socket.on("send_private_message", async (data, acknowledge) => {
    const { recipientId, messageText } = data;

    if (!recipientId || !messageText) {
      return acknowledge({ status: "error", error: "Missing payload details" });
    }

    try {
      // Step A: Persist to your database (MongoDB, Postgres, etc.) FIRST
      const savedMessage = await saveMessageToDatabase({
        senderId: currentUserId,
        recipientId,
        text: messageText,
      });
      
      // Step B: Direct the message exclusively to the recipient's personal room
      io.to(recipientId.toString()).emit("receive_private_message", {
        message: savedMessage
      });

      // Step C: Trigger callback acknowledgment back to the sender
      acknowledge({
        status: "ok",
        message: savedMessage
      });

    } catch (error) {
      console.error("Failed to process message:", error);
      acknowledge({ status: "error", error: "Failed to deliver message" });
    }
  });
    socket.on("typing_status", ({ recipientId, isTyping }) => {
    io.to(recipientId.toString()).emit("user_typing", {
      senderId: currentUserId,
      isTyping
    });
  });

  // Disconnection cleanup
  socket.on("disconnect", async() => {
    console.log(`🔌 User disconnected: ${currentUserId}`);
    // Update online status in database or cache here...
    
    try {
    const setOffline = await pool.query(`
      UPDATE users 
      SET is_active = false 
      WHERE id = $1;
    `,[currentUserId]);
    acknowledge({
        status: "ok",
        message: "user is disconnected"
      });
  } catch (err) {
    console.error('Database disconnect error:', err);
    return acknowledge({ status: "error", error: "database error occurred" });
    }
  });
});

async function saveMessageToDatabase({ senderId, recipientId, text }) {
  try{
  const msgQuery = await pool.query(
`
INSERT INTO messages
(
    sender_id,
    receiver_id,
    content
)

VALUES
(
    $1,
    $2,
    $3
)

RETURNING *;
`,
[
    senderId,
    recipientId,
    text.trim()
]);
  if(msgQuery.rows && msgQuery.rows.length > 0){
  const newMsg = msgQuery.rows[0];
  await pool.query(
    `UPDATE conversations 
    SET last_message = $3, updated_at = NOW() 
    WHERE (user_id = $1 AND friend_id = $2)
    OR (user_id = $2 AND friend_id = $1)`,
    [senderId, recipientId, text.trim()]
  );
  
  return { 
    id: newMsg.id, 
    senderId: newMsg.sender_id, 
    recipientId: newMsg.receiver_id,
    text: newMsg.content,
    createdAt: newMsg.created_at
  }
  }else{
    return {error: "could not save message"}
  }
  }catch(err){
    console.error(err);
    return {error: err}
  }
  }

//************
//  Background Cleanup Loop (The Inactivity Sweeper)
// Runs every 30 seconds to catch users who closed their browser/lost network connection
const OFFLINE_TIMEOUT_INTERVAL = '2 minutes'; 
setInterval(async () => {
  try {
    // Flip users to inactive if NOW minus last_seen is greater than our timeout
    const query = `
      UPDATE users 
      SET is_active = false 
      WHERE is_active = true 
        AND last_seen < NOW() - INTERVAL '${OFFLINE_TIMEOUT_INTERVAL}';
    `;
    
    const result = await pool.query(query);
    
    if (result.rowCount > 0) {
      console.log(`Automatically marked ${result.rowCount} inactive users as offline.`);
    }
  } catch (err) {
    console.error('Background status cleanup failed:', err);
  }
}, 120000); // Check every 2 minutes


//start server
async function startServer(){
  try{
  console.log('🔄 Connecting to Aiven PostgreSQL...');
    const result = await pool.query('SELECT NOW()');
    
    console.log('✅ Database connected successfully!');
    console.log(`🕒 Aiven Server Time: ${result.rows[0].now}`);

    // set listener
// const listener = app.listen(process.env.PORT,()=>{
//  console.log("app is listening on port ", listener.address().port,'\n');
//});

// CRITICAL: Start the HTTP server, NOT 'app.listen'
const PORT = 5000;
server.listen(PORT, () => {
  console.log(`🚀 Combined Express & Socket server running on port ${PORT}`);
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
