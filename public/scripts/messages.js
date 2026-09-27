const cPreviewContainer = document.querySelector(".messages");
const scContainer = document.getElementById("s-c-container");
const fContainer = document.getElementById("f-container");
const sfForm = document.getElementById("s-f-form");
const sfInput = document.getElementById("s-f-input");
const sfBtn = document.getElementById("s-f-btn");
const cContainer = document.getElementById("c-container");
const cCloser = document.getElementById("c-closer");
const cUsername = document.getElementById("c-username");
const cPic = document.getElementById("c-pic");
const cmContainer = document.getElementById("c-messages");
const cForm = document.getElementById("c-form");
const cFormInput =  document.getElementById("c-form-input");
const cFormBtn =  document.getElementById("c-form-btn");
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
const typingIndicator = document.getElementById("typing-indicator");
let imgArray, currIndex, show_friends, cFId, fPic, fUsername, socket, typingTimeout, canSendMessage;
let inViewMode = false;
let conversations = [];
  
const smBtn = document.getElementById("start-message-btn");

function performHighlight(keyword) {
  const query = keyword.trim();
  const targets = document.querySelectorAll('.f-username');

//  Cache the pristine initial text of each parent so we can reset cleanly
const originalTexts = Array.from(targets).map(el => el.textContent);

//  Main highlight handler
  // Reset all elements back to original clean text if query is empty
  if (!query) {
    targets.forEach((el, index) => {
      el.textContent = originalTexts[index];
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

async function getConversations(){
  try{
  const response = await fetch('/api/conversation/user/conversations');
        if (response.ok) {
          const data = await response.json();
          conversations = data.conversations
          if(conversations.length < 1){
            cPreviewContainer.innerHTML = `<p>You have not started a conversation yet, start one now</p>`;
            return 
          }
          cPreviewContainer.innerHTML =  "";
         await conversations.forEach(c => {showExistingConversation(c)});
        const existingConversations = document.querySelectorAll('.ec-card');
       await Array.from(existingConversations).forEach(el => {el.onclick = () => {openExistingConversation(el)}});
        
        }else{
          notify("error getting conversations", "error");
          console.error(response);
        }
  }catch(err){
    console.error(err);
    notify("error fetching conversations");
  }
  }

async function getFriends(){
  if(!isAuthorised) return;
  
  try {
       
        const response = await fetch('/api/friendship/friends/details');
        if (response.ok) {
          const data = await response.json();
          friendships = data.friendships
          if(friendships.length < 1){
            cPreviewContainer.innerHTML = `<p>You have not started a conversation yet, start one now</p>`;
            fContainer.innerHTML = `<p>You currently have no friends, add friends  or accept friends request if available</p>`;
           return 
          }
          try{
          await friendships.sort((a, b) => a.friend_username.localeCompare(b.friend_username));
          getConversations()
          await friendships.forEach(f =>{
            showFriend(f);
          });
          const fusernames = document.querySelectorAll('.f-username');
         await Array.from(fusernames).forEach(el => {el.initialText = el.textContent});
          const frens = document.querySelectorAll('.friend');
         await Array.from(frens).forEach(el => {el.onclick = () => {openConversation(el)}});
          }catch(err){
            console.error(err);
          }
          initChatSocket()
        } else {
          notify("You have no friends yet", "success",  "add one now!", "/friends");
          fContainer.innerHTML = `<p>You currently have no friends, add friends  or accept friends request if available</p>`;
          return 
        }
      } catch (err) {
        console.error("Error fetching friends :", err);
       notify("error occurred while fetching friends", "error");
    alert("server error");
  }
}

async function showExistingConversation(c){
  try{
    let frPic, frId, frUsername, fIsActive
    if(currentUserId === c.user_id){
      frId = c.friend_id
      frPic = c.friend_pic || "/images/default-user.png" 
      frUsername = c.friend_username
    }else{
      const fr = await friendships.filter(f => f.friend_id === c.user_id);
      frId = c.user_id
      frPic = fr[0].friend_profile_picture || "/images/default-user.png"
      frUsername = fr[0].friend_username;
      fIsActive = fr[0].friend_is_active;
    }
  
    const htmlEl = `
    <div class="ec-card" data-user=${frId}>
      <img src=${frPic} alt="friend picture" class="ef-pic"/>
      <div class="ec-details">
        <div class="ec-f-details">
          <p class="ef-username">${frUsername}</p>
          ${fIsActive? `<div class="online stat"></div>` : `<div class="offline stat"></div>`}
        </div>
        <div class="ec-m-details">
          <p>${c.last_message}</p>
          <small>${getReqTime(c.updated_at)}</small>
        </div>
      </div>
    </div>
    `;
    cPreviewContainer.innerHTML += htmlEl;
  }
  catch(err){
    console.error(err)
    notify("error display existing conversations", "error");
  }
}

async function openExistingConversation(el){
  try{
  fUsername = el.querySelector(".ef-username").textContent;
  fPic = el.querySelector(".ef-pic").src;
  cFId = el.getAttribute("data-user");
  cPic.src = fPic;
  cUsername.innerHTML = fUsername;
    await fetchMessages(cFId);
  cContainer.classList.remove("hidden");
  }catch(err){
    notify("could not open conversation, try later", "error");
    console.error(err);
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


function showFriend(f){
  try{
  const htmlEl = `
  <div class="friend" id=${f.friend_id}>
  <div class="name-pic">
   <img class="f-pic" src=${f.friend_profile_picture || '/images/default-user.png'} alt="friend picture" loading="lazy"/>
   <p class="f-username">${f.friend_username}</p>
   </div>
   ${f.friend_is_active? `<div class="online stat"></div>` : `<div class="offline stat"></div>`}
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
    f.querySelector(".f-username").innerHTML = f.querySelector(".f-username").initialText;
  });
  
    return;
  }
  sfBtn.disabled = false;
  showSearchedFriend(sfInput.value);
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

async function openConversation(f){
  try{
  fUsername = f.querySelector(".f-username").textContent;
  fPic = f.querySelector(".f-pic").src;
  cFId = f.id
  cPic.src = fPic;
  cUsername.innerHTML = fUsername;
  await fetchMessages(cFId);
  cmContainer.scrollTo({
  top: messagesContainer.scrollHeight,
  behavior: 'smooth'
});
  cContainer.classList.remove("hidden");
  smBtn.click();
  }catch(err){
    notify("could not open conversation, try later", "error");
    console.error(err);
  }
}

function getTime(t){
const localDate = new Date(t);
return localDate.toLocaleTimeString([], { 
  hour: '2-digit', 
  minute: '2-digit' 
});
}

async function showExistingMessage(m){
  try{
  let mClass;
  if(m.sender_id === currentUserId){
    mClass = "mine";
  }else{
    mClass = "others"
  }
  const msgEl = `
  <div class="c-message" id=${m.id}>
  <p class=${mClass}>${linkify(m.content)}</p><small class="m-time ${mClass}">${getTime(m.created_at)}</small>
  </div>
  `;
  cmContainer.innerHTML += msgEl
  }
  catch(err){
    console.error(err);
    notify("could not display message", "error");
  }
}

async function fetchMessages(id){
  try{
    const response = await fetch('/api/message/friend/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({friendId: id})
  });
    const data = await response.json();
        if (response.ok) {
         const pMessages = data.messages
          if(pMessages.length < 1){
            cmContainer.innerHTML = `<p>You have not started a conversation yet, send a message now</p>`;
            return ;
          }
    cmContainer.innerHTML =  "";
    await pMessages.forEach(m => {showExistingMessage(m)});
    await cmContainer.scrollTo({
  top: cmContainer.scrollHeight,
  behavior: 'smooth'
});
        }else{
          notify("error getting messages", "error");
          console.error(data);
        }
  }
  catch(err){
    console.error(err);
    notify("error fetching previous messages", "error");
  }
}

cCloser.onclick = () => {
  getConversations();
  cContainer.classList.add("hidden");
  cmContainer.innerHTML = "";
  cForm.reset();
  cFormBtn.disabled = true;
  cFormBtn.style.color = "#888";
  cFormBtn.style.background = "#bbffaa";
  fUsername = '';
  fPic = '';
  cFId = '';
}

cForm.onsubmit = (e) => {
  e.preventDefault();
  if(cFormInput.value.length < 1) return;
  sendMessage(cFId);
}


cFormInput.oninput = () => {
  if(cFormInput.value.length < 1){
    cFormBtn.disabled = true;
    cFormBtn.style.color = "#888";
    cFormBtn.style.background = "#bbffaa";
  }else{
    cFormBtn.disabled = false;
    cFormBtn.style.color = "#222";
    cFormBtn.style.background = "var(--primary-color)";
  }
}

 cFormInput.addEventListener("keydown", () => {
  if (!cFId) return;

  // Emit "typing" status as true
  socket.emit("typing_status", { recipientId: cFId, isTyping: true });

  // Clear timeout to extend the typing duration
  clearTimeout(typingTimeout);

  // Set timeout to automatically mark user as stopped after 2 seconds
  typingTimeout = setTimeout(() => {
    socket.emit("typing_status", { recipientId: cFId, isTyping: false });
  }, 2000);
});


async function sortConversation(id, txt){
  const hasConversation = conversations.find(c => c.user_id === id || c.friend_id === id);
  if(conversations && hasConversation) return true;
    try{
      const payload = {
        friend_id: id,
        friend_pic: fPic,
        friend_username: fUsername,
        last_message: txt
      }
  
  const response = await fetch('/api/conversation/v1/create-conversation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
 const data = await response.json();
  if (response.ok) {
    getConversations();
    return true;
      }else{
    console.error(data.error);
    notify(data.error, "error");
    return false
     }
    }
    catch(err){
      console.error(err);
      notify("server error occured", "error");
    return false
    }
}

let mn = 0;
async function sendMessage(id){
  try{
  if(!canSendMessage || !isAuthorised) return;
  const txt = cFormInput.value.trim();
  const dummyId = txt.charAt(0) + mn + txt.charAt(txt.length - 1);
  mn++;
  cFormBtn.disabled = true;
  cFormBtn.style.color = "#888";
  cFormBtn.style.background = "#bbffaa";
  cForm.reset();
  const msgEl = `
  <div class="c-message" id=${dummyId}>
  <p class="mine">${linkify(txt)}</p><small class="m-time mine">now</small>
  </div>
  `;
  cmContainer.innerHTML += msgEl; 
  await cmContainer.scrollTo({
  top: cmContainer.scrollHeight,
  behavior: 'smooth'
});
const sc = await sortConversation(id, txt);
if(!sc){
  console.error("error sorting conversation");
    notify("error sorting conversation","error");
  alert("error sorting conversation");
  return;
}
    // Payload structure mapping directly to backend properties
  const mPayload = {
    recipientId: id,
    messageText: txt
  };

  // Dispatch via socket with callback acknowledgement function
  socket.emit("send_private_message", mPayload, async(response) => {
     const message = await response.message
    if (response.status === "ok") {
      const dummyMsg = document.getElementById(`${dummyId}`);
      dummyMsg.querySelector(".m-time").textContent = getTime(message.createdAt);
      const elBefore = dummyMsg.previousElementSibling;
        if(elBefore?.tagName === "P"){
        cmContainer.removeChild(elBefore)
      }
      dummyMsg.id = message.id;
    } else {
      const dummyMsg = document.getElementById(`${dummyId}`);
    dummyMsg.style.color = "red";
  }
  
  });
  
  }catch(err){
    console.error(err)
    notify("error sending message","error");
    alert("error sending message");
  }
}

async function appendMessageToDOM(m){
 try{
  const msgEl = `
  <div class="c-message" id=${m.id}>
  <p class="others">${linkify(m.content)}</p><small class="m-time others">${getTime(m.created_at)}</small>
  </div>
  `;
  cmContainer.innerHTML += msgEl
  }
  catch(err){
    console.error(err);
    notify("could not display message", "error");
  }
}


function initChatSocket() {
  try{
    if(!isAuthorised) return;
  // Establish connection 
  socket = io({
  autoConnect: false,
  // CRITICAL: Forces direct WebSocket connection, skipping HTTP handshake entirely
  transports: ["websocket"], 
  
  // Aggressive timeout tuning for shaky networks
  reconnectionAttempts: 10,
  reconnectionDelay: 500,     // Start trying again in 500ms if dropped
  reconnectionDelayMax: 2000,  // Never wait more than 2 seconds to retry
  timeout: 10000                // Give up on a broken try after 10 seconds
});
    
  socket.on("connect", () => {
      console.log("Connected to chat server! ");
    canSendMessage = true;
    typingIndicator.innerHTML = `<i class="fa-solid fa-circle-check"></i>`;
    typingIndicator.style.color = "green";
    cForm.classList.remove("hidden");
    if(cFId) fetchMessages(cFId);
    });
    
  // Handle incoming global messages
  socket.on("receive_private_message", (data) => {
    const { message } = data;

    // append to the DOM 
    if (message.senderId === currentUserId) {
      appendMessageToDOM(message);
    } else {
      // Trigger a sidebar badge/notification for the other friend
      appendMessageToDOM(message);
      console.log(`Unread message from: ${message.senderId}`);
    }
  });

  // Handle dynamic typing updates
  socket.on("user_typing", ({ senderId, isTyping }) => {
    if (senderId === cFId) {
      typingIndicator.textContent = isTyping ? "is typing..." : "";
    }
  });

  socket.on("connect_error", (err) => {
    console.error("Socket Auth/Connection Error:", err.message);
    canSendMessage = false;
    typingIndicator.innerHTML = `<i class="fa-solid fa-circle-notch roll"></i>`;
    typingIndicator.style.color = "red";
    cForm.classList.add("hidden");
  });
  }catch(err){
    notify("error starting chat socket", "error");
    console.error(err);
  }
}
