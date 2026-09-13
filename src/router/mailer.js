import express from 'express'; 
const router = express.Router();
import geoip from "geoip-lite";
import {pool} from '../config/db.js'; 

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

router.get('/mails', (req, res) => {
  try{
  res.json({ message: 'Fetching all mails' });
  }catch(err){
    res.json({ message: 'Error fetching all mails', error: err });
  }
});
    
export default router;
