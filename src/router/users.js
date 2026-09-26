import express from 'express'; 
import {pool} from '../../config/db.js'; 
import path from 'node:path';
const __dirname = import.meta.dirname;
import { v2 as cloudinary } from 'cloudinary';
import 'dotenv/config'; // Automatically loads environment variables
import 'ejs';
import rateLimit  from 'express-rate-limit';
import transporter from './mailer.js';

const router = express.Router();

//configure rate limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later.'
});

// cloudinary configuration
cloudinary.config({ 
        cloud_name: process.env.CLOUD_NAME, 
        api_key: process.env.CLOUD_API_KEY, 
        api_secret: process.env.CLOUD_API_SECRET 
    });

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

async function fetchUserFriends(userId){
  try{
    const query = "SELECT * FROM friendships WHERE (sender_id = $1 OR receiver_id = $1) "
    const result = await pool.query(query, [userId]);
    const friends = await result.rows.filter(f => f.status === "accepted");
    const pendings  = await result.rows.filter(f => f.status === "pending");
    console.log("user friends fetched");
    return {
      count: friends.length,
      friends : friends,
      pendings: pendings
    }
              
  }
  catch(e){
    console.error(e)
    return {error: "failed to fetch friends"}
  }
}

async function fetchUserPosts(userId){
  try{
    const query = "SELECT * FROM posts WHERE user_id = $1 ORDER BY created_at DESC"
    const result = await pool.query(query, [userId]);
    console.log("user posts fetched");
    return {
      count: result.rows.length,
      posts : result.rows
    }
              
  }
  catch(e){
    console.error(e)
    return {error: "failed to fetch friends"}
  }
}

//function for fetching posts liked by a user
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

//user view api
router.get('/:username', async (req, res) => {
  console.log('user fetched \n');
  
try{
    const username = req.params.username;
    const userQuery= await pool.query('SELECT id, username, is_active, is_verified, profile_picture, bio, cover_photo FROM users WHERE username = $1', [username]);
  if (userQuery.rows.length === 0) {
    console.error('user not found!');
    return res.sendFile(path.join(__dirname, "../../", "/views/user-error.html"));
  }
  const userData = userQuery.rows[0];
let friends = await fetchUserFriends(userData.id);
  if(friends.error){
    return res.status(500).send("Could not fetch friends");
  }
if(req.isAuthenticated() && req.user && userData.username !== req.user.username) {  
  const isFriend = await  friends.friends.some(f => f.sender_id === req.user.id || f.receiver_id === req.user.id);
  userData.is_friend = isFriend;
  const isPending = await friends.pendings.some(f => f.sender_id === req.user.id);
  console.log(isPending);
  userData.is_pending = isPending;
}     
  if(friends.count < 2){ userData.friends = friends.count + " friend"}
  else{userData.friends = friends.count + " friends"}
  
  let posts = await fetchUserPosts(userData.id);
  if(posts.error){
    return res.status(500).send("Could not fetch posts");
  }
  if(posts.count > 0) {
   const userPosts = posts.posts
    for(let i = 0; i < userPosts.length; i++){
      if(req.isAuthenticated() && req.user && req.user.id){
        const likeStat = await getPostLikeStatus(userPosts[i].id, req.user.id);
        userPosts[i].likeStatus = likeStat
      }
      const commentsQuery = `
      SELECT c.*, 
      u.username AS commenter,
      u.profile_picture AS commenter_pic
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.post_id = $1 
      ORDER BY c.created_at DESC
    `;
    const commentsResult = await pool.query(commentsQuery, [userPosts[i].id]);
    userPosts[i].comments = commentsResult.rows;
    }
    userData.posts_count = `  (${posts.count})`;
    userData.posts = userPosts
  }
  
  if(req.user && req.user.id){
    if(userData.username === req.user.username){
      userData.mine = true;
      userData.title = "My profile";
      userData.ref = "You";
    }
  }
 res.render('user', { user: userData }); 
}catch(e){
  console.error('Error fetching user',e);
  return res.status(500).sendFile(path.join(__dirname, "../../", "/views/user-error.html"));
}
}
)


//user role change api
router.get('/v1/change-role/user/:id/:newRole', checkSession, limiter, async(req,res) => {
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
    res.status(500).json({
      error: error,
      errorMessage: error.message
    })
  }
});

//download user details 
router.get('/download-txt', checkSession, async (req, res) => {
  if(!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  if(!req.user) {
    return res.status(401).send('Unauthorized. Please log in.');
  }
  
  const userId = req.user.id
  try {
    // Fetch user data from AIVEN DB
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

//change user visibility to active
router.post('/v1/heartbeat', async (req, res) => {
  if(!req.user || !req.isAuthenticated()){
      return res.json({
        error: "User not logged in"
    })
  }
  const userId  = req.user.id;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    // Optimization: Update the database AND check if they were previously offline
    const query = `
      UPDATE users 
      SET last_seen = NOW(), 
          is_active = true 
      WHERE id = $1
      RETURNING is_active;
    `;
    
    await pool.query(query, [userId]);
    return res.json({ success: true, status: 'online' });
  } catch (err) {
    console.error('Database heartbeat error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Explicit Disconnect Endpoint api that changes visibility 
router.post('/v1/disconnect', async (req, res) => {
  if(!req.user || !req.isAuthenticated()){
      return res.json({
        error: "User not logged in"
    })
  }
  const userId  = req.user.id;
  if (!userId) return res.status(400).json({ error: 'User ID required' });

  try {
    const query = `
      UPDATE users 
      SET is_active = false 
      WHERE id = $1;
    `;
    await pool.query(query, [userId]);
    return res.json({ success: true, status: 'offline' });
  } catch (err) {
    console.error('Database disconnect error:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});



export default router;
