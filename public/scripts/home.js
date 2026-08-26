const postsContainer = document.getElementById("posts");
postsContainer.innerHTML = `<pre>Fetching posts....</pre>`;

async function fetchPosts() {
      try {
        
        const response = await fetch("/api/getPosts" );
        posts = await response.json();
 
        
        console.log(posts);
      } catch (err) {
        console.error("Error fetching posts:", err);
      }
}

fetchPosts()
