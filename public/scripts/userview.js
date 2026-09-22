const userDetails = document.getElementById("user-details");
const userAction = document.getElementById("user-action");
const userMenu = document.getElementById("u-menu");
const postCards = document.querySelectorAll(".postCard");
const mutuals = document.querySelector(".m-count");
let currentUserId;
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
const userMenuContainer = document.getElementById("user-menu-container");
const postMenuCloser = document.getElementById("p-closer-space");
const commentsBox = document.getElementById("comments");
const postMenu = document.getElementById("post-menu");
let pmCloserBtn = document.getElementById("p-closer-btn");
const postMenuCtrl = document.querySelector(".post-menu");
let isAuthorised = false;
let scrollPosition = 0;

  let imgArray;
  let currIndex;
  let inViewMode = false;
  let userPic;
  let userName;

if(userAction.textContent.trim() === "Unfriend") {
  userAction.style.background = "pink";
}else if(userAction.textContent.trim() === "Pending") {
  userAction.style.background = "yellow";
}

async function checkAuthStatus() {
      try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch("/api/auth/user", { credentials: 'include' });
        const data = await response.json();
 
        
        if (data.loggedIn) {
          isAuthorised = true;
          currentUserId = data.user.id;
          userPic = data.user.profile_picture;
          userName = data.user.username;
        } else {
          isAuthorised = false;
          currentUserId = "";
          userPic = "";
          userName = "";
        }
       const uid = userDetails.getAttribute("data-user");
        getMutuals(uid);
      
      } catch (err) {
        console.error("Error verifying authentication status:", err);
      }
}
checkAuthStatus();

async function getMutuals(uid){
  if(!isAuthorised)return;
  if(uid === currentUserId)return;
  mutuals.innerHTML = "<i class='fa-solid fa-circle-notch roll'></i>";
  try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch(`/api/friendship/mutual/${uid}`, { credentials: 'include' });
        data = await response.json();
 
        mutuals.innerHTML = '';
        if (data.count > 0) {
          mutuals.textContent = `${data.count} mutuals`;
          return 
        } else {
          mutuals.textContent = 'No mutuals';
          
        }
      } catch (err) {
        console.error("Error verifying authentication status:", err);
  }
}
function enableScrolling(){
  document.body.style.position = 'relative';
  document.body.style.top = '';
  document.body.style.width = '';
  window.scrollTo(0, scrollPosition);
}

function disableScrolling(){
  scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
  document.body.style.position = 'fixed';
  document.body.style.top = `-${scrollPosition}px`;
  document.body.style.width = '100%';
}

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

function linkifyPosts(){
  try{
  pContents = document.querySelectorAll(".post-content");
  Array.from(pContents).forEach(pc => {
    pc.innerHTML = linkify(pc.textContent);
  });
  }catch(err){console.error(err)}
}

// post content linkifier
if(postCards.length > 0) linkifyPosts();

