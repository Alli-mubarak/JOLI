const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const emailBtn = document.getElementById("email-btn");
const signInContainer = document.querySelector("sign-in-container");
const signUpForm = document.getElementById("email-signup");
const signInForm = document.getElementById("email-signin");
const BACKEND_URL = "";

    async function checkAuthStatus() {
      try {
        // 'credentials: include' forces the browser to send the session cookie
        const response = await fetch(`${BACKEND_URL}/api/auth/user`, { credentials: 'include' });
        data = await response.json();
 
        
        if (data.loggedIn) {
          // User is authenticated! Display details saved from Database 
         authSection.innerHTML = `
         <div id="closer"  ><i class="fa-solid fa-xmark" onclick="closeAuth()"></i></div>
         <div class="user-details">
         <div class="user-dp">
         <img src="${data.user.profile_picture}" width="55" height="55" style="border-radius:50%">
         </div>
         <div class="other-info">
           <h2>${data.user.username}</h2>
           <p id="user-email">${data.user.email}</p>
           </div>
           </div>
           
           <button onclick="logoutUser()">Log Out</button>
         `;
         //   authSection.innerHTML = '<h1>User Logged In</h2>';
        //    toggleCtrl.classList.remove('hidden');
          //  searchIcon.classList.remove('hidden');
       //     signInBtn.classList.add('hidden');
        //    userDP.classList.remove('hidden');
         //   userDP.src = data.user.profilePic;
        //    getEntries(displayEntries);  
        } else {
          // User cookie expired or doesn't exist
         //   userDP.classList.add('hidden');
         //   signInBtn.classList.remove('hidden');
          authSection.innerHTML = `
          <div id="closer"><i class="fa-solid fa-xmark" ></i></div>
            <h2>Please sign up or log in</h2>
            <a href="${BACKEND_URL}/auth/google"><button>Sign In with Google</button></a>
          `;
            //other logics
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
function confirmEmail(){
    const emailValue = emailInput.value.trim();
    
    // Strict Regex to enforce standard email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (emailRegex.test(emailValue)) {
        emailBtn.disabled = false;
        emailBtn.style.background = "#111";
        emailBtn.style.color = "#eee";
    }else{
        emailBtn.disabled = true;
        emailBtn.style.background = "#777";
        emailBtn.style.color = "#ccc";
    }
}
emailInput.oninput = () => {
   confirmEmail();
};
function proceedWithEmail(){
    signInContainer.classList.add("hidden");
    signUpForm.classList.remove("hidden");
}

checkAuthStatus();

