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
const cropBox = document.getElementById("image-box");

cropBox.innerHTML = `
   <div id="crop">
          
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div id="crop-holder">
                  <div class="holder"></div>
                  <div class="holder"></div>
              </div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
          </div>
          `;

const selectedPictures = [];
let imageInCropperId;
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
input.value = "";
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
  try{
 const selectedFiles = Array.from(e.target.files);
 if (selectedFiles.length === 0) return; 
 selectedFiles.forEach((file, index) =>{
      // console.log(file.type + ", " +Math.ceil(file.size /1024) + "kb");
   if (file.type.startsWith('image/')) {
     try {
        processImage(file, index); 
       // console.log(`Original size: ${(file.size / 1024).toFixed(2)} KB`);
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
  }catch(e){
    console.error(e)
  }
}
 function processImage(file, index) {
    try{
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
             
              
             img.id = `p${n}`;
              const imageData = {
                image : img,
                canvas: canvas,
                id: `p${n}`,
                x: 0,
                y:0,
                w: null,
                h: null,
                cropped: false
              }
              selectedPictures.push(imageData);
            };
          

           img.onerror = (err) => console.error(err);
        };

        reader.onerror = (err) => console.error(err);
    }catch(e){
      console.error(e)
    }
            }
            
function removeMedia(e){
  try{
  const card = e.target.parentElement.parentElement.parentElement;
  const index = selectedPictures.findIndex( image => image.id === card.id);
if (index !== -1) {
  selectedPictures.splice(index, 1);
}
mediaFilesDisplayer.removeChild(card);
  console.log(selectedPictures);
  }catch(e){
    console.error(e)
  }
}

const crop = document.getElementById("crop");
const cropHolder = document.getElementById("crop-holder");
    
    let image, w, h,  imageWidth, imageHeight
    //variables for mobile
        let isDragging = false;
        let isResizing = false;
       
       let startX, startY, newX, newY, initialHeight, dragX, dragY, initialWidth, initialTop, initialLeft;
       let minSize = 150;
       let cropWidth, cropHeight;
     
    
    
    
    function checkImageDownload(image){
      try{
       if(image.complete){    
        imageWidth = cropBox.clientWidth;
        imageHeight = cropBox.clientHeight;
        resetImage();    
        }else{
           image.onload = () => {                    
        imageWidth = cropBox.clientWidth;
        imageHeight = cropBox.clientHeight;
        resetImage();
            }
          }
        }catch(e){
        console.error(e);
        }
    }
        
      function resetImage(){
       try{
        h = image.naturalHeight;
        w = image.naturalWidth;
        const r = h/w;
        const pw = window.innerWidth
       const imageInCropper = document.querySelector(".image-to-crop")
       
        imageWidth = (pw * 0.8) ;
        imageHeight = ((pw * 0.8)* r ) ;
        cropBox.style.width = imageWidth + "px";
      
        imageInCropper.style.height = imageHeight + "px";
        initialWidth = imageWidth;
        initialHeight = imageHeight;
         initialLeft = 0;
         initialTop = 0;

         //reset cropper
         if(imageInfo.cropped){
           initialWidth = imageInfo.w;
           initialHeight = imageInfo.h;
           initialTop = imageInfo.y;
           initialLeft = imageInfo.x;
         }
         crop.style.top = initialTop + "px";
         crop.style.left = initialLeft + "px";
          crop.style.width = initialWidth + "px";
         crop.style.height = initialHeight + "px";
         
         
         
       }catch(e){
         console.error(e);
       }
        
    }
//****

   crop.addEventListener('touchstart', (e) => {
  isResizing = true;
  // Use the first touch point
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  
 
  
  // Prevent mobile screen from scrolling while dragging the box
  e.preventDefault();
}, { passive: false });

   // Handle touch movement
   
   // resizing functionality 
crop.addEventListener('touchmove', (e) => {
  if (!isResizing) return;
  
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  
  // Calculate new size
    newWidth = initialWidth + dx;
    newHeight = initialHeight + dy;
    
  // restrict crop         
  if(newWidth < minSize) newWidth = minSize;
  if(newHeight < minSize) newHeight = minSize;
  
  let remW = imageWidth - crop.offsetLeft ;
  if(newWidth > remW) newWidth = remW;
  
  let remH = imageHeight - crop.offsetTop
  if(newHeight > remH) newHeight = remH;
  
  
  // Set style
  crop.style.width = newWidth + "px";
  crop.style.height = newHeight + "px";
  
  e.preventDefault();
}, { passive: false });

 crop.addEventListener('touchend', (e) => {
  if(isResizing){
 initialHeight = newHeight
 initialWidth = newWidth
 }
 isResizing = false;
 
});

//Dragging functionality 
   initialTop = crop.offsetTop;
    initialLeft = crop.offsetLeft;
cropHolder.addEventListener('touchstart', (e) => {
  
  isResizing = false;
  isDragging = true;
    dragX = e.touches[0].clientX;
    dragY = e.touches[0].clientY;
  //  initialTop = crop.offsetTop;
   // initialLeft = crop.offsetLeft;
 
  // Prevent mobile screen from scrolling while dragging the box
  e.preventDefault();
}, { passive: false });

cropHolder.addEventListener('touchmove', (e) => {
  
  isResizing = false;
  if(!isDragging) return;
  
    const ox = e.touches[0].clientX - dragX;
    const oy = e.touches[0].clientY - dragY;
 
 // Calculate new positions
    newX= initialLeft + ox;
    newY= initialTop + oy;
  
  //restrict drag
    if(newX < 0) newX = 0
    if(newY < 0) newY = 0
    
    let newA = imageWidth - initialWidth 
    if(newX > newA) newX = newA
    
    let newB = imageHeight - initialHeight
    if(newY > newB) newY = newB
   
   
    //set style
    crop.style.left = newX + "px";
    crop.style.top = newY + "px";
    
  // Prevent mobile screen from scrolling while dragging the box
  e.preventDefault();
}, { passive: false });

   cropHolder.ontouchend = () =>{
       isResizing = false;
       if(isDragging){
        initialLeft = newX;
        initialTop = newY;
       }
       isDragging = false;
       
   }
  
    
let imageInfo;
function cropImage(e){
  try{
  const card = e.target.parentElement.parentElement;
  
  const index = selectedPictures.findIndex( image => image.id === card.id);
if (index !== -1) {
  imageInfo = selectedPictures[index];

  const imageToCrop = imageInfo.image
  imageToCrop.classList.add("image-to-crop");
  cropBox.appendChild(imageToCrop);
  image = imageInfo.image;
  imageInCropperId = imageInfo.id;
   checkImageDownload(image)
       
  console.log(imageInfo);
  
}
  imageCropper.classList.remove("hidden");
  }catch(e){
    console.error(e)
  }
}

cropSaver.onclick = (e) => {
  try{
 //   console.log(crop.clientWidth, crop.clientHeight, crop.offsetLeft, crop.offsetTop);
 //   console.log(initialHeight, initialWidth, initialLeft, initialTop);

const index = selectedPictures.findIndex( image => image.id === imageInfo.id);
if (index !== -1) {
if(!selectedPictures[index].cropped) selectedPictures[index].cropped = true;
selectedPictures[index].x = initialLeft;
selectedPictures[index].y = initialTop;
selectedPictures[index].w = initialWidth;
selectedPictures[index].h = initialHeight;
}
  const canvas = document.createElement("canvas")
    canvas.height = initialHeight;
    canvas.width = initialWidth;
    const ctx = canvas.getContext('2d');
    const rect = crop.getBoundingClientRect();
    const imgRect = image.getBoundingClientRect();
    const scaleX = image.naturalWidth / imgRect.width;
     const scaleY = image.naturalHeight / imgRect.height;
    const cropX = initialLeft * scaleX;
     const cropY = initialTop * scaleY;
      const cropWidth = rect.width * scaleX;
       const cropHeight = rect.height * scaleY;
      
    ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
  imageCropper.classList.add("hidden");
  cropBox.removeChild(imageInfo.image);
 const croppedImageContainer = mediaFilesDisplayer.querySelector(`#${imageInCropperId}`);
const existingCanvas = croppedImageContainer.querySelector("canvas");
existingCanvas.replaceWith(canvas);
if (index !== -1) {
  selectedPictures[index].canvas = canvas;
}

console.log(selectedPictures[index]);
imageInfo = "";
  }catch(e){
    console.error(e)
  }
}

function convertCanvas(canvas){
  return canvas.toDataURL('image/jpeg', 0.7);
}


postBtn.onclick = async() =>{
  try{
  let imagesSize = 0;
  const compressedImagesArray = [];
    
  selectedPictures.forEach((file) => {
   const compressedImage = convertCanvas(file.canvas);
    compressedImagesArray.push(compressedImage);
  imagesSize += compressedImage.length;
  });
  console.log(`Images size: ${(imagesSize / 1024).toFixed(2)} KB`);
 const imagesSizeInMb = (imagesSize / 1024 / 1024).toFixed(2);
  alert("posting, please wait");
  console.log(imagesSizeInMb + "MB");
    if(input.value.length < 1) return;
  if(imagesSizeInMb > 10){
  alert("images are too much or too large, crop them and retry or use different images");
    return;
  }
console.log(compressedImagesArray);
const payload = {
  content: input.value,
  images: compressedImagesArray,
  postType: 'public'
};
    
try {
  const response = await fetch('/api/create-post', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (response.ok) {
    const result = await response.json();
    console.log('Upload successful:', result);
    alert(result);
  } else {
    console.error('Server error status:', response.status);
  }
} catch (error) {
  console.error('Network dispatch failure:', error);
}
    
    
  }catch(e){
    console.error(e)
  }
}

checkAuthStatus();
