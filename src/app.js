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
//import { sendCustomEmail } from '../Utils/mailer.js';

dotenv.config();
const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json())

// Middleware (e.g., JSON parsing)
app.use(express.json());

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

//database table setup
const initDb = async () => {
  const setupScript = `
    CREATE EXTENSION IF NOT EXISTS "citext";

    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username CITEXT UNIQUE NOT NULL,
        email CITEXT UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
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
   is_private BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
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


// Configure and use the session middleware
const PostgresStore = connectPgSimple(session);

// session middleware (Saves sessions directly to Aiven Postgres)
app.use(session({
  store: new PostgresStore({ pool: pool, tableName: 'session' }),
  secret: process.env.SESSION_SECRET || 'super-secure-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 30 * 24 * 60 * 60 * 1000, secure: false }
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

// Configure Passport Google Strategy
// updated Passport Google Strategy with Async/Await Database Logic
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.CALLBACK_URL,
    passReqToCallback: true  // this will make the req object available for access
  },
  async (req, accessToken, refreshToken, profile, done) => {
    const countryName = getCountryNameFromReq(req);
    // Structure the data coming from Google profile payload
    const newUser = {
     googleId: profile.id,
      displayName: profile.displayName,
      firstName: profile.name.givenName,
      lastName: profile.name.familyName,
      email: profile.emails[0].value,
      profilePic: profile.photos[0].value,
      country: countryName
    };

    try {
      // Check if user already exists in our database
    //*  let user = await 

      if (user) {
        // User exists, pass the user object to the next step
        return done(null, user);
      } else {
        // User does not exist, create and save them to MongoDB
       //* user = await User.create(newUser);
        return done(null, user);
      }
    } catch (err) {
      console.error(err);
      return done(err, null);
    }
  }
));

// Add the Local Strategy for Email/Password
passport.use(new LocalStrategy(
    {
        usernameField: 'email',    // Define 'email' as the username field
        passwordField: 'password'
    },
    async (email, password, done) => {
        try {
            // 1. Find the user by email
         //*   const user = 
            if (!user) {
                return done(null, false, { message: 'User not found!.' });
            }

            // 2. Validate password (assuming you hash passwords on signup)
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return done(null, false, { message: 'Incorrect credentials.' });
            }

            // 3. Success
            return done(null, user);
        } catch (err) {
            return done(err);
        }
    }
));

// Serialize and Deserialize User Session Data
//  Serialize user using the MongoDB object ID (_id) instead of the whole object
passport.serializeUser((user, done) => {
  const id = user.id || user._id; 
  done(null, id);
});

// Deserialize user by fetching them from MongoDB using their ID
passport.deserializeUser(async (id, done) => {
  try {
//*    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

// --- Auth Routes ---

//sign up API
app.post('/api/sign-up', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if email is taken
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists' });
    }
    const countryName = getCountryNameFromReq(req);
  
// Hash password and save user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

  //*  const newUser = new User({ displayName: username, email,country: countryName, password: hashedPassword, profilePic: "/user.png"});
   //* await newUser.save();
    // Log the user in automatically
    // Convert the Mongoose document to a plain JavaScript object
   const userObj = newUser.toObject();
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

//  Email Login
app.post('/auth/login', (req, res, next) => {
  // 1. Extract values to validate that the frontend sent the required data
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
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
      return res.status(401).json({ message: info?.message || 'Invalid email or password.' });
    }

    //  Credentials are correct! Establish the user session
    req.login(user, (loginErr) => {
      if (loginErr) {
        console.error('Session creation failed:', loginErr);
        return next(loginErr);
      }

      // Convert Mongoose document to a plain object to clean it up safely
      const cleanUser = user.toObject();
      delete cleanUser.password; // Never send the hashed password back to the frontend

      
      return res.status(200).json({
        message: 'Logged in successfully.',
        user: cleanUser
      });
    });

  })(req, res, next); // Necessary to pass the request and response objects to Passport
});

// Trigger Google Sign-Up / Login Flow
app.get('/auth/google', 
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

//  Google OAuth Callback Route
app.get('/auth/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // Successful authentication, redirect to user dashboard or home.
    res.redirect('/dashboard');
  }
);


//default route
app.get('/',(req, res)=>{
console.log(req.query)
console.log('default path requested! \n');
  res.sendFile(path.join(__dirname, "../", "/views/index.html"));
});

//sign up route
app.get('/sign-up',(req, res)=>{
console.log(req.query)
console.log('sign up page  requested! \n');
  if (req.isAuthenticated()){
   return  res.redirect('/');
  }
  res.sendFile(path.join(__dirname, "../", "/views/signup.html"));
});

//sign in route
app.get('/sign-in',(req, res)=>{
console.log(req.query)
console.log('sign in page  requested! \n');
  if (req.isAuthenticated()){
   return  res.redirect('/');
  }
  res.sendFile(path.join(__dirname, "../", "/views/login.html"));
});


//user check route
app.get('/api/auth/user', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false, user: null });
  }
});

// POST Route for logging in
app.post('/login', passport.authenticate('local', {
    successRedirect: '/dashboard',
    failureRedirect: '/sign-in',
    failureFlash: false 
}));


// API for changing users role

  
// --- Application Routes ---

app.get('/dashboard', async(req, res) => {
   if(!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  // res.send(`<h1>Welcome ${req.user.firstName}</h1><p>Email: ${req.user.email}</p><a href="/logout">Logout</a>`);
 // const taifrgetUser = req.user.email;
//const emailSubject = 'Welcome to Our Website!';
//const emailBody = `
//  <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee;">
  //  <h2 style="color: #333;">Thank you for joining us!</h2>
//    <p>Your account is now active under our custom URL setup.</p>
  //  <a href="https://yourwebsiteurl.com" style="background: blue; color: white; padding: 10px; text-decoration: none;">Visit Dashboard</a>
//  </div>
//`;
  
  //build the email notification content - build later 
  const email = req.user.email;
  console.log(email)
    const emailSubject = 'Security Alert: New Login Detected';
    const currentTime = new Date().toLocaleString();
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e0e0e0; padding: 20px; border-radius: 8px;">
        <h2 style="color: #d9534f;">New Login Notification</h2>
        <p>Hello,</p>
        <p>We detected a new login to your account at <strong>${currentTime}</strong>.</p>
        <p>If this was you, you can safely ignore this email. If this wasn't you, please change your password immediately.</p>
        <br>
        <p style="font-size: 12px; color: #777;">This is an automated security alert from your website application.</p>
      </div>
    `;

    //. Trigger the email function (Fire-and-forget or awaited)
    // Will work on the mailing system later
  
//  try {
 //     await sendCustomEmail(email, emailSubject, emailHtml);
//    console.log('email sent!');
//   } catch (emailError) {
//    console.error('⚠️ User logged in, but security email failed to send:', emailError.message);
//           }
  
  res.redirect('/');
});

app.get('/login-failed', (req, res) => {
  res.send('Authentication failed. Please try again.');
});

// Logout Route
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) return next(err);
    
    // Destroy the session in MongoDB
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

//google login
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Endpoint where frontend sends the Google ID Token
app.post('/api/auth/google', async (req, res) => {
    const { token } = req.body;

    if (!token) {
        return res.status(400).json({ message: 'Token is required' });
    }

    try {
        // Verify the token integrity with Google
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID, 
        });

        // Extract the user profile data
        const payload = ticket.getPayload();
        const { sub, email, name, picture } = payload;

        // DATABASE LOGIC GOES HERE:
        // 1. Check if user with 'sub' (Google ID) or 'email' exists in database.
        // 2. If not, create a new user record.
        // 3. Generate your own session token (like a JWT) for your app.

        res.status(200).json({
            message: 'Authentication successful',
            user: { id: sub, email, name, picture }
        });

    } catch (error) {
        res.status(401).json({ message: 'Invalid Google token', error: error.message });
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
