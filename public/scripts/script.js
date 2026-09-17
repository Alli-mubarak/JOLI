const prIcons = document.querySelectorAll(".pr-icon");
const emailInput = document.getElementById("email-input");
const emailBtn = document.getElementById("email-btn");
const prBtn = document.getElementById("pr-btn");
const signInContainer = document.querySelector(".sign-in-container");
const caption = document.querySelector(".caption");
const signUpForm = document.getElementById("email-signup");
const ssufBtn = document.getElementById("ssuf-btn");
const surpBtn = document.getElementById("surp-btn");
const signInForm = document.getElementById("email-signin");
const ssifBtn = document.getElementById("ssif-btn");
const sirpBtn = document.getElementById("sirp-btn");
const prForm = document.getElementById("reset-password");
const rBtn = document.getElementById("return-btn");
let minContainer;
let secContainer ;
const numbers = "912837465";
let otpForm;
let inputs;
let otpBtn;
let otp = "" ;
const BACKEND_URL = "";
const notifier = document.querySelector(".notifier");
let closeNotifierID;
let formsState;
let isTimerOn = false;
let otpTimerID;

function notify(msg){
          if(notifier.innerHTML === ""){
            const message = document.createElement('p');
            const closer = document.createElement('i');
            message.textContent = msg;
            closer.classList.add("fa-solid");
            closer.classList.add("fa-xmark");
            closer.setAttribute("onclick", "closeNotifier()");
            notifier.appendChild(message );
            notifier.appendChild(closer);
            notifier.style.top = "0";
            closeNotifierID =setTimeout(()=>{
                notifier.style.top="-40px";
                notifier.innerHTML = "";
            }, 2000)
        }
            
 }
     function closeNotifier(){
           clearTimeout(closeNotifierID);
            notifier.style.top="-40px";
             notifier.innerHTML = "";
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

prBtn.onclick = () => {notify('This feature is not available yet!')}

emailInput.oninput = () => {
   confirmEmailAndCheckUsername();
};
function proceedWithEmail(){
    caption.classList.add("hidden");
    signInContainer.classList.add("hidden");
    signUpForm.classList.remove("hidden");
    signUpForm.email.value = emailInput.value.trim();
    signInForm.identifier.value = emailInput.value.trim();
}
function proceedWithUsername(){
    caption.classList.add("hidden");
    signInContainer.classList.add("hidden");
    signUpForm.classList.add("hidden");
    signInForm.classList.remove("hidden");
    signInForm.identifier.value = emailInput.value.trim();
}
ssufBtn.onclick = () => {
    signInContainer.classList.add("hidden");
    signInForm.classList.add("hidden");
    signUpForm.classList.remove("hidden");
}
ssifBtn.onclick = () => {
    signInContainer.classList.add("hidden");
    signUpForm.classList.add("hidden");
    signInForm.classList.remove("hidden");
}
signUpForm.onsubmit = async(e) =>{
    e.preventDefault();
    const emailValue = signUpForm.email.value;
    const emailError = signUpForm.querySelector("#email-error");
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(emailValue.trim())) {
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
    if (!usernameRegex.test(usernameValue.trim())){
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
        pwdError.innerHTML = "use a strong password, a strong password is a combination of lowercase letter(s), uppercase letter(s), special character(s) e.g $, and number(s).";
        setTimeout(()=>{
            pwdError.innerHTML = "";
        },3500);
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
    const formLoader = document.createElement("div");
    formLoader.classList.add("form-loader");
    formMessage.appendChild(formLoader);
     
  // Automatically extract data from the input fields
  const formData = new FormData(signUpForm);
  const payload = Object.fromEntries(formData.entries());
 try {
    // Send a POST request to the server API
    const response = await fetch("/api/auth/sign-up", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Inform server we are sending JSON data
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload) // Convert JavaScript object into a JSON string
    });
 
    // 6. Parse the server JSON response
    const data = await response.json();
 
    // 7. Handle success vs server-side validation/errors
    if (response.ok) {
     formMessage.innerHTML = "";
      formMessage.textContent = 'Account created successfully!, Redirecting...';
      formMessage.style.color = 'green';
      signUpForm.reset(); // Clear form fields
        setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
      
       window.location.href = '/home';
    } else {
      // Server returned a bad status code (e.g., 400 Bad Request, 409 Email Exists)
        formMessage.innerHTML = "";
      formMessage.textContent = data.message || 'Account creation failed. Please try again.';
      formMessage.style.color = 'red';
        setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
    }
 
  } catch (error) {
    // Network errors (e.g., server is offline or internet disconnected)
     formMessage.innerHTML = "";
    console.error('Network Error:', error);
    formMessage.textContent = 'Network error. Cannot reach the server.';
    formMessage.style.color = 'red';
      setTimeout(()=>{
            formMessage.textContent = '';
        },1600)
 }
}

