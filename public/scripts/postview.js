const postContent = document.querySelector(".post-content");
const mediaViewer = document.getElementById("media-viewer");
  const mediaViewerCloser = document.getElementById("mv-closer");
  const moveLeft = document.getElementById("mv-left");
  const moveRight = document.getElementById("mv-right");
  const viewer = document.getElementById("viewer");
  const mediaCounter = document.getElementById("media-counter");
  const imageBox = document.getElementById("image-view");
  const postImagesContainer = document.querySelector(".post-images");


  let imgArray;
  let currIndex;
  let inViewMode = false;

  if (postImagesContainer.children.length > 0){
    imgArray = Array.from(postImagesContainer.children);
    imgArray.forEach(img=>{
      img.onclick = (e) =>{viewPostImage(e)}
    })
  }

function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

  alert(postContent.innerHTML)
alert(postContent.textContent);

setTimeout(()=>{
postContent.innerHTML = linkify(postContent.textContent);
  alert('linkified!');
},4000);

function viewPostImage(e){
   try{
   inViewMode = true;
    const img = e.target;
    const src = img.src
    imgArray = Array.from(img.parentElement.children);
   
   const index = imgArray.indexOf(img);
   currIndex = index;
     if(imgArray.length > 1){
         imgArray.forEach((c) =>{
             mediaCounter.innerHTML += `<div></div>`
         });
         mediaCounter.children[index].style.background = "#fff";
         
     }
         imageBox.src = src;
         if(index === 0){
             moveLeft.classList.add("hidden");
         }
         if(index === imgArray.length -1){
             moveRight.classList.add("hidden");
         }
     
        mediaViewer.classList.remove("hidden");
      
      
       }catch(e){
           console.error(e);
       }     
        }
        
    mediaViewerCloser.onclick = (e) =>{
    try{
        mediaViewer.classList.add("hidden");
        mediaCounter.innerHTML = "";
        inViewMode = false;
        moveLeft.classList.remove("hidden");
        moveRight.classList.remove("hidden");
        imgArray = "";
       }catch(e){
           console.error(e);
       }
    }
    
    moveRight.onclick = () =>{
    try{
        if(inViewMode){
        if(currIndex  < imgArray.length - 1){
         
        imageBox.src = imgArray[currIndex + 1].src;
       const mcArray = Array.from(mediaCounter.children);
       mcArray.forEach(c=>{
           c.style.background = "transparent";
       })
       mediaCounter.children[currIndex + 1].style.background = "#fff";
       
       moveLeft.classList.remove("hidden");
       
       
       if(currIndex+2 === imgArray.length){
             moveRight.classList.add("hidden");   
         }
         currIndex += 1;
       }else{
           moveRight.classList.add("hidden");   
       }
        }
     }catch(e){
           console.error(e);
       }
    }
    
    moveLeft.onclick = () =>{
    try{
        if(inViewMode){
        if(currIndex  !== 0){
         
        imageBox.src = imgArray[currIndex - 1].src;
       const mcArray = Array.from(mediaCounter.children);
       mcArray.forEach(c=>{
           c.style.background = "transparent";
       })
       mediaCounter.children[currIndex - 1].style.background = "#fff";
       
       moveRight.classList.remove("hidden");
       
      
       if(currIndex === 1){
             moveLeft.classList.add("hidden");   
         }
        currIndex -= 1;
       }else{
           moveLeft.classList.add("hidden");   
       }
        }
     }catch(e){
           console.error(e);
       }
      }
