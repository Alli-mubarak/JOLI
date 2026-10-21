const nContainer = document.querySelector(".notifications");
const postMenuContainer = document.getElementById("post-menu-container");
  const postMenuCloser = document.getElementById("p-closer-space");
  const postMenu = document.getElementById("post-menu");
  let pmCloserBtn = document.getElementById("p-closer-btn");
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
          nContainer.style.background = "#bbb";
          const ns = document.querySelectorAll('.n-card');
         await Array.from(ns).forEach(el => {el.onclick = (e) => {openNotification(e)}});
            
          const nsRd = document.querySelectorAll('.n-card-read');
          if(nsRd.length > 0){
         await Array.from(nsRd).forEach(el => {el.onclick = (e) => {openNotification(e)}});
          }
            
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
    let nType = n.type
    if(n.type === "friendship"){
      msg = "sent you a friend request, click to view, then accept or decline";
    }else if(n.type === "comment"){
      msg = " commented on your post, check it out!";
      nType = `comment_${n.resource_id}`
    }
    if(n.is_read){
      nClass = "n-card-read";
    }
const htmlEl = `
 <div class=${nClass} id=${n.id} data-type=${nType} data-read=${n.is_read}>
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

//post menu closer - blank space 
  postMenuCloser.onclick = () =>{
      postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
    postOnFocus.style.background = "#fff";
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
  } else if(nCard.getAttribute('data-type').includes("comment")){
     if(nCard.getAttribute('data-read') !== "true"){
     await markAsRead(nId);
     }
     const pId = nCard.getAttribute('data-type').split("_")[1];
    window.location.href = `/post/${pId}`;
  }
    }
  } catch(err){
    notify("error opening notification", "error");
    console.error(err);
  }
}

async function deleteNotification(id){
  try{
    notify("deleting notification..");
    postMenuCloser.style.background = "transparent";
     setTimeout(() =>{
      postMenuContainer.style.bottom = "-100vh";
      },200);
   enableScrolling();
    const response = await fetch(`/api/notification/${id}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        });
    
        if (!response.ok) {
          console.error(response);
          notify("notification deletion failed!", "error");
          return;
        }
    const currN = document.getElementById(`${id}`);
    nContainer.removeChild(currN);
    notify("notification deleted");
    if(nContainer.children.length < 1){
       nContainer.innerHTML = `<p>You currently have no notifications, they should appear soon</p>`;
      nContainer.style.background = "#fff";
    }
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
