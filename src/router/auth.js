import express from 'express'; 
import geoip from "geoip-lite";
import {pool} from '../../config/db.js'; 
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import rateLimit  from 'express-rate-limit';
import transporter from '../../Utils/mailer.js';
import 'dotenv/config'; // Automatically loads environment variables
import bcrypt from 'bcrypt';


const authRouter = express.Router();

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

const numbers = "912837465";
 async function generateCode(num){
      try{
      let code = "";
        
          for(let i = 0; i < num; i++){
          let rN = Math.floor(Math.random() * numbers.length);
           code += numbers[rN]
          }
          return code;
      }
      catch(e){
          alert(e)
          console.error(e)
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

async function sendWelcomeMessage(email, username){
  try{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome message from JOLI',
    text: "You are welcome to JOLI, We are happy to have you.",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome message from JOLI</title>
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
              <h2 style="margin-top: 0; color: #111111; font-size: 20px;">Hello ${username},</h2>
              <p style="margin-bottom: 25px;">You are welcome to JOLI. Explore to add new friends, make posts, comments, and send messages.</p>
              
              <!-- Styled Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #555;">
                    <a href="https://joli-indol.vercel.app" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 6px;">Explore Now!</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-bottom: 0; font-size: 14px; color: #666666;">We will be sending updates afterwards, thank you for joining us.</p>
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
    console.log(info);
  return info;
  }catch(err){
    console.error("An error occurred while sending mail",err)
    return {error: "An error occurred while sending mail"}
  }
}

async function sendGoogleMessage(email, username){
  try{
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Google sign in message from JOLI',
    text: "You have now signed in with Google, We are happy to have you.",
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Google sign in message from JOLI</title>
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
              <h2 style="margin-top: 0; color: #111111; font-size: 20px;">Hello ${username},</h2>
              <p style="margin-bottom: 25px;">You just signed in with Google and you now have your account verified!. Explore to add new friends, make posts, comments, and send messages.</p>
              
              <!-- Styled Button -->
              <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 30px auto;">
                <tr>
                  <td align="center" style="border-radius: 6px; background-color: #555;">
                    <a href="https://joli-indol.vercel.app" target="_blank" style="display: inline-block; padding: 14px 30px; font-size: 16px; color: #ffffff; font-weight: bold; text-decoration: none; border-radius: 6px;">Explore Now!</a>
                  </td>
                </tr>
              </table>
              
              <p style="margin-bottom: 0; font-size: 14px; color: #666666;">We will be sending more updates, thank you for being a member.</p>
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
  return info;
  }catch(err){
    console.error("An error occurred while sending mail",err)
    return {error: "An error occurred while sending mail"}
  }
}

// Configure Passport Google Strategy
// updated Passport Google Strategy with Async/Await Database Logic
passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: "https://joli-indol.vercel.app/api/auth/google/callback",
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
            is_verified = $4,
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
    const greetUpdatedUser = await sendGoogleMessage(email, user.username);
    if(greetUpdatedUser.error){
      console.error("Google message sending failed!");
    }else{
      console.log("Google message sent successfully!");
    }
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
    $9,
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
    country,
   true
]);
   const greetNewUser = await sendWelcomeMessage(profile.emails[0].value, username);
    if(greetNewUser.error){
      console.error("Welcome message sending failed!");
    }else{
      console.log("Welcome message sent successfully!");
    }
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
      


//configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.'
});

