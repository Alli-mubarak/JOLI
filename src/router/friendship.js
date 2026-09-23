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
    const user = result.rows[0]
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

router.post('/request', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const senderId = req.user.id; 
    const { receiverId } = req.body;
    
    if (!receiverId) {
      console.log('Missing receiver id');
        return res.status(400).json({ error: 'Missing receiver id' });
    }
    
    //  Validation: Cannot friend yourself
    if (senderId === parseInt(receiverId)) {
        return res.status(400).json({ error: "You cannot send a friend request to yourself." });
    }
    const checkReceiver = await pool.query("SELECT * FROM users WHERE id = $1", [receiverId]);
    if (checkReceiver.rows.length === 0) {
            return res.status(403).json({ 
                error: 'Receiver not found.' 
            });
    }
    
        const query = `
            INSERT INTO friendships (sender_id, receiver_id, status)
            VALUES ($1, $2, 'pending')
            ON CONFLICT (LEAST(sender_id, receiver_id), GREATEST(sender_id, receiver_id)) 
            DO NOTHING
            RETURNING status;
        `;

        const result = await pool.query(query, [senderId, receiverId]);

        // Handle Conflicts (If the row already exists)
        if (result.rows.length === 0) {
            // Check why it failed to find out if it's already pending, accepted, or blocked
            const checkQuery = `
                SELECT sender_id, receiver_id, status 
                FROM friendships 
                WHERE (sender_id = $1 AND receiver_id = $2) 
                   OR (sender_id = $2 AND receiver_id = $1);
            `;
            const checkResult = await pool.query(checkQuery, [senderId, receiverId]);
            const existing = checkResult.rows[0];

            if (existing.status === 'accepted') {
                return res.status(409).json({ error: "You are already friends with this user." });
            }
            if (existing.status === 'pending') {
                if (existing.sender_id === senderId) {
                    return res.status(409).json({ error: "Friend request is already pending." });
                } else {
                    return res.status(400).json({ 
                        error: "This user has already sent you a request. Accept it instead." 
                    });
                }
            }
            if (existing.status === 'blocked') {
                return res.status(403).json({ error: "Action not allowed." });
            }
        }

        // Success Response
        return res.status(201).json({ 
            message: "Friend request sent successfully.", 
            status: "pending" 
        });

    } catch (error) {
        console.error("Friend request error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for friendship acceptance 
router.post('/accept', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const receiverId = req.user.id; // The authenticated user accepting the request
    const { senderId } = req.body;  // The user who originally sent the request
    
    if (!senderId) {
      console.log('Missing sender id');
        return res.status(400).json({ error: 'Missing sender id' });
    }
    

        // Update the status to 'accepted' ONLY if it is currently 'pending'
        // and the current user is truly the receiver of that specific request.
        const query = `
            UPDATE friendships
            SET status = 'accepted',
                updated_at = CURRENT_TIMESTAMP
            WHERE sender_id = $1 
              AND receiver_id = $2 
              AND status = 'pending'
            RETURNING *;
        `;

        const result = await pool.query(query, [senderId, receiverId]);

        // If no rows were updated, either the request doesn't exist,
        // it's already accepted/blocked, or the roles are reversed.
        if (result.rows.length === 0) {
            // Verify why the update failed to give clean feedback
            const checkQuery = `
                SELECT sender_id, receiver_id, status 
                FROM friendships 
                WHERE (sender_id = $1 AND receiver_id = $2)
                   OR (sender_id = $2 AND receiver_id = $1);
            `;
            const checkResult = await pool.query(checkQuery, [senderId, receiverId]);

            if (checkResult.rows.length === 0) {
                return res.status(404).json({ error: "Friend request not found." });
            }

            const record = checkResult.rows[0];

            if (record.status === 'accepted') {
                return res.status(409).json({ error: "You are already friends." });
            }
            if (record.status === 'blocked') {
                return res.status(403).json({ error: "Action not allowed." });
            }
            if (record.status === 'pending' && record.sender_id === receiverId) {
                return res.status(400).json({ 
                    error: "You cannot accept a request you sent. Wait for them to accept." 
                });
            }
        }

        // Success Response
        return res.status(200).json({
            message: "Friend request accepted successfully.",
            friendship: result.rows[0]
        });

    } catch (error) {
        console.error("Accept friend request error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for friendship deletion
router.delete('/delete', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const receiverId = req.user.id; // The authenticated user accepting the request
    const { senderId } = req.body;  // The user who originally sent the request
    
    if (!senderId) {
      console.log('Missing sender id');
        return res.status(400).json({ error: 'Missing sender id' });
    }
    if (receiverId === senderId) {
            return res.status(400).json({ error: "You cannot unfriend yourself." });
    }

      const query = `
            DELETE FROM friendships 
            WHERE sender_id = $1 AND receiver_id = $2
            RETURNING *;
        `;
        
        const result = await pool.query(query, [senderId, receiverId]);

        // Handle cases where no friendship record existed
        if (result.rowCount === 0) {
            return res.status(444).json({ error: "Friendship relationship not found." });
        }

        // Success Response
        return res.status(200).json({
            message: "Friend request deleted successfully.",
            friendship: result.rows[0]
        });

    } catch (error) {
        console.error("Delete friend request error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for getting user's friendship list
router.get('/user/friends', checkSession,  async (req, res) => {
  try {
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
  }

    const userId = req.user.id;
    const query = "SELECT * FROM friendships WHERE (sender_id = $1 OR receiver_id = $1)"

    const result = await pool.query(query, [userId]);

     return res.status(200).json({
            friendships: result.rows
        });

    } catch (error) {
        console.error("Fetch friendship list error:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

//api for getting mutual friends 
router.get('/mutual/:targetUserId', checkSession, async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
}
      
        const currentUserId = req.user.id; // User A (UUID string)
        const targetUserId = req.params.targetUserId; // User B (UUID string)

        if (currentUserId === targetUserId) {
            return res.status(400).json({ error: "You cannot have mutual friends with yourself." });
        }

        const query = `
            WITH user_a_friends AS (
                SELECT CASE WHEN sender_id = $1 THEN receiver_id ELSE sender_id END AS friend_id
                FROM friendships WHERE $1 IN (sender_id, receiver_id) AND status = 'accepted'
            ),
            user_b_friends AS (
                SELECT CASE WHEN sender_id = $2 THEN receiver_id ELSE sender_id END AS friend_id
                FROM friendships WHERE $2 IN (sender_id, receiver_id) AND status = 'accepted'
            )
            SELECT u.id AS friend_id, u.username, u.profile_picture
            FROM user_a_friends a
            JOIN user_b_friends b ON a.friend_id = b.friend_id
            JOIN users u ON u.id = a.friend_id;
        `;

        const result = await pool.query(query, [currentUserId, targetUserId]);

        return res.status(200).json({
            success: true,
            count: result.rowCount,
            mutualFriends: result.rows
        });

    } catch (error) {
        console.error("Error fetching mutual friends:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

router.get('/friends/details', checkSession, async (req, res) => {
    try {
      if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized, please log in"});
}
      
    const currentUserId = req.user.id;
    const frQuery = "SELECT * FROM friendships WHERE (sender_id = $1 OR receiver_id = $1) AND status = $2";
    const findFriends = await pool.query(frQuery, [currentUserId, "accepted"]);
    if(findFriends.rows.length === 0){
      return res.status(404).json({ error: "No friend found!" });
    }
    const friendships = findFriends.rows;
      
    for(let f=0; f < friendships.length; f++){
     const friend = getFriendDetails(friendships[f], currentUserId);
    friendships[f].friend_id = friend.id;
    friendships[f].friend_username = friend.username;
    friendships[f].friend_profile_picture = friend.profile_picture;
    friendships[f].friend_is_active = friend.is_active;
    friendships[f].friend_is_verified = friend.is_verified;
    }
      return res.status(200).json({
            friendships: friendships
        });
      
      
    }catch(err){
      console.error("Error fetching friends details:", err);
        return res.status(500).json({ error: "Internal server error." });
    }
});

export default router;
  
