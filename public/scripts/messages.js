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
  let userPic, userName;

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
      
        getFriends();
      
      } catch (err) {
        console.error("Error verifying authentication status:", err);
      }
}
checkAuthStatus();

async function getFriends(){
  if(!isAuthorised)return;
  
  try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch('/api/friendship/friends/details');
  
        if (response.ok) {
          const data = await response.json();
          const friendships = data.friendships
          alert(friendships);
          console.log(friendships);
          return 
        } else {
          notify("error fetching friends", "error")
          return 
        }
      } catch (err) {
        console.error("Error fetching friends :", err);
       notify("error occurred while fetching friends", "error");
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
    

//window.onload = function() {}
  
  
   async function run(){
const socket = io("https://joli-indol.vercel.app");
  
// ❌ 1. Initial connection failed (e.g., Server is down or CORS blocked)
socket.on("connect_error", (error) => {
  console.error("❌ Connection failed:", error.message);
  updateChatStatusUI("Offline - Retrying connection...");
  alert("failed to connect");
});

// 🚪 2. Sudden disconnection (e.g., Wifi dropped or server restarted)
socket.on("disconnect", (reason) => {
  console.warn("⚠️ Disconnected from server. Reason:", reason);
  updateChatStatusUI("Offline");
  alert("disconnected");

  // If the server explicitly disconnected the socket, you must reconnect manually
  if (reason === "io server disconnect") {
    socket.connect();
  }
});

// 🔄 3. Reconnected successfully after being offline
socket.on("reconnect", (attemptNumber) => {
  console.log(`✅ Reconnected successfully on attempt #${attemptNumber}`);
  updateChatStatusUI("Online");
  alert("reconnected");

  // CRITICAL: You must re-register the user so the backend re-links your new socket ID
  socket.emit("register_user", currentUserId);
});

// 🚫 4. Custom backend business logic error (e.g., PostgreSQL failed to save message)
socket.on("message_error", (errorData) => {
  console.error("🚫 Server-side error:", errorData.error);
  alert(`Message failed: ${errorData.error}`);
});
  
// Helper function to update a text element or status bar in your UI
function updateChatStatusUI(statusText) {
  const statusEl = document.getElementById("chat-status");
  if (statusEl) {
    statusEl.textContent = statusText;
    // Optional styling based on status
    statusEl.style.color = statusText.includes("Online") ? "green" : "red";
  }
}

    // 2. Pretend this is your logged-in User ID (e.g., loaded from a login cookie or local storage)
    const currentUserId = 1; 
    const friendId = 2; // The friend you want to message

    // DOM Elements
    const chatBox = document.getElementById('chat-box');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');


    // 3. Register your user session on connection
    socket.on("connect", () => {
      console.log("Connected to server! ID:", socket.id);
      alert("connected!");
      updateChatStatusUI("Online");
      socket.emit("register_user", currentUserId);
    });

    // 4. Listen for incoming live messages
    socket.on("receive_message", (message) => {
      displayMessage(message.content, 'received');
      alert("connected!");
    });

    // 5. Listen for confirmation that your message was sent successfully
    socket.on("message_sent", (message) => {
      displayMessage(message.content, 'sent');
      messageInput.value = ''; // Clear input field
    });

    // 6. Handle error messages from the backend
    socket.on("message_error", (errorData) => {
      alert(errorData.error);
    });
  
    // 7. Event Listener for clicking the Send button
    sendBtn.addEventListener('click', () => {
      const text = messageInput.value.trim();
      if (!text) return;

      // Emit event matching your Node.js backend
      socket.emit("send_message", {
        sender_id: currentUserId,
        receiver_id: friendId,
        content: text
      });
    });

    // Helper function to update the chat UI
    function displayMessage(text, type) {
      const msgDiv = document.createElement('div');
      msgDiv.classList.add('message');
      
      // Basic formatting to differentiate who sent what
      if (type === 'sent') {
        msgDiv.innerHTML = `<strong>You:</strong> ${text}`;
      } else {
        msgDiv.innerHTML = `<strong>Friend:</strong> ${text}`;
      }
      
      chatBox.appendChild(msgDiv);
      chatBox.scrollTop = chatBox.scrollHeight; // Auto-scroll to the bottom
    }
    }




    
setTimeout(()=>{
  try{
    run();
  }
  catch(err){
    console.error(err)
  }
},5000);



alert("loading page!");

