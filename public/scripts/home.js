const postsContainer = document.getElementById("posts");


async function fetchPosts() {
      postsContainer.innerHTML = `<pre>Fetching posts....</pre>`;
      try {
        
        const response = await fetch("/api/getPosts" );
        const data = await response.json();
 
        const posts = data.posts
      postsContainer.innerHTML = '';
       posts.forEach((post) => { 
             displayPost(post);
             setTimeout(()=>{loadDefaultImage()},2000);
       })
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
}
function displayPost(post){
const postCard = `
<div class="postCard">
        <div class="post-header">
            <div class="author-details">
                <div class="author-image">
                     <a href="#" id="author-image">
                         <img src="${post.author_profile_pic || 'images/default-user.png'}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="#" class="author-link">
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
                <img src="/images/joli.png" loading="lazy" alt="post image"/>
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
return Math.floor(mtDifference) + "<bold>M</bold>"; 
}else if (dDifference > 1){
return Math.floor(dDifference) + "<bold>d</bold>";
}else if (hDifference > 1){
return Math.floor(hDifference) + "<bold>h</bold>";
}else if (mDifference > 1){
return Math.floor(mDifference) + "<bold>m</bold>";
}else {
return Math.floor(sDifference) + "<bold>s</bold>";
}

}

setTimeout(() =>{
fetchPosts()
},6000);

