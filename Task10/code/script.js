let items = JSON.parse(localStorage.getItem("items")) || [];

function saveItems() {
  localStorage.setItem("items", JSON.stringify(items));
}

function addItem() {
  const name = itemName.value;
  const category = itemCategory.value;
  const image = itemImage.value || "https://via.placeholder.com/400";
  const desc = itemDesc.value;

  if (!name || !category) {
    alert("Please fill all required fields");
    return;
  }

  items.push({
    id: Date.now(),
    name,
    category,
    image,
    desc,
    ratings: []
  });

  saveItems();
  displayItems();
}

function displayItems() {
  itemsContainer.innerHTML = "";

  items.forEach(item => {
    const avg =
      item.ratings.length === 0
        ? "No ratings"
        : (item.ratings.reduce((a,b)=>a+b)/item.ratings.length).toFixed(1);

    itemsContainer.innerHTML += `
      <div class="card">
        <img src="${item.image}">
        <div class="card-content">
          <h3>${item.name}</h3>
          <p>${item.desc}</p>
          <p><b>Category:</b> ${item.category}</p>
          <div class="rating">⭐ ${avg}</div>
          <button class="rate" onclick="rateItem(${item.id})">Rate</button>
          <button class="match" onclick="findMatch('${item.category}')">Find Match</button>
          <button class="delete" onclick="deleteItem(${item.id})">Delete</button>
        </div>
      </div>
    `;
  });
}

function rateItem(id) {
  const rating = prompt("Rate from 1 to 5");
  const item = items.find(i => i.id === id);

  if (rating >= 1 && rating <= 5) {
    item.ratings.push(Number(rating));
    saveItems();
    displayItems();
  }
}

function findMatch(category) {
  const matches = items.filter(i => i.category === category).length - 1;
  alert(`🔁 ${matches} similar items found for barter or rent`);
}

function deleteItem(id) {
  items = items.filter(i => i.id !== id);
  saveItems();
  displayItems();
}

displayItems();
