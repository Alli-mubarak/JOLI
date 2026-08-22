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
 const selectedFiles = e.target.files;
 console.log(selectedFiles);
}
checkAuthStatus();
