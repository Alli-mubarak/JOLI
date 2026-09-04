async function loadScript(){
  try{

let currentUserId;
const postCard = document.querySelector(".postCard");
const postContent = document.querySelector(".post-content");
const likeBtn = document.getElementById("like-btn");
const commentBtn = document.getElementById("comment-btn");
const shareBtn = document.getElementById("share-btn");
const mediaViewer = document.getElementById("media-viewer");
const mediaViewerCloser = document.getElementById("mv-closer");
const moveLeft = document.getElementById("mv-left");
const moveRight = document.getElementById("mv-right");
const viewer = document.getElementById("viewer");
const mediaCounter = document.getElementById("media-counter");
const imageBox = document.getElementById("image-view");
const postImagesContainer = document.querySelector(".post-images");
const notifier = document.getElementById("notifier");
const nMessage = document.getElementById("n-message");
const nLink = document.getElementById("n-link");
const nCloser = document.getElementById("n-closer");
const postMenuContainer = document.getElementById("post-menu-container");
const postMenuCloser = document.getElementById("p-closer-space");
  const postMenu = document.getElementById("post-menu");
  let pmCloserBtn = document.getElementById("p-closer-btn");
const postMenuCtrl = document.querySelector(".post-menu");
let isAuthorised = false;
let scrollPosition = 0;


  let imgArray;
  let currIndex;
  let inViewMode = false;

async function checkAuthStatus() {
      try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch("/api/auth/user", { credentials: 'include' });
        data = await response.json();
 
        
        if (data.loggedIn) {
          isAuthorised = true;
          currentUserId = data.user.id
        } else {
          isAuthorised = false;
          currentUserId = "";
        }
      } catch (err) {
        console.error("Error verifying authentication status:", err);
      }
}
checkAuthStatus();

  if (postImagesContainer && postImagesContainer.children.length > 0){
    imgArray = Array.from(postImagesContainer.children);
    imgArray.forEach(img=>{
      img.onclick = (e) =>{viewPostImage(e)}
    })
  }

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    if (url.length > 50){
      url = url.slice(0,50)+"...";
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

  

postContent.innerHTML = linkify(postContent.textContent);
let closeNID;
        
nCloser.onclick = () =>{
    notifier.classList.add("hidden");
    clearTimeout(closeNID);
 }

function notify(msg,mType = "success",linkText = null, link = null){
    nMessage.textContent = msg;
    if(mType === "error"){
        nMessage.style.color = 'red';
    }else{
      nMessage.style.color = '#111';
     }
            
    nLink.textContent = linkText;
     nLink.href = link;
    
    notifier.classList.remove("hidden");
            
    closeNID = setTimeout(()=>{
     notifier.classList.add("hidden");
    },4000)
}


async function likePost(){
      try{
      if(!isAuthorised){
        notify("please, log in first!", "error", "click here", "/");
        return;
      }
      const postId = postCard.id;
      const likeContainer = postCard.querySelector(".like-count");
      const likeIcon = postCard.querySelector(".like-icon");
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
likeBtn.onclick = () => {likePost()}

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

function viewPostMenu(){
  try{
  const postId = postCard.id;
  const authorUsername = document.querySelector(".author-username").innerHTML;
  const authorLink = document.querySelector("#author-image").href;
  const authorId = authorLink.split("user/")[1];
  const htmlElements = `
  <i class="fa-solid fa-xmark" id="p-closer-btn"></i>
  ${currentUserId !== authorId? `<button id="add-friend-btn"><i class="fa-solid fa-user-plus"></i>Add ${authorUsername.trim()} as friend</button>` : ""}
   ${currentUserId !== authorId? `<button id="view-user-btn"><i class="fa-solid fa-user"></i>View ${authorUsername.trim()}'s profile</button>` : ""}
    ${currentUserId === authorId? `<button id="delete-post-btn"><i class="fa-solid fa-trash"></i> Delete post</button>` : ""}
     <button id="share-post-btn"><i class="fa-solid fa-share"></i> Share post</button>
  `;
    postMenu.innerHTML = htmlElements;
    pmCloserBtn = document.getElementById("p-closer-btn");
    const delBtn = postMenu.querySelector("#delete-post-btn");
    if(delBtn){
      delBtn.onclick = () =>{
      if(confirm("Are you sure you want to delete this post?")){
       deletePost(postId);
      }
        postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
    
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   document.body.style.position = 'relative';
  document.body.style.top = '';
  document.body.style.width = '';
  
  window.scrollTo(0, scrollPosition);
      }
    }
    pmCloserBtn.onclick = () =>{
    postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
    
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   document.body.style.position = 'relative';
  document.body.style.top = '';
  document.body.style.width = '';
  
  window.scrollTo(0, scrollPosition);
      }
    
      postMenuContainer.style.bottom = 0;
      setTimeout(() =>{
      postMenuCloser.style.background = "rgba(0,0,0,0.2)";
      },300);
      scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  
  
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
  }catch(error){
    console.error(error);
  }
  }

  postMenuCtrl.onclick = () => {
    viewPostMenu();
  }

  postMenuCloser.onclick = () =>{
      
      postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   document.body.style.position = 'relative';
  document.body.style.top = '';
  document.body.style.width = '';
  
  window.scrollTo(0, scrollPosition);
  }
  
async function deletePost(postId){
  try{
    const currPost = document.getElementById(`${postId}`);
    currPost.style.background = "#ffeeee";
    
    const response = await fetch(`/post/${postId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
    
        if (!response.ok) {
          console.error(response);
          notify("post deletion failed!", "error");
          currPost.style.background = "#fff";
          return;
        }
          console.log(response);
    postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
    
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   document.body.style.position = 'relative';
  document.body.style.top = '';
  document.body.style.width = '';
  
  window.scrollTo(0, scrollPosition);
     //remove in the UI
    notify("post deleted!, redirecting........");
    setTimeout(()=>{
      alert("redirecting!");
    },3000)
  }
  catch(err){
    notify("Post delete failed!", "error");
    currPost.style.background = "#fff";
    console.error(err);
  }
    }

  }catch(err){
    console.error(err);
  }}
setTimeout(()=>{loadScript()},5000);
alert("loading!");
