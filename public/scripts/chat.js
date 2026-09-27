// 1. Global Application State
const state = {
  socket: null,
  currentUserId: currentUserId, // Populated by your auth system
  activeFriendId: null,            // Tracks who is currently on screen
  typingTimeout: null
};

// 2. DOM Elements
const el = {
  friendButtons: document.querySelectorAll('.friend-btn'),
  chatWindow: document.getElementById('chat-window'),
  chatHeader: document.getElementById('chat-header'),
  messagesContainer: document.getElementById('messages-container'),
  typingIndicator: document.getElementById('typing-indicator'),
  chatForm: document.getElementById('chat-form'),
  messageInput: document.getElementById('message-input')
};

// 3. Initialize Socket Connection (Once per session)
function initChatSocket(jwtToken) {
  // Establish connection but don't configure multiple times
  state.socket = io({
    autoConnect: false,
    auth: {
      token: `Bearer ${jwtToken}` // Handshake token for backend middleware
    }
  });

  state.socket.connect();

  // Handle incoming global messages
  state.socket.on("receive_private_message", (data) => {
    const { message } = data;

    // Only append to the DOM if the message belongs to the current open window
    if (message.senderId === state.activeFriendId) {
      appendMessageToDOM(message);
    } else {
      // Trigger a sidebar badge/notification for the other friend
      console.log(`Unread message from: ${message.senderId}`);
    }
  });

  // Handle dynamic typing updates
  state.socket.on("user_typing", ({ senderId, isTyping }) => {
    if (senderId === state.activeFriendId) {
      el.typingIndicator.textContent = isTyping ? "Friend is typing..." : "";
    }
  });

  state.socket.on("connect_error", (err) => {
    console.error("Socket Auth/Connection Error:", err.message);
  });
}

// 4. Switch Between Friends Safely
function openChatWithFriend(friendId, friendName) {
  state.activeFriendId = friendId;
  el.chatHeader.textContent = `Chatting with ${friendName}`;
  el.chatWindow.style.display = "block";
  
  // Clear previous chat window UI elements
  el.messagesContainer.innerHTML = "";
  el.typingIndicator.textContent = "";

  // Pro Tip: Fetch existing historical messages via a regular REST API here
  // fetchOldMessages(friendId).then(renderHistory);
}

// 5. Send Message Handler (Optimistic DOM Rendering)
el.chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const text = el.messageInput.value.trim();
  if (!text || !state.activeFriendId) return;

  const temporaryId = `temp_${Date.now()}`;
  el.messageInput.value = ""; // Clear input immediately

  // Instantly render your text to the screen (Optimistic UI)
  const tempMessageData = {
    id: temporaryId,
    senderId: state.currentUserId,
    text: text,
    isSending: true
  };
  appendMessageToDOM(tempMessageData);

  // Payload structure mapping directly to backend properties
  const payload = {
    recipientId: state.activeFriendId,
    messageText: text,
    temporaryId
  };

  // Dispatch via socket with callback acknowledgement function
  state.socket.emit("send_private_message", payload, (response) => {
    const messageDOMNode = document.getElementById(temporaryId);
    
    if (response.status === "ok") {
      // Message successfully hit database and verified. Remove loading indicator.
      if (messageDOMNode) {
        messageDOMNode.id = response.message.id; // Update DOM to database ID
        const statusSpan = messageDOMNode.querySelector('.status');
        if (statusSpan) statusSpan.remove();
      }
    } else {
      // Mark as failed in UI if delivery breaks
      if (messageDOMNode) {
        const statusSpan = messageDOMNode.querySelector('.status');
        if (statusSpan) {
          statusSpan.textContent = "⚠️ Failed";
          statusSpan.style.color = "red";
        }
      }
    }
  });
});

// 6. Handle Typing Triggers (Throttled via Keydown)
el.messageInput.addEventListener("keydown", () => {
  if (!state.activeFriendId) return;

  // Emit "typing" status as true
  state.socket.emit("typing_status", { recipientId: state.activeFriendId, isTyping: true });

  // Clear timeout to extend the typing duration
  clearTimeout(state.typingTimeout);

  // Set timeout to automatically mark user as stopped after 2 seconds
  state.state.typingTimeout = setTimeout(() => {
    state.socket.emit("typing_status", { recipientId: state.activeFriendId, isTyping: false });
  }, 2000);
});

// Helper: Safely build and append elements without breaking state
function appendMessageToDOM(msg) {
  const messageDiv = document.createElement("div");
  messageDiv.id = msg.id;
  messageDiv.className = `message ${msg.senderId === state.currentUserId ? "sent" : "received"}`;
  
  const textNode = document.createElement("p");
  textNode.textContent = msg.text;
  messageDiv.appendChild(textNode);

  if (msg.isSending) {
    const statusSpan = document.createElement("span");
    statusSpan.className = "status";
    statusSpan.textContent = " Sending...";
    statusSpan.style.fontSize = "12px";
    statusSpan.style.color = "gray";
    messageDiv.appendChild(statusSpan);
  }

  el.messagesContainer.appendChild(messageDiv);
  el.messagesContainer.scrollTop = el.messagesContainer.scrollHeight; // Auto-scroll
}

// 7. Attach Sidebar Friend Switchers
el.friendButtons.forEach(btn => {
  btn.addEventListener("click", (e) => {
    const friendId = e.target.getAttribute("data-id");
    const friendName = e.target.textContent;
    openChatWithFriend(friendId, friendName);
  });
});

// --- Bootstrapping Execution ---
// Initialize execution with user session token provided on login
const userMockToken = "YOUR_JWT_TOKEN_HERE";
initChatSocket(userMockToken);


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
