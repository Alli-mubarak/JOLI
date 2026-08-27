const postsContainer = document.getElementById("posts");


async function fetchPosts() {
      postsContainer.innerHTML = `<pre>Fetching posts....</pre>`;
      try {
        
        const response = await fetch("/api/getPosts" );
        const data = await response.json();
 
        const posts = data.posts
       posts.forEach((post) => {
             displayPost(post)
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
                         <img src="${post.author_profile_pic || null}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="#" class="author-link">
                              <p class="author-username">${post.author_username || null}</p>
                          </a>
                          <small>${post.createdAt}</small>
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

      
document.body.appendChild(postCard);

}

setTimeout(() =>{
fetchPosts()
},6000);

