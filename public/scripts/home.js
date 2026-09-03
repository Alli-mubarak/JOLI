
  const postsContainer = document.getElementById("posts");
const mediaViewer = document.getElementById("media-viewer");
  const mediaViewerCloser = document.getElementById("mv-closer");
  const moveLeft = document.getElementById("mv-left");
  const moveRight = document.getElementById("mv-right");
  const viewer = document.getElementById("viewer");
  const mediaCounter = document.getElementById("media-counter");
  const imageBox = document.getElementById("image-view");
  let imgArray;
  let currIndex;
  let inViewMode = false;

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}
    
async function fetchPosts() {
      try {
        
        const response = await fetch("/api/getPosts" );
        const data = await response.json();
 
        const posts = data.posts;
      postsContainer.innerHTML = '';
            
      for (let i=0; i < posts.length; i++){
             await displayPost(posts[i]);
            
            // setTimeout(()=>{loadDefaultImage()},2000);
       }
        allowPostView();
        return;
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
<div class="postCard" data-url="/post/${post.id}" id=${post.id}>
        <div class="post-header">
            <div class="author-details">
                <div class="author-image">
                     <a href="/user/${post.user_id}" id="author-image">
                         <img src="${post.author_profile_picture || 'images/default-user.png'}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="/user/${post.user_id}" class="author-link">
                              <p class="author-username">${post.author_username || null}</p>
                          </a>
                          <small>${getPostTime(post.created_at)}</small>
                     </div>
            </div> 
            <div class="post-menu" data-type="menu">
                <div></div>
                <div></div>
                <div></div>
            </div>
        </div>
        <div class="post">
            <p class="post-content">${linkify(post.content)}</p>
            <div class="post-images">
                ${imgs}
            </div>
        </div>
        <div class="interactions">
            <div class="post-likes" data-type="likes">
                <button data-type="like" class="like-btn">
                ${post.likeStatus? '<i class="fa-solid fa-heart like-icon" style="color:#2bff43;"></i>' : '<i class="fa-regular fa-heart like-icon" style="color:#222;"></i>'}
                
                </button>
                ${post.like_count? `<span class="like-count">${post.like_count}</span>` : "<span class='like-count'></span>"}
                    
            </div>
              <div class="comments" data-type="comments">
                <button data-type="comment" class="comment-btn">
                <i class="fa-regular fa-comment"></i>
                </button>
                    <span class="comment-count"></span>
            </div>
              <div class="shares" data-type="shares">
                <button data-type="share" class="share-btn">
                <i class="fa-solid fa-share"></i>
                </button>
                    <span class="shares-count"></span>
            </div>
        </div>
       
    </div>
    `;
      
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
             result += `<img src=${imgLink} loading="lazy" class="grid-item" alt="post image"/>`
       });
return result;
}

function allowPostView(){
try{
 const everyPosts = document.querySelectorAll(".postCard");
everyPosts.forEach((post, index) => {
      post.onclick = (e) => {viewPost(e)};
});
}catch(e){
      console.error(e);
}
}


function viewPost(e){
try{
      
      if(e.target.getAttribute('data-type') !== null || e.target.parentElement.getAttribute('data-type') !== null){
        if(e.target.getAttribute('data-type') === "like" || e.target.parentElement.getAttribute('data-type') === "like"){
          likePost(e);
        }
        
        return;
      }
      if(e.target.getAttribute('href') && e.target.getAttribute('href') !== null) return;
      if(e.target.src && e.target.src !== null){
      if(e.target.getAttribute("class") === "grid-item"){
      viewPostImage(e);
      return;
      }
        return;
      } 
     let currentPostCard = e.currentTarget
      const targetUrl = currentPostCard.getAttribute('data-url');
      currentPostCard.style.background = "var(--touch-color)";
    
    if (targetUrl) {
      setTimeout(() =>{
      currentPostCard.style.background = "#fff";
      window.location.href = targetUrl; 
      },100);
      }
     
}catch(e){
      console.error(e);
}
}

function viewPostImage(e){
   try{
   inViewMode = true;
    const img = e.target;
    const src = img.src
    imgArray = Array.from(img.parentElement.children);
   
   const index = imgArray.indexOf(img);
   currIndex = index;
     if(imgArray.length > 1){
         imgArray.forEach((c) =>{
             mediaCounter.innerHTML += `<div></div>`
         });
         mediaCounter.children[index].style.background = "#fff";
         
     }
         imageBox.src = src;
         if(index === 0){
             moveLeft.classList.add("hidden");
         }
         if(index === imgArray.length -1){
             moveRight.classList.add("hidden");
         }
     
        mediaViewer.classList.remove("hidden");
      
      
       }catch(e){
           console.error(e);
       }     
        }
        
    mediaViewerCloser.onclick = (e) =>{
    try{
        mediaViewer.classList.add("hidden");
        mediaCounter.innerHTML = "";
        inViewMode = false;
        moveLeft.classList.remove("hidden");
        moveRight.classList.remove("hidden");
        imgArray = "";
       }catch(e){
           console.error(e);
       }
    }
    
    moveRight.onclick = () =>{
    try{
        if(inViewMode){
        if(currIndex  < imgArray.length - 1){
         
        imageBox.src = imgArray[currIndex + 1].src;
       const mcArray = Array.from(mediaCounter.children);
       mcArray.forEach(c=>{
           c.style.background = "transparent";
       })
       mediaCounter.children[currIndex + 1].style.background = "#fff";
       
       moveLeft.classList.remove("hidden");
       
       
       if(currIndex+2 === imgArray.length){
             moveRight.classList.add("hidden");   
         }
         currIndex += 1;
       }else{
           moveRight.classList.add("hidden");   
       }
        }
     }catch(e){
           console.error(e);
       }
    }
    
    moveLeft.onclick = () =>{
    try{
        if(inViewMode){
        if(currIndex  !== 0){
         
        imageBox.src = imgArray[currIndex - 1].src;
       const mcArray = Array.from(mediaCounter.children);
       mcArray.forEach(c=>{
           c.style.background = "transparent";
       })
       mediaCounter.children[currIndex - 1].style.background = "#fff";
       
       moveRight.classList.remove("hidden");
       
      
       if(currIndex === 1){
             moveLeft.classList.add("hidden");   
         }
        currIndex -= 1;
       }else{
           moveLeft.classList.add("hidden");   
       }
        }
     }catch(e){
           console.error(e);
       }
    }
    async function likePost(e){
      try{
        alert(isAuthorised);
      const postId = e.currentTarget.id;
      const likeContainer = e.currentTarget.querySelector(".like-count");
      const likeIcon = e.currentTarget.querySelector(".like-icon");
        try {
        //make it show liked status
          likeIcon.classList.remove("fa-regular");
          likeIcon.style.color = "#2bff43";
          likeIcon.classList.add("fa-solid");
          
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          console.error(response);
          likeIcon.classList.remove("fa-solid");
          likeIcon.style.color = "#222";
          likeIcon.classList.add("fa-regular");
          notify("like failed!", "error");
          return 
        }
          console.log(response);
        
        const data = await response.json();
        const postLikes = data.likesCount

        
        if(postLikes > 0){
        likeContainer.textContent = postLikes;
        }else{
          likeContainer.textContent = '';
        }
       // if (data.action === 'inserted') {}
         if (data.action === 'deleted') {
          likeIcon.classList.remove("fa-solid");
          likeIcon.style.color = "#222";
          likeIcon.classList.add("fa-regular");
        }

    } catch (error) {
        console.error('Like toggle failed:', error);
        likeIcon.classList.remove("fa-solid");
          likeIcon.style.color = "#222";
          likeIcon.classList.add("fa-regular");
        notify("like failed!", "error");
        
    } 

      }catch(e){
        notify("like failed!", "error");
        likeIcon.classList.remove("fa-solid");
          likeIcon.style.color = "#222";
          likeIcon.classList.add("fa-regular");
        console.error(e);
      }
    }

//setTimeout(() =>{
fetchPosts()
//},4000);
