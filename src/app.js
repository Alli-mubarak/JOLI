import express from 'express';
import {pool, initDb} from '../config/db.js'; 
import mailRoutes from './router/mailer.js'; 
import authRoutes from './router/auth.js'; 
import postRoutes from './router/posts.js'; 
import userRoutes from './router/users.js'; 
import friendshipRoutes from './router/friendship.js'; 
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
//***********


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
