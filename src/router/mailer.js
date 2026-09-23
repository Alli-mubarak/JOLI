import express from 'express'; 
import {pool} from '../../config/db.js'; 

const router = express.Router();



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
