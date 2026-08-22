const signInLink = document.getElementById("sign-in-link");
const userPic = document.getElementById("user-pic");
async function checkAuthStatus() {
      try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch("/api/auth/user", { credentials: 'include' });
        data = await response.json();
 
        
        if (data.loggedIn) {
        signInLink.classList.add("hidden");
         userPic.src = data.user.profile_picture || "images/default-user.png";
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
const mediaInput = document.getElementById('media-upload');
mediaInput.onchange = (e) =>{
 const selectedFiles = Array.from(e.target.files);
 if (selectedFiles.length === 0) return; 
 selectedFiles.forEach(file =>{
       console.log(file.type + ", " +(file.size /1024) + "kb");
       if(file.type.includes("video")){
             console.log("this is a video");
       }else{
             console.log("this is an image");
       }
 })

      e.target.value = '';
 
}
checkAuthStatus();
