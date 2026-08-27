const postsContainer = document.getElementById("posts");


async function fetchPosts() {
      postsContainer.innerHTML = `<pre>Fetching posts....</pre>`;
      try {
        
        const response = await fetch("/api/getPosts" );
        const data = await response.json();
 
        const posts = data.posts
       posts.forEach((post) => {
             displayPost(post)
       })
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
}
function displayPost(post){
const postCard = document.createElement("div");
postCard.textContent = post.content; 
console.log(post);
document.body.appendChild(postCard);

}

setTimeout(() =>{
fetchPosts()
},6000);

