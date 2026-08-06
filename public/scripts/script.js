const authSection = document.getElementById("auth-section");
const emailInput = document.getElementById("email-input");
const emailBtn = document.getElementById("email-btn");
const signInContainer = document.querySelector(".sign-in-container");
const caption = document.querySelector(".caption");
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
function confirmEmailAndCheckUsername(){
    const emailValue = emailInput.value.trim();
    
    // Strict Regex to enforce standard email format
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    const username = emailInput.value.trim();
    const usernameRegex = /^[a-z0-9_]+$/;

    if (emailRegex.test(emailValue)) {
        emailBtn.disabled = false;
        emailBtn.setAttribute("onclick", "proceedWithEmail()");
        emailBtn.style.background = "#111";
        emailBtn.style.color = "#eee";
    }else if(usernameRegex.test(username) && username.length >= 5){
        emailBtn.disabled = false;
        emailBtn.setAttribute("onclick", "proceedWithUsername()");
        emailBtn.style.background = "#111";
        emailBtn.style.color = "#eee";
    }else{
        emailBtn.disabled = true;
        emailBtn.style.background = "#777";
        emailBtn.style.color = "#ccc";
    }
}

emailInput.oninput = () => {
   confirmEmailAndCheckUsername();
};
function proceedWithEmail(){
    caption.classList.add("hidden");
    signInContainer.classList.add("hidden");
    signUpForm.classList.remove("hidden");
    signUpForm.email.value = emailInput.value.trim();
    signInForm.email.value = emailInput.value.trim();
}
function proceedWithUsername(){
    caption.classList.add("hidden");
    signInContainer.classList.add("hidden");
    signUpForm.classList.add("hidden");
    signInForm.classList.remove("hidden");
    signInForm.email.value = emailInput.value.trim();
}
function showSignUpForm(){
    signInContainer.classList.add("hidden");
    signInForm.classList.add("hidden");
    signUpForm.classList.remove("hidden");
}
function showSignInForm(){
    signInContainer.classList.add("hidden");
    signUpForm.classList.add("hidden");
    signInForm.classList.remove("hidden");
}
signUpForm.onsubmit = (e) =>{
    e.preventDefault();
    const emailValue = signUpForm.email.value;
    const emailError = signUpForm.querySelector("#email-error");
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
        emailError.innerHTML = "incorrect email format";
        setTimeout(()=>{
            emailError.innerHTML = "";
        },1200);
        return
    }
    const usernameValue = signUpForm.username.value;
    const usernameError = signUpForm.querySelector("#username-error");
    const usernameRegex = /^[a-z0-9_]+$/
    if (usernameValue.length < 5){
        usernameError.innerHTML = "username cannot be less than 5 characters";
        setTimeout(()=>{
            usernameError.innerHTML = "";
        },1200);
        return
    }
    if (!usernameRegex.test(usernameValue)){
        usernameError.innerHTML = "username can only contain lowercase, numbers and underscore";
        setTimeout(()=>{
            usernameError.innerHTML = "";
        },1200);
        return
    }
    const pwdValue = signUpForm.password.value;
    const pwdError = signUpForm.querySelector("#pwd-error");
    const pwdRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if(pwdValue.length < 8){
        pwdError.innerHTML = "password cannot be less than 8 characters";
        setTimeout(()=>{
            pwdError.innerHTML = "";
        },1200);
        return
    }
    if(!pwdRegex.test(pwdValue)){
        pwdError.innerHTML = "use a strong password!";
        setTimeout(()=>{
            pwdError.innerHTML = "";
        },1200);
        return
    }
    const pwdCfm = signUpForm.passwordConfirm.value;
    const pwdCfmError = signUpForm.querySelector("#pwd-cfm-error");
    if(pwdCfm !== pwdValue){
        pwdCfmError.innerHTML = "passwords do not match!";
        setTimeout(()=>{
            pwdCfmError.innerHTML = "";
        },1200);
        return
    }
    const formMessage = signUpForm.querySelector("#form-message");
  //  formMessage.innerHTML = "NO ISSUES";
     
  // Automatically extract data from the input fields
  const formData = new FormData(signUpForm);
  const payload = Object.fromEntries(formData.entries());
 
  
    
}
signInForm.onsubmit = (e) =>{
    e.preventDefault();
    const emailValue = signInForm.email.value;
    const formMessage = signInForm.querySelector("#form-message");
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue)) {
        formMessage.innerHTML = "incorrect email format";
        setTimeout(()=>{
            formMessage.innerHTML = "";
        },1200);
        return
    }
}
function toggleReveal(el){
    const passwordInput = el.previousElementSibling;
    console.log(passwordInput);
    if(passwordInput.type === "password"){
    passwordInput.type = "text";
    el.classList.remove('fa-eye')
    el.classList.add('fa-eye-slash');
    }else{
    passwordInput.type = "password";
    el.classList.remove('fa-eye-slash')
    el.classList.add('fa-eye');
    }
}
checkAuthStatus();