signInForm.onsubmit = async(e) =>{
    e.preventDefault();
const identifier = signInForm.identifier.value;
const password = signInForm.password.value;
const formMessage = signInForm.querySelector("#form-message");
if(!identifier && !password){
    formMessage.textContent = 'Enter credentials';
    formMessage.style.color = 'red';
      setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
    return 
}
if(identifier.length < 5 && password.length < 8){
    formMessage.textContent = 'Enter correct credentials';
    formMessage.style.color = 'red';
      setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
    return 
}
    const formLoader = document.createElement("div");
    formLoader.classList.add("form-loader");
    formMessage.appendChild(formLoader);

  // Automatically extract data from the input fields
  const formData = new FormData(signInForm);
  const payload = Object.fromEntries(formData.entries());
 try {
    // Send a POST request to the server API
    const response = await fetch("/api/auth/login", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Inform server we are sending JSON data
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload) // Convert JavaScript object into a JSON string
    });
 
    // 6. Parse the server JSON response
    const data = await response.json();
 
    // 7. Handle success vs server-side validation/errors
    if (response.ok) {
        formMessage.innerHTML = "";
      formMessage.textContent = 'Successfully Logged In!,  Redirecting...';
      formMessage.style.color = 'green';
      signUpForm.reset(); // Clear form fields
        setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
      
       window.location.href = '/home';
    } else {
      // Server returned a bad status code (e.g., 400 Bad Request, 409 Email Exists)
     formMessage.innerHTML = "";
      formMessage.textContent = data.message || 'Login failed. Please try again.';
      formMessage.style.color = 'red';
        setTimeout(()=>{
            formMessage.textContent = '';
        },1600);
    }
 
  } catch (error) {
    // Network errors (e.g., server is offline or internet disconnected)
    console.error('Network Error:', error);
     formMessage.innerHTML = "";
    formMessage.textContent = 'Network error. Cannot reach the server.';
    formMessage.style.color = 'red';
      setTimeout(()=>{
            formMessage.textContent = '';
        },1600)
 }
}
Array.from(prIcons).forEach(i => {
 i.onclick = (e) => {toggleReveal(e.currentTarget)} 
});
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

surpBtn.onclick = () =>{
 signUpForm.classList.add("hidden");
 prForm.classList.remove("hidden");
 formsState = "fsuf";
}
sirpBtn.onclick = () =>{
signInForm.classList.add("hidden");
 prForm.classList.remove("hidden");
 formsState = "fsif";
}

rBtn.onclick = () =>{
 if(formsState === "fsif"){
 prForm.classList.add("hidden");
  signInForm.classList.remove("hidden");
 formsState = "";
 }else if(formsState === "fsuf"){
 prForm.classList.add("hidden");
  signUpForm.classList.remove("hidden");
 formsState = "";
 }else{return;}
}

prForm.onsubmit = async(e) => {
 e.preventDefault();
 const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
 const emailValue = prForm.email.value;
const formMessage = prForm.querySelector("#form-message");
const emailBox = prForm.querySelector(".input-box");
try{
  if (!emailRegex.test(emailValue.trim())) {
    formMessage.innerHTML = "";
    formMessage.textContent = 'incorrect email format';
    formMessage.style.color = 'red';
   setTimeout(()=>{
      formMessage.innerHTML = "";  
   },2000);
        return
    }

const formLoader = document.createElement("div");
formLoader.classList.add("form-loader");
formMessage.appendChild(formLoader);
          
   // Automatically extract data from the input fields
  const formData = new FormData(prForm);
  const payload = Object.fromEntries(formData.entries());
 const response = await fetch("/api/auth/reset-password", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json', // Inform server we are sending JSON data
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload) // Convert JavaScript object into a JSON string
    });
