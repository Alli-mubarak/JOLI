const postsContainer = document.getElementById("posts");


async function fetchPosts() {
      postsContainer.innerHTML = `<pre>Fetching posts....</pre>`;
      try {
        
        const response = await fetch("/api/getPosts" );
        posts = await response.json();
 
        console.log(typeof(posts));
        console.log(posts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
}

setTimeout(() =>{
fetchPosts()
},6000);