//  Google OAuth Callback Route
authRouter.get('/google/callback', limiter, (req, res, next) => {
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

//sign up API
authRouter.post('/sign-up', limiter, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required!' });
    }
    
   if (username.length < 5) {
      return res.status(400).json({ message: 'Username is too short!' });
    }
    

    // Check if email is taken
    const emails = await pool.query(
    "SELECT * FROM users WHERE email = $1",
    [email.trim()]
  );
    let existingEmail;
    if (emails){
   existingEmail = emails.rows[0];
    }
    
    if (existingEmail) {
      return res.status(400).json({ message: 'Email already exists!'});
    }

    // Check if username is taken
    const usernames = await pool.query(
    "SELECT * FROM users WHERE username = $1",
    [username.trim()]
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
    username.toLowerCase().trim(),
    email.toLowerCase().trim(),
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
authRouter.post('/login', limiter, (req, res, next) => {
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
authRouter.get('/google', limiter,
  passport.authenticate('google', { scope: ['profile', 'email'] })
);

//user check api
authRouter.get('/user',  (req, res) => {
  if (req.isAuthenticated()) {
    res.json({ loggedIn: true, user: req.user });
  } else {
    res.json({ loggedIn: false, user: null });
  }
});

// Logout API
authRouter.get('/logout', checkSession, limiter, async(req, res) => {
  try {
    if(!req.isAuthenticated() || !req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
    }
  const userId = req.user.id;
  await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [userId]
    );

  req.logout((err) => {
    if (err) return next(err);
    
    // Destroy the session in Database 
    req.session.destroy((err) => {
      if (err) return res.send('Error logging out!');
      
      // Clear the cookie on the client side
      res.clearCookie('connect.sid',{
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });
      res.redirect('/');
    });
  });
  } catch (error) {
    console.error("Database error during logout:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
});

authRouter.post('/reset-password', limiter, async(req, res) => {
  try{
  const {email} = req.body;
  if(req.isAuthenticated() || req.user) {
    return res.status(401).send('You are already logged in.');
  }
  if (!email) {
      return res.status(400).json({ message: 'Email is required!'});
    }
  const findEmail = await pool.query("SELECT * FROM users WHERE email = $1", [email.trim()]);
    if(findEmail.rows.length !== 0){
      const user = findEmail.rows[0];
      if(user.google_id && user.google_id.length > 1){
        return res.status(200).json({ message: 'Google login detected, log in with Google!'});
      }
      if(user.is_verified){
        const resetCode = await generateCode(6);
        const saltRounds = 10;
        const tokenHash = await bcrypt.hash(resetCode, saltRounds);

        //set expiry time - 11 minutes 
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 11);

        // Save hash to DB (overwriting any older tokens for this user)
        await pool.query('BEGIN');
        await pool.query('DELETE FROM password_resets WHERE user_id = \$1', [user.id]);
        await pool.query(
            'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (\$1, \$2, \$3)',
            [user.id, tokenHash, expiresAt]
        );
        await pool.query('COMMIT');
        //** send mail containing reset code
      return res.status(200).json({ message: `Email found, reset code has been sent!, ${resetCode}`});
      }
      return res.status(200).json({ message: 'Email was not verified, password cannot be reset!'});
    }else{
      return res.status(400).json({ message: 'Email not found!'});
    }
    
  }catch(err){
    console.error(err);
    return res.status(500).json({ message: "Internal server error!" });    
  }
});

authRouter.post('/change-password', limiter, async(req, res) => {
  try{
  const {resetCode, newPassword, email, passwordConfirm} = req.body;
  if(req.isAuthenticated() || req.user) {
    return res.status(401).send('You are already logged in.');
  }
  if (!email) {
    return res.status(400).json({ message: 'email is required.' });
  }
  if (!resetCode) {
    return res.status(400).json({ message: 'code is required.' });
  }
  if (!newPassword) {
    return res.status(400).json({ message: 'new password is required.' });
  }
  if (!passwordConfirm) {
    return res.status(400).json({ message: 'password confirm is required.' });
  }
    
        const result = await pool.query(
            `SELECT pr.token_hash, pr.expires_at, pr.user_id 
             FROM password_resets pr
             JOIN users u ON pr.user_id = u.id
             WHERE u.email = $1`, 
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Invalid or expired code.' });
        }

        const { token_hash, expires_at, user_id } = result.rows[0];

        // Check if the token has expired
        if (new Date() > new Date(expires_at)) {
            await pool.query('DELETE FROM password_resets WHERE user_id = $1', [user_id]);
            return res.status(400).json({ error: 'Code has expired.' });
        }

        // Compare the plain user input with the database bcrypt hash
        const isMatch = await bcrypt.compare(resetCode, token_hash);

        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid or expired code.' });
        }

        //  Code is valid! 
        // **You can now allow them to proceed to update their password, 
        // ***or send a temporary session token to authorize the password change screen.
        return res.status(200).json({ message: 'Code verified successfully.', userId: user_id });

          
    
    }catch(err){
    console.error(err);
    return res.status(500).json({ error : "Internal server error!" });    
  }
});

export default authRouter;
