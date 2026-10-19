const nContainer = document.querySelector(".notifications");
const postMenuContainer = document.getElementById("post-menu-container");
  const postMenuCloser = document.getElementById("p-closer-space");
  const postMenu = document.getElementById("post-menu");
  let pmCloserBtn = document.getElementById("p-closer-btn");
const cbContainer = document.getElementById("confirm-box-container");
 const noConfirmBtn = document.getElementById("no-btn");
const confirmBtn = document.getElementById("yes-btn");
let notifications;

// confirm box function 
noConfirmBtn.onclick = () =>{
         cbContainer.classList.add("hidden");
        cbContainer.action = "";
    currPost.style.background = "#fff";
      enableScrolling();
  postMenuCloser.style.background = "transparent";
    
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
}

confirmBtn.onclick = () =>{
         cbContainer.classList.add("hidden");
        cbContainer.action();
       enableScrolling();
      }
      
   function confirmAction(a, action){
     disableScrolling();
    cbContainer.action = action
    const cAction = document.getElementById("action");
    cAction.textContent = a;
    cbContainer.classList.remove("hidden");
       }
       
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
          nContainer.style.background = "#bbb";
          const ns = document.querySelectorAll('.n-card');
         await Array.from(ns).forEach(el => {el.onclick = (e) => {openNotification(e)}});
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
    let nClass = "n-card";
    let msg;
    if(n.type === "friendship"){
      msg = "sent you a friend request, click to view, then accept or decline";
    }
    if(n.is_read){
      nClass = "n-card-read";
    }
const htmlEl = `
 <div class=${nClass} id=${n.id} data-type=${n.type} data-read=${n.is_read}>
     <div class="n-details">
        <img src=${n.actor_pic} alt="friend picture" class="ef-pic"/>
        <div class="u-msg">
          <p class="n-username">${n.actor_username}</p>
          <p class="msg">${msg}</p>
        </div>
      </div>

   <div class="t-menu" data-type="n-menu">
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

async function showNMenu(e, nId){
  try{
    const htmlEl = `
        <i class="fa-solid fa-xmark" id="p-closer-btn"></i>
        ${currentUserId && isAuthorised? `<button id="delete-btn"><i class="fa-solid fa-trash"></i> Delete notification</button>` : ""}
        `;
        postMenu.innerHTML = htmlEl;

        postMenuContainer.style.bottom = 0;
      setTimeout(() =>{
      postMenuCloser.style.background = "rgba(0,0,0,0.2)";
      },300);
      disableScrolling();


      pmCloserBtn = document.getElementById("p-closer-btn");
     const delBtn = postMenu.querySelector("#delete-btn");
        if(delBtn){
    delBtn.onclick = () =>{
       deleteNotification(nId);
      }
    }
    
    pmCloserBtn.onclick = () =>{
    postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
    }
    
  }
  catch(err){
    notify("error opening menu", "error");
    console.error(err);
  }
}

async function openNotification(e){
  try{
    const nCard = e.currentTarget
    const nId = nCard.id
      if(e.target.getAttribute('data-type') === "n-menu" || e.target.parentElement.getAttribute('data-type') === "n-menu"){
        showNMenu(e, nId);
        return;
      }else{
   if(nCard.getAttribute('data-type') === "friendship"){
     if(nCard.getAttribute('data-read') !== "true"){
     await markAsRead(nId);
     }
    window.location.href = "/friends";
  }
    }
  } catch(err){
    notify("error opening notification", "error");
    console.error(err);
  }
}

async function deleteNotification(id){
  try{
    notify("feature coming soon..");
    postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
  }
  catch(err){
    notify("error deleting notification", "error");
    console.error(err);
  }
}

async function markAsRead(nId){
  try{
    const response = await fetch(`/api/notification/read/${nId}`);
    const data = await response.json();
    console.log(data);
    if(response.ok){
      return
    }
    else{
      notify("error marking as read", "error");
    }
    
  }
  catch(err){
    notify("error reading notification!", "error");
    console.error(err);
  }
}
