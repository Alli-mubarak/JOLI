import express from 'express'; 
import geoip from "geoip-lite";
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

router.post('/request', checkSession, async (req, res) => {
  try{
    if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    const senderId = req.user.id; 
    const { receiverId } = req.body;
    
    if (!receiverId) {
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
                return res.status(444).json({ error: "Friend request not found." });
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

export default router;
  
