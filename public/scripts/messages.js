
const scContainer = document.getElementById("s-c-container");
const fContainer = document.getElementById("f-container");
const sfForm = document.getElementById("s-f-form");
const sfInput = document.getElementById("s-f-input");
const sfBtn = document.getElementById("s-f-btn");
const mediaViewer = document.getElementById("media-viewer");
const mediaViewerCloser = document.getElementById("mv-closer");
const moveLeft = document.getElementById("mv-left");
const moveRight = document.getElementById("mv-right");
const viewer = document.getElementById("viewer");
const mediaCounter = document.getElementById("media-counter");
const imageBox = document.getElementById("image-view");
const userMenuContainer = document.getElementById("user-menu-container");
const postMenuCloser = document.getElementById("p-closer-space");
const postMenu = document.getElementById("post-menu");
let pmCloserBtn = document.getElementById("p-closer-btn");
const postMenuCtrl = document.querySelector(".post-menu");

  let imgArray, currIndex, show_friends;
  let inViewMode = false;
  
const smBtn = document.getElementById("start-message-btn");

function performHighlight(keyword) {
  const query = keyword.trim();
  const targets = document.querySelectorAll('.f-username');

// 2. Cache the pristine initial text of each parent so we can reset cleanly
const originalTexts = Array.from(targets).map(el => el.textContent);

// 3. Main highlight handler
  // Reset all elements back to original clean text if query is empty
  if (!query) {
    targets.forEach((el, index) => {
      el.textContent = originalTexts[index];
      el.initialText = originalTexts[index];
    });
    return;
  }

  // Escape special regex characters (like ?, *, +) to avoid syntax errors
  const escapedQuery = query.replace(/[-\/\\^\$*+?.()|[\]{}]/g, '\\$&');
  const regex = new RegExp(`(${escapedQuery})`, 'gi');

  // Process each individual parent container separately
  targets.forEach((el, index) => {
    const rawText = originalTexts[index];

    // Check if the query exists in this specific parent text
    if (regex.test(rawText)) {
      // Safely replace text matches with a structured <mark> element
      // Using .innerHTML here is safe ONLY because we are pulling from pure text (.textContent cache)
      el.innerHTML = rawText.replace(regex, '<mark class="f-match">\$1</mark>');
    } else {
      // If no match found, ensure it remains/resets to plain un-highlighted text
      el.textContent = rawText;
    }
  });
    }

async function getFriends(){
  if(!isAuthorised) return;
  
  try {
        const response = await fetch('/api/friendship/friends/details');
        if (response.ok) {
          const data = await response.json();
          friendships = data.friendships
          if(friendships.length < 1){
            fContainer.innerHTML = `<p>You currently have no friends, add friends  or accept friends request if available</p>`;
           return 
          }
          try{
          friendships.sort((a, b) => a.friend_username.localeCompare(b.friend_username));
          friendships.forEach(f =>{
            showFriend(f);
          });
          }catch(err){
            console.error(err);
          }
        } else {
          notify("error fetching friends", "error");
          return 
        }
      } catch (err) {
        console.error("Error fetching friends :", err);
       notify("error occurred while fetching friends", "error");
    alert("server error");
  }
}

smBtn.onclick = (e) =>{
  const btn = e.currentTarget;
  if(!show_friends){
  btn.innerHTML = `<div class="plus"></div> <div class="plus"></div>`
  btn.style.scale = "2";
  btn.style.transform = "rotate(45deg)";
  show_friends = true;
  scContainer.classList.remove("hidden");
    disableScrolling();
  }else{
  scContainer.classList.add("hidden");
  btn.style.transform = "rotate(0deg)";
  btn.style.scale = "1";
  setTimeout(()=>{
    btn.innerHTML = `
    <div class="plus"></div>
     <div class="plus"></div>
    <i class="fa-regular fa-message"></i>
    `;
    },200);
    show_friends = false;
    enableScrolling();
  }
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

function showFriend(f){
  try{
  const htmlEl = `
  <div class="friend" id=${f.friend_id}>
  <div class="name-pic">
   <img src=${f.friend_profile_picture || '/images/default-user.png'} alt="friend picture" loading="lazy"/>
   <p class="f-username">${f.friend_username}</p>
   </div>
   ${f.friend_is_active? `<div class="online stat"></div>` : `<div class="online stat"></div>`}
  </div>
  `;
  fContainer.innerHTML += htmlEl;
  }catch(err){
    console.error(err);
    notify("error displaying friends", "error");
  }
}

sfInput.oninput = async() => {
  if(sfInput.value.length < 1) {
    sfBtn.disabled = true;
    const frs = document.querySelectorAll(".friend");
  if(frs.length < 1) return;
  const frenss = await Array.from(frs);
  await frenss.forEach(f => {
    f.classList.remove("hidden");
    f.innerHTML = f.initialText;
  });
  
    return;
  }
  sfBtn.disabled = false;
  showSearchedFriend(sfInput.value)
  
}

sfForm.onsubmit = async(e) => {
  e.preventDefault();
  showSearchedFriend(sfInput.value)
}

async function showSearchedFriend(keyword){
  if(sfInput.value.length < 1) return;
  const friends = document.querySelectorAll(".friend");
  if(friends.length < 1) return;
  const frens = await Array.from(friends);
  await frens.forEach(f => {f.classList.remove("hidden")});
  frens.forEach(f => {
    const fUsername = f.querySelector(".f-username").textContent.trim();
    if(!fUsername.includes(keyword.toLowerCase())) f.classList.add("hidden");
  });
  performHighlight(keyword)
}

