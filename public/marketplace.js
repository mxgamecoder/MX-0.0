// Authentication check
const token = localStorage.getItem('mxapi_token');
const userId = localStorage.getItem('mxapi_id');
const apiKey = localStorage.getItem('mxapi_apikey');

if (!token || !userId || !apiKey) {
  alert("You're missing login or API key. Please go to the dashboard and log out, then log in again.");
  window.location.href = "index.html";
}

// State
let allApis = [];
let owned = [];

async function fetchMarketplaceApis() {
  const res = await fetch('/api/marketplace/all');
  const data = await res.json();
  allApis = data.apis;

  const ownedRes = await fetch(`/api/marketplace/user/owned-apis/${userId}`);
  const ownedData = await ownedRes.json();
  owned = ownedData.owned || [];

  displayApis(allApis);
}

function displayApis(apiList) {
  const container = document.getElementById("api-container");
  const notFound = document.getElementById("not-found");
  container.innerHTML = "";
  notFound.classList.add("hidden");

  if (!apiList.length) {
    notFound.classList.remove("hidden");
    return;
  }

  apiList.forEach(api => {
    const name = api.name || api.filePath;
    const image = api.image || "https://i.ibb.co/JjMphBCP/avatar.jpg";
    const isOwned = owned.some(owned =>
      owned.name === api.name && owned.category === api.category
    );

    const usageMsg = api.usageMessage ? `<p class="text-yellow-300 text-sm mt-1">${api.usageMessage}</p>` : "";
    const button = isOwned
      ? `<button disabled class="w-full mt-3 py-2 bg-gray-600 rounded text-white cursor-not-allowed">✅ Owned</button>`
      : `<button onclick="buyApi('${api._id}')" class="w-full mt-3 py-2 bg-green-600 hover:bg-green-500 rounded text-white">🛍 Buy</button>`;

    container.innerHTML += `
      <div class="bg-gray-800 p-4 rounded shadow">
        <img src="${image}" class="h-40 w-full object-cover rounded mb-2" />
        <h2 class="text-xl font-bold">${name}</h2>
        <p class="text-sm text-gray-300">${api.description || 'No description'}</p>
        <p class="text-sm text-blue-400">💰 ${api.price || 0} Coins</p>
        <p class="text-sm text-pink-400">📁 ${api.category}</p>
        ${usageMsg}
        ${button}
      </div>
    `;
  });
}

// Buy API
async function buyApi(apiId) {
  const confirmBuy = confirm("Buy this API?");
  if (!confirmBuy) return;

  const res = await fetch('/api/marketplace/buy', {
    method: 'POST',
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, apiId })
  });

  const data = await res.json();
  alert(data.message);
  if (data.success) fetchMarketplaceApis();
}

// Search function
function searchApis() {
  const searchTerm = document.getElementById("search").value.toLowerCase();
  const filtered = allApis.filter(api =>
    api.name.toLowerCase().includes(searchTerm)
  );
  displayApis(filtered);
}

// Filter by first letter group
function filterGroup(group) {
  const ranges = {
    "A-E": ["a", "b", "c", "d", "e"],
    "F-I": ["f", "g", "h", "i"],
    "J-O": ["j", "k", "l", "m", "n", "o"],
    "P-T": ["p", "q", "r", "s", "t"],
    "U-Z": ["u", "v", "w", "x", "y", "z"],
    "ALL": null
  };

  if (group === "ALL") return displayApis(allApis);

  const letters = ranges[group];
  const filtered = allApis.filter(api => {
    const first = api.name[0].toLowerCase();
    return letters.includes(first);
  });

  displayApis(filtered);
}

fetchMarketplaceApis();
