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

async function getFriendDetails(f, uid){
  try{
    let friendId;
    if(f.receiver_id === uid) {
      friendId = f.sender_id;
    }else{
      friendId = f.receiver_id
    }
    const query = "SELECT username, profile_picture, id, is_active, is_verified FROM users WHERE id = $1";
    const result = await pool.query(query, [friendId]);
    const user = result.rows[0];
    console.log("friends details fetched!");
    return {
      id: user.id,
      username : user.username,
      profile_picture : user.profile_picture,
      is_active : user.is_active,
      is_verified : user.is_verified,
    }
  }
  catch(err){
    return {error: "error fetching user details"}
  }
}

router.post('/user/messages', checkSession,  async (req, res) => {
  try {
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
  }

    const userId = req.user.id;
    const {friendId} = req.body
  if (friendId){
   return  res.status(400).json({error: "Friend id is missing"});
  }
    const query = "SELECT * FROM messages WHERE (sender_id = $1 AND receiver_id = $2) OR (sender_id = $2 AND receiver_id = $1)"

    const result = await pool.query(query, [userId, friendId]);

     return res.status(200).json({
            messages: result.rows
        });

    } catch (error) {
        console.error("Fetch messages list error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;
