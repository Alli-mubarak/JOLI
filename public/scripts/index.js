const signInLink = document.getElementById("sign-in-link");
const userPic = document.getElementById("user-pic");
  const mediaFilesDisplayer = document.getElementById('media-files-displayer');
const postContainer = document.getElementById('create-post-container');
const postCloser = document.getElementById('p-closer');
const pUserPic= document.getElementById('p-user-picture');
const pUsername = document.getElementById('p-username');
    const input = document.getElementById('content');
    const postBtn = document.getElementById('post-btn');
    const mediaInput = document.getElementById('media-upload');
   const mediaCover = document.getElementById('cover');
   const mediaAdder = document.getElementById('add-media');
async function checkAuthStatus() {
      try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch("/api/auth/user", { credentials: 'include' });
        data = await response.json();
 
        
        if (data.loggedIn) {
        signInLink.classList.add("hidden");
         userPic.src = data.user.profile_picture || "images/default-user.png";
          pUserPic.src = data.user.profile_picture || "images/default-user.png";
          pUsername.textContent = data.user.username
        userPic.classList.remove("hidden");
          
        } else {
          signInLink.classList.remove("hidden");
          userPic.classList.add("hidden");
          console.log("unauthenticated");
        }
      } catch (err) {
        console.error("Error verifying authentication status:", err);
      }
      }

    // Handle logging out
    function logoutUser() {
        if (data.loggedIn) {
      // Redirect browser directly to backend logout route to clear cookie and destroy session 
      window.location.href = `${BACKEND_URL}/logout`;
        }
        return 
    }
//post adder
postCloser.onclick = () => {
  postContainer.classList.add("hidden");
}
input.oninput = () => {
  
      if (input.value.length > 0){
          postBtn.disabled = false;
          postBtn.style.background = "#2bff43";
          mediaCover.classList.add('hidden');
          mediaAdder.style.background = "#2bff43";
          mediaAdder.style.color = "#222";
          
      }else{
          postBtn.disabled = true;
          postBtn.style.background = "#c5ff95";
          mediaCover.classList.remove('hidden');
          mediaAdder.style.background = "#c5ff95";
          mediaAdder.style.color = "#bbb";
      }
}
mediaInput.onchange = (e) =>{
 const selectedFiles = Array.from(e.target.files);
 if (selectedFiles.length === 0) return; 
 selectedFiles.forEach(file =>{
       console.log(file.type + ", " +Math.ceil(file.size /1024) + "kb");
     //  if(file.type.includes("video")){
    //         console.log("You cannot post videos yet!");
    //   }else{
    //        
     //  }
       const fileURL = URL.createObjectURL(file); [1]
            
            // Create a generic wrapper div for styling individual item cards
            const previewCard = document.createElement('div');
            previewCard.style.width = '100px';
            previewCard.style.height = '100px';
            previewCard.style.overflow = 'hidden';
            previewCard.style.border = '1px solid #ccc';
            previewCard.style.borderRadius = '8px';

            // 3. Check file type and build the correct HTML element
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = fileURL;
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.objectFit = 'cover';
                previewCard.appendChild(img);

            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = fileURL;
                video.controls = true; // Adds play/pause controls
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                previewCard.appendChild(video);
            }

            // 4. Inject the individual preview card into the container grid
            mediaFilesDisplayer.appendChild(previewCard);
           
 })

      e.target.value = '';
 
}
checkAuthStatus();
