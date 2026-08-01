const authSection = document.getElementById("auth-section");
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
         <img src="${data.user.profilePic}" width="55" height="55" style="border-radius:50%">
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
          <div id="closer"><i class="fa-solid fa-xmark" onclick="closeAuth()"></i></div>
            <h2>Please sign up or log in</h2>
            <a href="${BACKEND_URL}/auth/google"><button>Sign In with Google</button></a>
          `;
            //other logics
        }
      } catch (err) {
        console.error("Error verifying authentication status:", err);
      }
              }

function closeAuth(){}
checkAuthStatus();
alert('hello world!');
