const usersContainer = document.querySelector(".users");
let lastUserFetched;
let pendingRequests = [];
let pendingRequestsTime = [];
let pendingAccepts = [];
let pendingAcceptsTime = [];


async function fetchUsers() {
      try {
        
        const response = await fetch("/api/get-users" );
        const data = await response.json();
 
        const users = data.users;
           // alert(scrollPosition)
            //alert(isAuthorised)
           // alert(currentUserId)
       // lastUserFetched = 
        if(currentUserId){
      const fResponse = await fetch("/user/friends");
      if(fResponse.ok){
      const friendshipsResult  = await fResponse.json();
      const friendships = friendshipsResult.friendships;
      friendships.forEach(f => {
      if(f.status === "pending"){
            if(f.sender_id === currentUserId){
                  pendingRequests.push(f.receiver_id);
                  pendingRequestsTime.push(f.created_at);
                  
            }
            else{
                  pendingAccepts.push(f.sender_id);
                  pendingAcceptsTime.push(f.created_at);
            }
      }else{return;}
      });
      }else{
            notify("Error fetching friendships", "error");
      }
      console.log(pendingRequests);
      console.log(pendingAccepts);
        }
      usersContainer.innerHTML = '';
            
      for (let i=0; i < users.length; i++){
            if(pendingAccepts.includes(users[i].sender_id)) return;
            if(pendingRequests.includes(users[i].receiver_id)) return;
             await displayUser(users[i]);

       }
       allowUserView();
        return;
      } catch (err) {
       notify("Error fetching users", "error");
        console.error("Error fetching users:", err);
      }
}

async function displayUser(user){
try{
 
const userCard = `
<div class="user" data-url="/user/${user.username}">
    <div class="pp-box">
       <img src=${user.profile_picture || "/images/default-user.png"} class="user-pic" alt="user picture" />
    </div>
    <div class="user-details">
       <button class="add-friend-btn" data-type="add-user" data-id=${user.id}><i class="fa-solid fa-plus"></i> Add </button>
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
}

}

function allowUserView(){
 try{
      const usersCard = document.querySelectorAll(".user")
      usersCard.forEach(user =>{
            user.onclick = (e) => {viewUser(e)}
      })
 }catch(err){
       console.error(err);
 }
}

function viewUser(e){
try{
 const userOnFocus = e.currentTarget
if(e.target.getAttribute("data-type") && e.target.getAttribute("data-type") === "add-user"){
      const userId = e.target.getAttribute("data-id");
      addUser(e.target, userId)
//notify("coming soon!");
      return 
}
const userPage = userOnFocus.getAttribute("data-url");
window.location.href = userPage;
}catch(err){
      console.error(err)
}
}

async function addUser(btn, rId){
      try{
      if(!isAuthorised){
            notify("please, log in first!", "error","click here", "/");
            return;
      }
      const response = await fetch("/api/friendship/request", {
        method: "POST",
        headers: {
      'Content-Type': 'application/json'
      },
        body: JSON.stringify({receiverId: rId})
      });
      if(response.ok){
            notify("request sent!");
            btn.textContent = "sent";
      }else{
            notify("request failed!", "error");
            btn.textContent = "failed";
      }
      }
      catch(e){
            notify("failed to add friend", "error")
            console.error(e);
      }
}
fetchUsers();
