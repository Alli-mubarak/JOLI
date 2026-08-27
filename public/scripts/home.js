const postsContainer = document.getElementById("posts");
const imagesOnPage = document.querySelectorAll('img');

function loadDefaultImage(){ 
imagesOnPage.forEach(img => {
    img.addEventListener('error', function handleError() {
      // Set the fallback image
      this.src = '/images/default-user.png';
      
      // Remove the listener so it doesn't loop if the default image fails
      this.removeEventListener('error', handleError);
    });
  });
}

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
                         <img src="${post.author_profile_pic || null}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="#" class="author-link">
                              <p class="author-username">${post.author_username || null}</p>
                          </a>
                          <small>${post.created_at}</small>
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

setTimeout(() =>{
fetchPosts()
},6000);

