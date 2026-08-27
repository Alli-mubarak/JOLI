const postsContainer = document.getElementById("posts");


async function fetchPosts() {
      try {
        
        const response = await fetch("/api/getPosts" );
        const data = await response.json();
 
        const posts = data.posts
      postsContainer.innerHTML = '';
            
      for (let i=posts.length-1; i >=0; i--){
             await displayPost(posts[i]);
            
            // setTimeout(()=>{loadDefaultImage()},2000);
       }
      } catch (err) {
       notify("Error fetching posts", "error");
        console.error("Error fetching posts:", err);
      }
}

async function displayPost(post){
try{
 const postImages = post.media_urls
let imgs = "";
 if(postImages.length > 0){
imgs = await sortImages(postImages);
 }
const postCard = `
<div class="postCard">
        <div class="post-header" dataset="/post/${post.id}">
            <div class="author-details">
                <div class="author-image">
                     <a href="/user/${post.user_id}" id="author-image">
                         <img src="${post.author_profile_pic || 'images/default-user.png'}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="/user/${post.user_id}" class="author-link">
                              <p class="author-username">${post.author_username || null}</p>
                          </a>
                          <small>${getPostTime(post.created_at)}</small>
                     </div>
            </div> 
            <div class="post-menu">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
        <div class="post">
            <p class="post-content">${post.content}</p>
            <div class="post-images">
                ${imgs}
            </div>
        </div>
        <div class="interactions">
            <div class="post-likes">
                <button>
                <i class="fa-regular fa-heart"></i>
                </button>
                    <span class="like-count"></span>
            </div>
              <div class="comments">
                <button>
                <i class="fa-regular fa-comment"></i>
                </button>
                    <span class="comment-count"></span>
            </div>
              <div class="shares">
                <button>
                <i class="fa-solid fa-share"></i>
                </button>
                    <span class="shares-count"></span>
            </div>
        </div>
       
    </div>
`
console.log(post);

      
postsContainer.innerHTML += postCard;
}catch(e){
      console.error(e);
}

}

function getPostTime(postTime){
const targetDate = new Date(postTime);
const currentDate = new Date();

const msDifference = currentDate - targetDate;
const sDifference = msDifference / 1000;
const mDifference = msDifference / (1000 * 60);
const hDifference = msDifference / (1000 * 60 * 60);
const dDifference = msDifference / (1000 * 60 * 60 * 24);
const mtDifference = msDifference / (1000 * 60 * 60 * 24 * 12);

if(mtDifference > 1){
return `${Math.floor(mtDifference)}M`; 
}else if (dDifference > 1){
return `${Math.floor(dDifference)}d`;
}else if (hDifference > 1){
return `${Math.floor(hDifference)}h`;
}else if (mDifference > 1){
return `${Math.floor(mDifference)}m`;
}else {
return `${Math.floor(sDifference)}s`;
}

}

function sortImages(images){
      let result = "";
      images.forEach(imgLink=>{
             result += `<img src=${imgLink} loading="lazy" alt="post image"/>`
       });
return result;
}

//setTimeout(() =>{
fetchPosts()
//},4000);