// user menu 
userMenu.onclick = () =>{
  try{
  const uid = userDetails.getAttribute("data-user");
  const username = document.getElementById("u-name").textContent;
    console.log(uid, username);
  const htmlElements = `
  <i class="fa-solid fa-xmark" id="u-closer-btn"></i>
  ${currentUserId !== uid? `<button id="send-message-btn"><i class="fa-regular fa-message"></i>Send ${username.trim()} a message</button>` : ""}
   ${currentUserId !== uid? `<button id="block-btn"><i class="fa-solid fa-user-slash"></i>Block ${username.trim()} </button>` : ""}
   ${currentUserId === uid? `<button id="contact-btn"><i class="fa-solid fa-envelope"></i> Contact <b>JOLI</b></button>` : ""}
    ${currentUserId === uid? `<button id="delete-acc-btn"><i class="fa-solid fa-trash"></i> Delete My Account</button>` : ""}
    
  `;
    postMenu.innerHTML = htmlElements;
    pmCloserBtn = document.getElementById("u-closer-btn");
    const delBtn = postMenu.querySelector("#delete-acc-btn");
    
    if(delBtn){
      delBtn.onclick = () =>{
     if(confirm("Are you sure you want to delete your account?")){
     //  deletePost(postId);
       alert("feature coming soon!");
      }
        postMenuCloser.style.background = "transparent";
    
     setTimeout(() =>{
      userMenuContainer.style.bottom = "-100vh";
      },200);
     enableScrolling();
      }
      }
    
    pmCloserBtn.onclick = () =>{
    postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
    
     setTimeout(() =>{
      userMenuContainer.style.bottom = "-100vh";
      },200);
     enableScrolling();
      }
    
      userMenuContainer.style.bottom = 0;
      setTimeout(() =>{
      postMenuCloser.style.background = "rgba(0,0,0,0.2)";
      },300);
   disableScrolling();
  }catch(error){
    console.error(error);
  }  
}

  postMenuCloser.onclick = () =>{
      postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      userMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
  }

//media viewer
function viewImage(e){
   try{
   inViewMode = true;
    const img = e.target;
    const src = img.src;
    imgArray = Array.from(img.parentElement.querySelectorAll("img"));
   disableScrolling();
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
       enableScrolling();
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

//allow images view
const allImages = document.querySelectorAll("img");
Array.from(allImages).forEach(i => {
  i.onclick = (e) => {viewImage(e)}
})

function viewPostMenu(e){
  try{
  const uid = userDetails.getAttribute("data-user");
  const username = document.getElementById("u-name").textContent;
  const post = e.currentTarget.parentElement.parentElement;
  
  alert(post.id);
  
  const htmlElements = `
  <i class="fa-solid fa-xmark" id="u-closer-btn"></i>
  <button id="send-message-btn"><i class="fa-solid fa-arrow-up-right-from-square"></i>View post</button>
   ${currentUserId !== uid? `<button id="block-btn"><i class="fa-solid fa-plus"></i>Save post </button>` : ""}
   ${currentUserId === uid? `<button id="contact-btn"><i class="fa-solid fa-fa-thumbtack"></i>Pin post</button>` : ""}
    ${currentUserId === uid? `<button id="delete-post-btn"><i class="fa-solid fa-trash"></i> Delete Post</button>` : ""}
    
  `;
    postMenu.innerHTML = htmlElements;
    pmCloserBtn = document.getElementById("u-closer-btn");
    const delBtn = postMenu.querySelector("#delete-post-btn");
    
    if(delBtn){
      delBtn.onclick = () =>{
     if(confirm("Are you sure you want to delete your account?")){
     //  deletePost(postId);
       alert("feature coming soon!");
      }
        postMenuCloser.style.background = "transparent";
    
     setTimeout(() =>{
      userMenuContainer.style.bottom = "-100vh";
      },200);
     enableScrolling();
      }
      }
    
    pmCloserBtn.onclick = () =>{
    postMenuCloser.style.background = "transparent";
     document.body.classList.remove('no-scroll'); 
    
     setTimeout(() =>{
      userMenuContainer.style.bottom = "-100vh";
      },200);
     enableScrolling();
      }
    
      userMenuContainer.style.bottom = 0;
      setTimeout(() =>{
      postMenuCloser.style.background = "rgba(0,0,0,0.2)";
      },300);
   disableScrolling();
  }catch(error){
    console.error(error);
  }  
}

const postMenus = document.querySelectorAll(".post-menu");
Array.from(postMenus).forEach(pm => {
  pm.onclick = (e) => {viewPostMenu(e)}
})

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
          return 
        }
          console.log(response);
    postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
     //remove in the UI
    postsContainer.removeChild(currPost);
    notify("post deleted!");
  }
  catch(err){
    notify("Post delete failed!", "error");
    currPost.style.background = "#fff";
    console.error(err);
  }
            }
