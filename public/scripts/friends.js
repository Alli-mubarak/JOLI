alert("hello");
const pendingRequestsContainer = document.getElementById("pending-requests")
const usersContainer = document.querySelector(".users");
let lastUserFetched;
let pendingRequests = [];
let pendingRequestsTime = [];
let pendingAccepts = [];
let pendingAcceptsTime = [];
let pendingAcceptsPic = [];
let pendingAcceptsUsername = [];


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
      
      
        }
      usersContainer.innerHTML = '';
      if(users.length < 1){
            return;
      }   
      for (let i=0; i < users.length; i++){
      usersContainer += '<h2 >Add friends</h2>';
      if(pendingAccepts.includes(user.id)){
 pendingAcceptsPic.push(user.profile_picture);
pendingAcceptsUsername.push(user.username);
}
else if(pendingRequests.includes(user.id)){
      console.log("hi")
}else{
             await displayUser(users[i]);
}
       }
  if(pendingAccepts.length > 0){
      pendingRequestsContainer += '<h2>Pending Requests</h2>';
      pendingAccepts.forEach((a,i) => {
      displayPendingAccepts(i);
            })
            }
       allowUserView();
        return;
      } catch (err) {
       notify("Error fetching users", "error");
        console.error("Error fetching users:", err);
      }
}
function displayPendingAccepts(
async function displayUser(user){
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
}

}

//function that calculates the time the request was created compared to the current time
function getReqTime(reqTime){
const targetDate = new Date(reqTime);
const currentDate = new Date();

const msDifference = currentDate - targetDate;
const sDifference = msDifference / 1000;
const mDifference = msDifference / (1000 * 60);
const hDifference = msDifference / (1000 * 60 * 60);
const dDifference = msDifference / (1000 * 60 * 60 * 24);
const mtDifference = msDifference / (1000 * 60 * 60 * 24 * 12);

if(mtDifference > 1){
return `${Math.floor(mtDifference)}M`; 
}else if (dDifference > 1){
return `${Math.floor(dDifference)}d`;
}else if (hDifference > 1){
return `${Math.floor(hDifference)}h`;
}else if (mDifference > 1){
return `${Math.floor(mDifference)}m`;
}else {
return `${Math.floor(sDifference)}s`;
}

}

function displayPendingAccepts(i){
      const htmlEl = `
      <div class="p-user>
       <img src=${pendingAcceptsPic[i]} alt="user picture" />
       <div class="req-options">
         <div class="req-details">
          <p class="p-username">${pendingAcceptsUsername[i]}</p>
          <small>${getReqTime(pendingAcceptsTime[i])}</small>
         </div>
         <div class="req-btns">
         <button class="accept-btn">Accept</button>
         <button class="remove-btn">Remove</button>
         </div>
       </div>
      </div>
      `;
      pendingRequestsContainer += htmlEl;
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
      addUser(e.target,userOnFocus, userId)
//notify("coming soon!");
      return 
}
const userPage = userOnFocus.getAttribute("data-url");
window.location.href = userPage;
}catch(err){
      console.error(err)
}
}

async function addUser(btn, userCard, rId){
      try{
      if(!isAuthorised){
            notify("please, log in first!", "error","click here", "/");
            return;
      }
      const addLoader = btn.querySelector(".add-loader");
      addLoader.classList.remove("fa-plus");
      addLoader.classList.add("fa-circle-notch");
       addLoader.classList.add("roll");
      const response = await fetch("/api/friendship/request", {
        method: "POST",
        headers: {
      'Content-Type': 'application/json'
      },
        body: JSON.stringify({receiverId: rId})
      });
      if(response.ok){
            
            notify("request sent!");
            usersContainer.removeChild(userCard);
      }else{
            notify("request failed!", "error");
      addLoader.classList.remove("fa-circle-notch");
       addLoader.classList.remove("roll");
      addLoader.classList.add("fa-plus");
            
      }
      }
      catch(e){
            notify("failed to add friend", "error")
            console.error(e);
      }
}
fetchUsers();
