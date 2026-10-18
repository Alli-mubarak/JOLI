const nContainer = document.querySelector(".notifications");
let notifications;

async function getNotifications(){
  const mainTag = document.querySelector("main");
  if(!isAuthorised){
      mainTag.innerHTML = `<p class="def-msg" style="text-align:center; margin-top:50px;">Create an account or sign in to view messages</p>`;
      return;
  }
  
  try {
       
        const response = await fetch('/api/notifications');
      const data = await response.json();
    
        if (response.ok) {
          notifications = data.notifications
          if(notifications.length < 1){
            nContainer.innerHTML = `<p>You currently have no notifications, they should appear soon</p>`;
           return 
          }
          nContainer.innerHTML = "";
          try{
          await notifications.forEach(n =>{
            showNotification(n);
          });
          
          const ns = document.querySelectorAll('.n-card');
         await Array.from(ns).forEach(el => {el.onclick = () => {openNotification(el)}});
          }catch(err){
            notify("error loading notifications", "error");
            console.error(err);
            return 
          }
          
        } else {
          notify("error fetching notifications", "error");
          console.error(data);
          return ;
        }
      } catch (err) {
        console.error("Error fetching notifications :", err);
       notify("Network error, please refresh page", "error");
  }
 }

async function showNotification(n){
  try{
    let msg
    if(n.type === "friendship"){
      msg = "I want to be your friend";
    }
const htmlEl = `
 <div class="n-card" data-type=${n.type}>
     <div class="n-details">
        <img src=${n.actor_pic} alt="friend picture" class="ef-pic"/>
        <div class="u-msg">
          <p class="n-username">${n.actor_username}</p>
          <p class="msg">${msg}</p>
        </div>
      </div>

   <div class="t-menu">
    <small>${getReqTime(n.created_at)}</small>
      <div class="n-menu">
       <div></div>
       <div></div>
       <div></div>
      </div>
  </div>
</div>
    `;
    nContainer.innerHTML += htmlEl;
  }
  catch(err){
    notify("error showing notification", "error");
    console.error(err);
       
  }
}

async function openNotification(n){
  try{
    alert("opening notification");
  }
  catch(err){
    notify("error opening notification", "error");
    console.error(err);
       
  }
}

