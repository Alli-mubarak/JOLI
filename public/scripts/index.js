const signInLink = document.getElementById("sign-in-link");
const userPic = document.getElementById("user-pic");
const postAdder = document.querySelector(".add-post");
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
const imageCropper = document.getElementById("image-cropper");
const cropSaver = document.getElementById("crop-saver");

const selectedPictures = [];
let n = 0;

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
postAdder.onclick = () => {
  postContainer.classList.remove("hidden");
}
postCloser.onclick = () => {
  postContainer.classList.add("hidden");
  mediaFilesDisplayer.innerHTML = "";
  input.value = "";
  postBtn.disabled = true;
  postBtn.style.background = "#c5ff95";
  mediaCover.classList.remove('hidden');
  mediaAdder.style.background = "#c5ff95";
  mediaAdder.style.color = "#bbb";
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
   if (file.type.startsWith('image/')) {
     try {
        // Compress the image with 70% quality
        compressImage(file, 0.7); 
        console.log(`Original size: ${(file.size / 1024).toFixed(2)} KB`);
    //    console.log(`Compressed size: ${(compressedBlob.size / 1024).toFixed(2)} KB`);
    } catch (error) {
        console.error('Compression failed:', error);
     }
            } else if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = fileURL;
                video.controls = true; // Adds play/pause controls
                video.style.width = '100%';
                video.style.height = '100%';
                video.style.objectFit = 'cover';
                previewCard.appendChild(video);
            }

 })

      e.target.value = '';
   console.log(selectedPictures);
 
}
function compressImage(file, quality) {
    
        const reader = new FileReader();
        reader.readAsDataURL(file); // 1. Read file as a Data URL

        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result; // 2. Load into image element

            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');

                // Maintain aspect ratio or apply a max width/height
                const MAX_WIDTH = 1200;
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;

              
                ctx.drawImage(img, 0, 0, width, height);
              const canvasContainer = document.createElement("div");
              const canvasController = document.createElement("div");
              const canvasDeleter = document.createElement("div");
              const cancelMark = document.createElement("i");
              const canvasViewer = document.createElement("i");
              
              cancelMark.classList.add("fa-solid");
              cancelMark.classList.add("fa-xmark");
              canvasViewer.classList.add("fa-solid");
              canvasViewer.classList.add("fa-expand");
              canvasViewer.onclick = (e) => {cropImage(e)};
              canvasDeleter.appendChild(cancelMark);
              canvasDeleter.onclick = (e) => {removeMedia(e)};
              canvasController.appendChild(canvasDeleter);
              canvasController.appendChild(canvasViewer);
              canvasController.classList.add("canvas-controller");
              canvasContainer.appendChild(canvas);
              canvasContainer.appendChild(canvasController);
              n++;
              canvasContainer.id = `p${n}`;
              mediaFilesDisplayer.appendChild(canvasContainer);

              const imageData = {
                image : img,
                canvas: canvas,
                id: `p${n}`,
                x: 0,
                y:0,
                cropped: false
              }
              selectedPictures.push(imageData);
 
            };

            img.onerror = (err) => console.error(err);
        };

        reader.onerror = (err) => console.error(err);
            }
            
function removeMedia(e){
  const card = e.target.parentElement.parentElement.parentElement;
  const index = selectedPictures.findIndex( image => image.id === card.id);
if (index !== -1) {
  selectedPictures.splice(index, 1);
}
mediaFilesDisplayer.removeChild(card);
}

function cropImage(e){
  const card = e.target.parentElement.parentElement.parentElement;
 // alert(card)
  imageCropper.classList.remove("hidden");
}

cropSaver.onclick = (e) => {
  imageCropper.classList.add("hidden");
}
checkAuthStatus();
