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

router.get('/user/conversations', checkSession,  async (req, res) => {
  try {
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
  }

    const userId = req.user.id;
    const query = "SELECT * FROM conversations WHERE (user_id = $1 OR friend_id = $1)"

    const result = await pool.query(query, [userId]);

     return res.status(200).json({
            conversations: result.rows
        });

    } catch (error) {
        console.error("Fetch conversations list error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// conversation creation api
router.post('/v1/create-conversation', checkSession, async (req, res) => {
  try{
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: 'You need to log in first!'});
  }
  
  const userId = req.user.id;

  if (!userId) {
    return res.status(400).json({ error: 'user id is required' });
  }
  const { friend_id, friend_username, friend_pic, last_message} = req.body;
  if (!friend_id || !friend_username || !friend_pic || !last_message) {
    return res.status(400).json({ error: 'one or more information is missing' });
  }
    
const queryText = `
  INSERT INTO conversations (user_id, friend_id, friend_username, friend_pic, last_message)
  VALUES ($1, $2, $3, $4, $5)
  RETURNING *;
`;
    const values = [userId, friend_id, friend_username, friend_pic, last_message];
    

    const result = await pool.query(queryText, values);

    const newConversation = result.rows[0];
    console.log('Conversation successfully created!');
    console.log(newConversation);
    return res.status(201).json(newConversation);

  } catch (error) {
    console.error('Error creating conversation:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
      

export default router;
