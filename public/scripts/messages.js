window.onload = function() {
  async function run(){
   async function go(){
const BACKEND_URL = window.location.hostname === "localhost" 
  ? "http://localhost:5000" 
  : "https://joli-indol.vercel.app";
console.log(io)
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

        class ProWebSocket {
            constructor(url) {
                this.url = url;
                this.socket = null;
                this.reconnectAttempts = 0;
                this.maxReconnects = 5;
                this.reconnectInterval = 3000; // 3 seconds
                
                this.initUI();
                this.connect();
            }

            initUI() {
                this.statusEl = document.getElementById('status');
                this.logEl = document.getElementById('log');
                this.inputEl = document.getElementById('messageInput');
                this.sendBtn = document.getElementById('sendButton');

                this.sendBtn.addEventListener('click', () => {
                    this.send({ type: 'chat', content: this.inputEl.value });
                });
            }

            connect() {
                this.log('Connecting to WebSocket server...');
                this.socket = new WebSocket(this.url);

                this.socket.onopen = (event) => this.onOpen(event);
                this.socket.onmessage = (event) => this.onMessage(event);
                this.socket.onclose = (event) => this.onClose(event);
                this.socket.onerror = (error) => this.onError(error);
            }

            onOpen(event) {
                this.log('Connected successfully!');
                this.statusEl.textContent = 'Connected';
                this.statusEl.className = 'status connected';
                this.reconnectAttempts = 0; // Reset counter on success
            }

            onMessage(event) {
                try {
                    const data = JSON.parse(event.data);
                    this.log(`Received JSON: ${JSON.stringify(data)}`);
                } catch (e) {
                    // Fallback for plain text
                    this.log(`Received Text: ${event.data}`);
                }
            }

            onClose(event) {
                this.statusEl.textContent = 'Disconnected';
                this.statusEl.className = 'status disconnected';
                this.log(`Connection closed (Code: ${event.code}). Attempting reconnect...`);
                this.reconnect();
            }

            onError(error) {
                this.log('WebSocket error observed.');
                console.error(error);
            }

            reconnect() {
                if (this.reconnectAttempts < this.maxReconnects) {
                    this.reconnectAttempts++;
                    setTimeout(() => this.connect(), this.reconnectInterval);
                } else {
                    this.log('Max reconnect attempts reached. Refresh page.');
                }
            }

            send(data) {
                if (this.socket && this.socket.readyState === WebSocket.OPEN) {
                    // Professionally send structured JSON payload
                    this.socket.send(JSON.stringify(data));
                    this.inputEl.value = '';
                } else {
                    this.log('Cannot send: Socket is not open.');
                }
            }

            log(text) {
                const p = document.createElement('div');
                p.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
                this.logEl.appendChild(p);
                this.logEl.scrollTop = this.logEl.scrollHeight;
            }
        }

        // Initialize connection
        // Replace localhost with your production server's URL
const wsClient = new ProWebSocket('wss://://joli-indol.vercel.app');
    
                 

}
setTimeout(()=>{
  try{
    alert("page loaded");
    run();
  }
  catch(err){
    console.error(err)
  }
},5000);
}