const data = await response.json();
 if(response.ok){
formMessage.innerHTML = "";
const dataMessage = data.message;
if(dataMessage.includes("Google")){
    formMessage.textContent = data.message ;
    formMessage.style.color = 'red';
}else if(dataMessage.includes("not")){
    formMessage.textContent = data.message ;
    formMessage.style.color = 'red';
}else{
  formMessage.textContent = data.message ;
    formMessage.style.color = 'green';
}
setTimeout(()=>{
formMessage.innerHTML = "";
if(dataMessage.includes("Email found")){
prForm.classList.add("hidden");
const otpBox = `
<form id="otp-form">
<p id="otp-label">You have received a 6-digit code from <b>joli.app.connect@gmail.com</b>. Check your spam folder if not found.</p>
<p>Enter code below</p>
<div class="otp-container">
  <input  class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric" autocomplete="one-time-code">
  <input  class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric">
  <input class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric">
  <input class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric">
  <input class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric">
  <input class="otp-input" maxlength="1" pattern="\d*" inputmode="numeric">
</div>
<p class="timer"><span id="min">00</span> <span>:</span> <span id="sec">00</span></p>
<button id="submit-otp" disabled>Submit</button>
</form>
`;
prForm.insertAdjacentHTML('afterend', otpBox);
otpForm = document.getElementById("otp-form");
inputs = document.querySelectorAll('.otp-input');
otpBtn = document.getElementById("submit-otp");
 minContainer = document.getElementById("min");
 secContainer = document.getElementById("sec");
setTimer(10);
otpForm.onsubmit = (e) =>{submitOtp(e)}
activateInputs()
}
},2000);
 return;
 }else{
   formMessage.innerHTML = "";
    formMessage.textContent = data.message || 'server error occurred, try again!';
    formMessage.style.color = 'red';
setTimeout(()=>{
      formMessage.innerHTML = "";  
   },2000);
  return;
 }
}catch(err){
 formMessage.innerHTML = "";
    formMessage.textContent =  'Network error. Cannot reach the server.';
    formMessage.style.color = 'red';
setTimeout(()=>{
      formMessage.innerHTML = "";  
   },2000);
console.error(err);
}
    
}

function activateInputs(){
try{
inputs.forEach((input, index) => {
 input.addEventListener('input', (e) => {
try{
   if(input.value.length > 1) input.value = input.value.slice(0, 1);
   if(!Number(input.value)) input.value = "";
   if(
     inputs[0].value.length > 0 &&
     inputs[1].value.length > 0 &&
     inputs[2].value.length > 0 &&
     inputs[3].value.length > 0 &&
     inputs[4].value.length > 0 &&
     inputs[5].value.length > 0 
     ){
     otpBtn.disabled = false;
     otpBtn.style.background = "#222";
     otpBtn.style.color = "#fff";
     }else{
     otpBtn.disabled = true;
     otpBtn.style.background = "#999";
     otpBtn.style.color = "#bbb";
     otp = "";
     }
      if (e.target.value.length >= 1 && index < inputs.length - 1) {
        inputs[index + 1].focus();
        
      }
}catch(err){
          console.error(err);
          input.value = "";
}
    });

    // Move backward if user presses Backspace on an empty field
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Backspace' && e.target.value.length === 0 && index > 0) {
        inputs[index - 1].focus();
         
      }
    });
  });
}catch(err){
notify("error occured, try again later!");
 console.error(err);
}
}
  
 function submitOtp(e){
  e.preventDefault();
  propagateOtp();
  otpBtn.disabled = true;
  otpBtn.style.background = "#999";
  otpBtn.style.color = "#bbb";
  otp = "";
  otpForm.reset();
  
  }
  
  function propagateOtp(){
      inputs.forEach(input => {
          otp += input.value;
      });
      otp = Number(otp);
      alert(otp)
               }
function setTimer(mins){
  isTimerOn = true;
  let sec = 59;
  let sMin = mins - 1
  minContainer.textContent = mins;
   otpTimerID = setInterval(() => {
        if(sec === -1){
         sec = 59;
         sMin--
         }
         
        secContainer.textContent = sec;
        minContainer.textContent = sMin;
        
         if(sec < 10){
         secContainer.textContent = "0"+sec;
         }
        if(sMin < 10){
          minContainer.textContent = "0"+sMin;
         }
        if(sMin === 0 && sec === 0){
         secContainer.textContent = "00";
        minContainer.textContent = "00";
        secContainer.parentElement.classList.add("pop");
        clearInterval(otpTimerID);
        isTimerOn = false;
       }
        sec--;
        
      },1000);
   
            }
