const searchForm = document.getElementById("search-form");
const searchBtn = document.getElementById("search-btn");
const searchInput = document.getElementById("search-input");


searchForm.onsubmit = async(e) => {
  try{
  e.preventDefault();
  const query = searchInput.value.trim();
  if(query.length < 1) return;
  const response = await fetch(`/api/search?q=${query}`);
  const data = await response.json();
  if(response.ok){
    alert(data.users);
    alert(data.posts);
  }else{
    notify("error fetching search", "error");
  }
    

    }catch(err){
    notify("network error occurred!", "error");
    console.error(err);
    }
}
