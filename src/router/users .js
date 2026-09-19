import express from 'express'; 
import geoip from "geoip-lite";
import {pool} from '../../config/db.js'; 
import path from 'node:path';
const router = express.Router();
const __dirname = import.meta.dirname;
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'; // Automatically loads environment variables
import 'ejs';
import transporter from './mailer.js';

app.set('views', path.join(process.cwd(), 'dviews'))
app.set('view engine', 'ejs');

// cloudinary configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET 
    });

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

router.get('/download-txt', checkSession, async (req, res) => {
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
router.get('/v1/get-all-users', checkSession, limiter, async(req, res) => {
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
router.get('/v1/get-users', checkSession, limiter, async(req, res) => {
  try{
    let users
    if(req.user && req.isAuthenticated()){
      users = await pool.query(
        "SELECT id, username, is_active, is_verified, profile_picture, bio FROM users where is_private IS FALSE AND id != $1 ",
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

export default router;
