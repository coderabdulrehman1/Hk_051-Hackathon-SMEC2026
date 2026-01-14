// Follow system
let followBtn = document.getElementById("followBtn");
let isFollowing = false;

followBtn.addEventListener("click", () => {
  isFollowing = !isFollowing;
  followBtn.textContent = isFollowing ? "Following" : "Follow";
});

// Like system
let likeBtn = document.getElementById("likeBtn");
let likeCountText = document.getElementById("likeCount");
let likes = 0;
let liked = false;

likeBtn.addEventListener("click", () => {
  liked = !liked;
  likes += liked ? 1 : -1;
  likeBtn.textContent = liked ? "❤️ Liked" : "🤍 Like";
  likeCountText.textContent = `${likes} Likes`;
});

// Comment system
let commentInput = document.getElementById("commentInput");
let addCommentBtn = document.getElementById("addComment");
let commentList = document.getElementById("commentList");

addCommentBtn.addEventListener("click", () => {
  let commentText = commentInput.value.trim();
  if (commentText === "") return;

  let li = document.createElement("li");
  li.textContent = commentText;
  commentList.appendChild(li);

  commentInput.value = "";
});
