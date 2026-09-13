import express from 'express'; 
import geoip from "geoip-lite";
import {pool} from '../../config/db.js'; 
import path from 'node:path';
const router = express.Router();
const __dirname = import.meta.dirname;
const __filename = fileURLToPath(import.meta.url);

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

//post author fetcher function 
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

//get post like status
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

router.route('/:id')
  .get(async (req, res) => {
  console.log('post fetched \n');
try{
    const postId = req.params.id;
    const postQuery= await pool.query('SELECT * FROM posts WHERE id = $1', [postId]);
  if (postQuery.rows.length === 0) {
    console.error('post not found!');
    return res.sendFile(path.join(__dirname, "../../", "/views/post-error.html"));
  }
  const postData = postQuery.rows[0];
let author = await  fetchAuthorDetails(postData.user_id);
  postData.author_username = author.username;
  postData.author_is_verified = author.is_verified;
  postData.author_is_active = author.is_active;
  postData.author_profile_picture = author.profile_pic;
  author = [];
  if(req.user && req.user.id){
    const likeStat = await getPostLikeStatus(postData.id, req.user.id);
    postData.likeStatus = likeStat
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
    const commentsResult = await pool.query(commentsQuery, [postData.id]);
    postData.comments = commentsResult.rows;
  
 res.render('post', { post: postData }); 
}catch(e){
  console.error('Error fetching post',e);
  return res.sendFile(path.join(__dirname, "../", "/views/post-error.html"));
}
})
 .delete(checkSession, async (req, res) => {
  try{
    console.log('post is about to be deleted \n');
    const postId = req.params.id;
    const userId = req.user.id; 
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You are not authorized"});
  }
    if (!userId || !postId) {
        return res.status(400).json({ error: 'Missing userId or postId' });
    }
    const deleteQuery = `
        DELETE FROM posts 
        WHERE id = $1 AND user_id = $2
        RETURNING id;
    `;

    
        const result = await pool.query(deleteQuery, [postId, userId]);
        if (result.rows.length === 0) {
            return res.status(403).json({ 
                error: 'Unauthorized or post not found. You can only delete your own posts.' 
            });
        }

        return res.status(200).json({ 
            success: true, 
            message: 'Post deleted successfully' 
        });

    } catch (error) {
        console.error('Error executing post deletion:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.route('/v1/getPosts')
  .get(async(req, res)=>{
console.log('posts fetched initially \n');
try{
const result = await pool.query('SELECT * FROM posts ORDER BY created_at DESC LIMIT 30');
const posts = result.rows
for(let i = 0; i < posts.length; i++){
  let author = await fetchAuthorDetails(posts[i].user_id);
  posts[i].author_username = author.username;
  posts[i].author_is_verified = author.is_verified;
  posts[i].author_is_active = author.is_active;
  posts[i].author_profile_picture = author.profile_pic;
  author = [];
  if(req.user && req.user.id){
    const likeStat = await getPostLikeStatus(posts[i].id, req.user.id);
    posts[i].likeStatus = likeStat
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
    const commentsResult = await pool.query(commentsQuery, [posts[i].id]);
    posts[i].comments = commentsResult.rows;
  
}
res.status(200).json({posts: posts});
}catch(e){
  console.error('Error fetching posts:', e);
  res.status(500).json({error: 'Internal Server Error'});
}
})
  .post(async(req, res)=>{
console.log('more posts fetched \n');
const {time} = req.body;
  console.log(time);
if(!time){
  return res.status(400).json({ error: 'a specific time is required' });
}
try{
const result = await pool.query(`SELECT * FROM posts WHERE created_at < '${time}'::timestamptz LIMIT 30`);
const posts = result.rows
if(posts.length < 1){
  return res.status(404).json({ message: 'No more posts to fetch' });
}
for(let i = 0; i < posts.length; i++){
  let author = await fetchAuthorDetails(posts[i].user_id);
  posts[i].author_username = author.username;
  posts[i].author_is_verified = author.is_verified;
  posts[i].author_is_active = author.is_active;
  posts[i].author_profile_picture = author.profile_pic;
  author = [];
  if(req.user && req.user.id){
    const likeStat = await getPostLikeStatus(posts[i].id, req.user.id);
    posts[i].likeStatus = likeStat
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
    const commentsResult = await pool.query(commentsQuery, [posts[i].id]);
    posts[i].comments = commentsResult.rows;
  
}
res.status(200).json({posts: posts});
}catch(e){
  console.error('Error fetching posts:', e);
  res.status(500).json({error: 'Internal Server Error'});
}
});

// post commenting api
router.post('/:id/comment',checkSession, async (req, res) => {
  try{
  const postId = req.params.id;
  const { content } = req.body;

  
  if (!req.isAuthenticated() && !req.user){
   return  res.status(400).json({error: "You must be logged in to comment!"});
  }

  const userId = req.user.id;

  // 2. Validation: Ensure the comment body has actual text
  if (!content || content.trim() === '') {
    return res.status(400).json({ message: "Comment content cannot be empty." });
  }

    const postCheck = await pool.query('SELECT id FROM posts WHERE id = $1', [postId]);
    if (postCheck.rows.length === 0) {
      return res.status(404).json({ message: "The post you are trying to comment on does not exist." });
    }

    // 4. Insert the comment and immediately JOIN with the users table to get the author's username
    const insertQuery = `
      WITH inserted_comment AS (
        INSERT INTO comments (post_id, user_id, content)
        VALUES ($1, $2, $3)
        RETURNING id, post_id, user_id, content, created_at
      )
      SELECT 
        ic.id AS comment_id,
        ic.post_id,
        ic.content,
        ic.created_at,
        ic.user_id AS commenter_id,
        u.username AS commenter,
        u.profile_picture AS commenter_pic               
      FROM inserted_comment ic
      JOIN users u ON ic.user_id = u.id;
    `;

    const result = await pool.query(insertQuery, [postId, userId, content.trim()]);
    return res.status(201).json({
      message: "Comment added successfully",
      comment: result.rows[0]
    });

  } catch (error) {
    console.error("Error occurred while adding comment:", error);
    return res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
