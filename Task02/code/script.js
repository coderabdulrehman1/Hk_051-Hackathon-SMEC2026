async function comparePrices() {
  const query = document.getElementById("query").value.trim().toLowerCase();
  if (!query) {
    alert("Please enter a product name (e.g. phone, shirt, laptop)");
    return;
  }

  const loading = document.getElementById("loading");
  const errorDiv = document.getElementById("error");
  const resultDiv = document.getElementById("result");
  const tableBody = document.getElementById("prices-table");
  const bestPriceBox = document.getElementById("best-price-box");

  errorDiv.textContent = "";
  loading.style.display = "block";
  resultDiv.style.display = "none";
  tableBody.innerHTML = "";
  bestPriceBox.textContent = "";

  try {
    const apis = [
      {
        name: "DummyJSON",
        url: `https://dummyjson.com/products/search?q=${encodeURIComponent(query)}`,
        type: "search"
      },
      {
        name: "FakeStoreAPI",
        url: "https://fakestoreapi.com/products",
        type: "all"
      },
      {
        name: "FakerJS Fake Store",
        url: "https://fakerapi.it/api/v1/products?_quantity=100",
        type: "all"
      }
    ];

    const results = await Promise.all(
      apis.map(async (api) => {
        try {
          const res = await fetch(api.url);
          if (!res.ok) throw new Error("API failed");

          const data = await res.json();

          let products = api.type === "search" ? (data.products || []) : (data.data || data || []);

          if (!Array.isArray(products)) products = [];

          const matching = products.filter(p =>
            (p.title?.toLowerCase().includes(query)) ||
            (p.name?.toLowerCase().includes(query))
          );

          if (matching.length === 0) {
            return { name: api.name, product: "No match", price: "N/A" };
          }

          const cheapest = matching.reduce((min, p) =>
            p.price < min.price ? p : min, matching[0]
          );

          return {
            name: api.name,
            product: cheapest.title || cheapest.name || "Unnamed Product",
            price: Number(cheapest.price).toFixed(2)
          };
        } catch {
          return { name: api.name, product: "Error", price: "N/A" };
        }
      })
    );

    results.forEach(r => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${r.name}</td>
        <td>${r.product}</td>
        <td>${r.price === "N/A" ? "N/A" : `$${r.price}`}</td>
      `;
      tableBody.appendChild(row);
    });

    const valid = results.filter(r => r.price !== "N/A" && !isNaN(Number(r.price)));
    if (valid.length > 0) {
      const best = valid.reduce((min, r) =>
        Number(r.price) < Number(min.price) ? r : min, valid[0]
      );
      bestPriceBox.textContent = `Best Price: $${best.price} from ${best.name} (${best.product})`;
    } else {
      bestPriceBox.textContent = "No matching products found";
    }

    resultDiv.style.display = "block";
  } catch (err) {
    errorDiv.textContent = "Something went wrong: " + err.message;
  } finally {
    loading.style.display = "none";
  }
}