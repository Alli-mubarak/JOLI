async function run(){
  try{
  const postCards = document.querySelectorAll(".postCard");




function linkify(text) {
  const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+)/g;
  
  return text.replace(urlRegex, (url) => {
    const href = url.startsWith('http') ? url : `https://${url}`;
    if (url.length > 50){
      url = url.slice(0,50)+"...";
    }
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${url}</a>`;
  });
}

if(postCards && postCards.children.length > 0){
  alert("hey");
  const pContents = document.querySelectorAll(".post-content");
  Array.from(pContents.children).forEach(pc => {
    pc.innerHTML = linkify(pc.textContent)
  })
}
alert("script done");
  }
  catch(err){
    console.error(err);
  }
}
setTimeout(()=>{
  run();
},5000);
alert("ok");
