async function run(){
const searchForm = document.getElementById("search-form");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");
const searchResult= document.getElementById("s-result");
const searchHeader = document.getElementById("s-header");
const usersContainer = document.getElementById("u-container");
const postsContainer = document.getElementById("p-container");

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    if (url.length > 50){
      url = url.slice(0,50)+"...";
    }
    return `<a class="c-link" href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

searchForm.onsubmit = async(e) => {
  try{
  e.preventDefault();
  usersContainer.innerHTML = "";
  postsContainer.innerHTML = "";
  const query = searchInput.value.trim();
  if(query.length < 1) return;
  const response = await fetch(`/api/search?q=${query}`);
  const data = await response.json();
  if(response.ok){
    if(data.users.length > 1) {
      searchHeader.textContent = "Here are your search results";
     alert(data.users)
      data.users.forEach(u => {displayUser(u)});
    }
    if(data.posts.length > 1) {
      searchHeader.textContent = "Here are your search results";
     
      data.posts.forEach(p => {displayPost(p)});
    }
    if(data.posts.length < 1 && data.users.length < 1){
      searchHeader.textContent = "Nothing matches your search, try searching for another thing";
      return;
    }
  }else{
    notify("error fetching search", "error");
  }
    

    }catch(err){
    notify("network error occurred!", "error");
    console.error(err);
    }
}

function displayUser(user){
try{
 
const userCard = `
<div class="user" data-url="/user/${user.username}">
    <div class="pp-box">
       <img src=${user.profile_picture || "/images/default-user.png"} class="user-pic" alt="user picture" />
    </div>
    <div class="user-details">
       <button class="add-friend-btn" data-type="add-user" data-id=${user.id}><i class="fa-solid fa-plus add-loader"></i> Add </button>
       <div class="username-bio">
          <p class="username">${user.username}</p>
          <small class="bio">${user.bio || "Happy to be here on JOLI"}</small>
       </div>
     </div>
 </div>
    `;
      
usersContainer.innerHTML += userCard;
}catch(e){
      console.error(e);
  notify("error display users", "error");
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
                     <a href="/user/${post.author_username}" id="author-image" data-id=${post.user_id}>
                         <img src="${post.author_profile_picture || 'images/default-user.png'}" loading="lazy" id="author-pic" alt="author profile picture" />
                     </a>
                     </div>
                     <div class="username-posttime">
                          <a href="/user/${post.author_username}" class="author-link">
                              <p class="author-username">${post.author_username || null}</p>
                          </a>
                          <small>${getReqTime(post.created_at)}</small>
                     </div>
            </div> 
            <div class="post-menu" data-type="post-menu">
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
                ${post.comments.length > 0? `<span class="comment-count">${post.comments.length}</span>` : "<span class='comment-count'></span>"}
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

function sortImages(images){
      let result = "";
      images.forEach(imgLink=>{
             result += `<img src=${imgLink} loading="lazy" class="grid-item" alt="post image"/>`
       });
return result;
}
        }

setTimeout(()=>{
  try{
    run()
    alert('loaded');
  }
  catch(err){
    console.error(err)
  }
},1000);

alert('loading');
