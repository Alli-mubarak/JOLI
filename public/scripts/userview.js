const userDetails = document.getElementById("user-details");
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
const postMenuContainer = document.getElementById("post-menu-container");
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
  try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch(`/api/friendship/mutual/${uid}`, { credentials: 'include' });
        data = await response.json();
 
        
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

if(postCards.length > 0) linkifyPosts();

