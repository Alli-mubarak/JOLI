const usersContainer = document.querySelector(".users");
let lastUserFetched;

async function fetchUsers() {
      try {
        
        const response = await fetch("/api/get-users" );
        const data = await response.json();
 
        const users = data.users;
       // lastUserFetched = 
        
      usersContainer.innerHTML = '';
            
      for (let i=0; i < users.length; i++){
             await displayUser(users[i]);

       }
     //   allowPostView();
        return;
      } catch (err) {
       notify("Error fetching users", "error");
        console.error("Error fetching users:", err);
      }
}

async function displayUser(user){
try{
 
const userCard = `
<div class="user">
    <div class="pp-box">
       <img src=${user.profile_picture || "/images/default-user.png"} class="user-pic" alt="user picture" />
    </div>
    <div class="user-details">
       <button class="add-friend-btn"><i class="fa-solid fa-plus"></i> Add </button>
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

fetchUsers();
