const token = localStorage.getItem('mxapi_token');
const userId = localStorage.getItem('mxapi_id');
const apiKey = localStorage.getItem('mxapi_apikey');
let replyingTo = null; // { commentId, username }

if (!token || !userId || !apiKey) {
  showPopup("You're missing login or API key. Please go to the dashboard and log out, then log in again.", () => {
    window.location.href = "index.html";
  });
}

let allApis = [];
let owned = [];

// ==== FETCH ALL APIS ====
async function fetchMarketplaceApis() {
  try {
    const [dbRes, ownedRes] = await Promise.all([
      fetch('/api/marketplace/all'),
      fetch(`/api/marketplace/user/owned-apis/${userId}`)
    ]);

    const dbData = await dbRes.json();
    const ownedData = await ownedRes.json();

    owned = ownedData.owned || [];
    allApis = dbData.apis || [];
    displayApis(allApis);
  } catch (err) {
    showPopup("Failed to load marketplace APIs.");
  }
}

// Helper function to truncate description
function truncateText(text, maxWords = 18) {
  if (!text) return '';
  const words = text.split(' ');
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ') + '...';
}

// ==== DISPLAY CARDS ====
function displayApis(apiList, customMessage = null) {
  const container = document.getElementById("api-container");
  const notFound = document.getElementById("not-found");
  container.innerHTML = "";
  notFound.style.display = "none";

  if (!apiList.length) {
    notFound.innerText = customMessage || "Not available yet 😞. Contact admin if needed.";
    notFound.style.display = "block";
    return;
  }

  apiList.forEach(api => {
    const image = api.image || "https://i.ibb.co/JjMphBCP/avatar.jpg";
    const shortDesc = truncateText(api.description, 15);

    container.innerHTML += `
      <div onclick="showFullApi('${api.id}')" class="api-card" style="cursor:pointer;">
        <h2>${api.name}</h2>
        <p style="color:#60a5fa;">🧑‍💻 ${api.owner || 'Unknown'}</p>
        <p style="color:#facc15;">💰 ${api.price || 0} Coins</p>
        <small>🕒 ${api.lastUpdated ? new Date(api.lastUpdated).toLocaleDateString() : 'Unknown'}</small>
        ${shortDesc ? `<p style="margin-top:4px; color:#ddd;">${shortDesc}</p>` : ''}
        <p style="font-size:0.75rem; color:#888;">
          🆔 ID: <span id="api-id-${api.id}">${api.id}</span>
          <button onclick="copyApiId(event, '${api.id}')" style="margin-left:6px; padding:2px 6px; font-size:0.75rem;">📋 Copy</button>
        </p>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.9rem; color:#aaa; margin-top:8px;">
          <div style="display:flex; gap:12px;">
            <span id="likes-${api.id}">👍 ${api.likes?.length || 0}</span>
            <span id="dislikes-${api.id}">👎 ${api.dislikes?.length || 0}</span>
            <span id="comments-${api.id}">💬 ${api.comments?.length || 0}</span>
          </div>
          <div style="color:#facc15; font-weight:600;">${getTag(api)}</div>
        </div>
        <p style="font-size:0.75rem; color:#888; font-style:italic;">ℹ️ Tap to see full API details</p>
      </div>
    `;
  });
}

// ==== COPY BUTTON FUNCTION ====
function copyApiId(event, apiId) {
  event.stopPropagation(); // prevent triggering card click
  navigator.clipboard.writeText(apiId)
    .then(() => showPopup("API ID copied! 📋"))
    .catch(() => showPopup("Failed to copy API ID."));
}

// ==== TAGS ====
function getTag(api) {
  let tags = [];
  if (api.isHot) tags.push("🔥 Hot");
  if (api.isNew) tags.push("🆕 New");
  if (api.isPopular) tags.push("⭐ Popular");
  return tags.join(" ");
}

// ==== FULL API VIEW ====
function showFullApi(apiId) {
  const api = allApis.find(a => a.id === apiId);
  if (!api) return showPopup("API not found.");

  const image = api.image || "https://i.ibb.co/JjMphBCP/avatar.jpg";
  const isOwned = owned.some(o =>
    o._id === api.id ||
    (o.name === api.name && o.category === api.category) ||
    (o.filePath && o.filePath === api.filePath)
  );

  let actionBtn = "";
  if (isOwned) {
    actionBtn = `<button disabled class="action-btn btn-purple">👑 Owner</button>`;
  } else if ((api.available ?? 9999) <= 0) {
    actionBtn = `<button disabled class="action-btn btn-gray">⛔ Out of Stock</button>`;
  } else {
    actionBtn = `<button onclick="buyApi('${api.id}', this)" class="action-btn btn-green">🛍 Buy</button>`;
  }

  document.getElementById('apiFullContent').innerHTML = `
    <!-- NAV HEADER -->
    <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
  <h2 style="font-size:1.4rem; font-weight:700;">🧪 ${api.name}</h2>
  <div style="display:flex; align-items:center; gap:8px;">
    <button onclick="updateApi('${api.id}')" class="btn-gray" style="padding:4px 8px; font-size:0.9rem;">🔄 Update</button>
  </div>
</div>

    <img src="${image}" style="width:100%; max-width:300px; border-radius:8px; margin-bottom:16px; display:block; margin:auto;">

    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-bottom:16px; font-size:0.9rem;">
      <p>🧑‍💻 <b>${api.owner || 'Unknown'}</b></p>
      <p>💰 Price: <span style="color:#facc15;">${api.price || 0} Coins</span></p>
      <p>📁 Category: ${api.category || 'None'}</p>
      <p>📦 Available: ${api.available ?? 9999}</p>
            <p>
        <button onclick="reportComment('${api.id}')" class="btn-report">🚨 Report</button>
      </p>
      <p style="margin-bottom:4px;">🕒 Created: 
  ${api.lastUpdated ? new Date(api.lastUpdated).toLocaleDateString() : 'Unknown'}
</p>
    <div style="font-size:0.8rem; color:#888; font-style:italic; line-height:1.6;">
  <p><span id="popup-api-id">${api.id}</span>
  </p>
</div>
    </div>

<!-- REACTIONS -->
<div style="display:flex; gap:12px; margin-bottom:16px; font-size:1.1rem; color:#aaa;">
  <button data-type="like" data-api="${api.id}" onclick="likeApi(event, '${api.id}')">👍 ${api.likes?.length || 0}</button>
  <button data-type="dislike" data-api="${api.id}" onclick="dislikeApi(event, '${api.id}')">👎 ${api.dislikes?.length || 0}</button>
  <button data-type="comment" data-api="${api.id}" onclick="openCommentModal('${api.id}')">💬 ${api.comments?.length || 0}</button>
</div>

    ${api.description ? `<div style="background:#232338; padding:12px; border-radius:8px; font-size:0.85rem; margin-top:10px; white-space:pre-line;">${api.description}</div>` : ''}
    ${actionBtn}
  `;

  document.getElementById("api-tag").innerText = getTag(api);
  document.getElementById("apiFullPopup").style.display = "flex";
}
function closeApiFullPopup() {
  document.getElementById("apiFullPopup").style.display = "none";
  fetchMarketplaceApis(); // fetch latest counts
}

// ==== POPUP ====
let popupTimeout;

function showPopup(message, callback = null) {
  const popup = document.getElementById("popup");
  const msgEl = document.getElementById("popup-message");
  msgEl.innerText = message;
  popup.style.display = "flex";
  popup.dataset.callback = callback ? "yes" : "";

  // Clear existing timer if any
  if (popupTimeout) clearTimeout(popupTimeout);

  // Auto-close after 2.5 seconds if no callback
  if (!callback) {
    popupTimeout = setTimeout(() => {
      closePopup();
    }, 2500);
  }
}

function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";

  // If callback exists, execute redirect
  if (popup.dataset.callback === "yes") {
    popup.dataset.callback = ""; // reset
    window.location.href = "index.html";
  }

  // Clear timeout
  if (popupTimeout) clearTimeout(popupTimeout);
}

function closePopup() {
  const popup = document.getElementById("popup");
  popup.style.display = "none";
  if (popup.dataset.callback === "yes") {
    window.location.href = "index.html";
  }
}

// ==== BUY API ====
async function buyApi(apiId, btn) {
  if (!apiId) return showPopup("Invalid API ID.");
  btn.disabled = true;
  btn.innerText = "⏳ Purchasing...";

  try {
    const res = await fetch('/api/marketplace/buy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, apiId })
    });

    const data = await res.json();
    showPopup(data.message);

    const ownedRes = await fetch(`/api/marketplace/user/owned-apis/${userId}`);
    const ownedData = await ownedRes.json();
    owned = ownedData.owned || [];

    showFullApi(apiId);
  } catch (err) {
    showPopup("Something went wrong. Please try again.");
    btn.disabled = false;
    btn.innerText = "🛍 Buy";
  }
}

// ==== FILTERS ====
function searchApis() {
  const term = document.getElementById("search").value.toLowerCase();
  const filtered = allApis.filter(api => api.name.toLowerCase().includes(term));
  displayApis(filtered, "Not available yet 😞. Contact admin if needed.");
}

  function filterGroup(group) {
    const map = {
      "A-E": ["a","b","c","d","e"],
      "F-I": ["f","g","h","i"],
      "J-O": ["j","k","l","m","n","o"],
      "P-T": ["p","q","r","s","t"],
      "U-Z": ["u","v","w","x","y","z"],
      "ALL": null
    };

    if (group === "ALL") return displayApis(allApis);

    const chars = map[group];
    const filtered = allApis.filter(api => {
      if (!api.name) return false;
      const first = api.name.trim()[0]?.toLowerCase(); // trim + safe access
      return chars.includes(first);
    });

    displayApis(filtered);
  }

function filterByTag() {
  const value = document.getElementById("tag-filter").value;
  if (value === "all") return displayApis(allApis);

  let filtered = [];
  if (value === "hot") filtered = allApis.filter(api => api.isHot);
  else if (value === "new") filtered = allApis.filter(api => api.isNew);
  else if (value === "popular") filtered = allApis.filter(api => api.isPopular);

  displayApis(filtered, "No APIs match this tag 🏷️. Try another one.");
}

function filterByCoins() {
  const value = document.getElementById("coin-filter").value;
  if (value === "all") return displayApis(allApis);

  const limit = parseInt(value, 10);
  let min = 0, max = limit;

  if (limit === 10) { min = 1; max = 10; }
  else if (limit === 25) { min = 11; max = 25; }
  else if (limit === 50) { min = 26; max = 50; }
  else if (limit === 100) { min = 51; max = 100; }
  else if (limit === 250) { min = 101; max = 250; }
  else if (limit === 500) { min = 251; max = 500; }
  else if (limit === 1000) { min = 501; max = 1000; }

  const filtered = allApis.filter(api => {
    let raw = String(api.price || "0").trim();
    let price = parseInt(raw.replace(/\D/g, ""), 10);
    if (isNaN(price)) price = 0;
    return price >= min && price <= max;
  });

  displayApis(filtered, "No APIs found in this coin range 💰. Try another filter.");
}

// ==== UPDATE REACTIONS IN FULL API VIEW ====
function updateFullApiReactions(apiId) {
  const api = allApis.find(a => a.id === apiId);
  if (!api) return;

  const likes = api.likes?.length || 0;
  const dislikes = api.dislikes?.length || 0;
  const comments = api.comments?.length || 0;

  // Full view
  const likeBtnFull = document.querySelector(`#apiFullContent button[data-type="like"][data-api="${apiId}"]`);
  const dislikeBtnFull = document.querySelector(`#apiFullContent button[data-type="dislike"][data-api="${apiId}"]`);
  const commentBtnFull = document.querySelector(`#apiFullContent button[data-type="comment"][data-api="${apiId}"]`);

  if (likeBtnFull) likeBtnFull.innerText = `👍 ${likes}`;
  if (dislikeBtnFull) dislikeBtnFull.innerText = `👎 ${dislikes}`;
  if (commentBtnFull) commentBtnFull.innerText = `💬 ${comments}`;

  // Marketplace card
  const likeSpan = document.getElementById(`likes-${apiId}`);
  const dislikeSpan = document.getElementById(`dislikes-${apiId}`);
  const commentSpan = document.getElementById(`comments-${apiId}`);

  if (likeSpan) likeSpan.innerText = `👍 ${likes}`;
  if (dislikeSpan) dislikeSpan.innerText = `👎 ${dislikes}`;
  if (commentSpan) commentSpan.innerText = `💬 ${comments}`;
}

// ==== LIKE ====
async function likeApi(event, apiId) {
  event.stopPropagation();
  try {
    const api = allApis.find(a => a.id === apiId);
    if (!api) return showPopup("API not found.");

    const alreadyLiked = api.likes?.includes(userId);

    const res = await fetch('/api/marketplace/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiId, type: 'like', userId })
    });
    const data = await res.json();

    if (data.success) {
      // Update local allApis with server response
      const index = allApis.findIndex(a => a.id === apiId);
      if (index !== -1) {
        allApis[index].likes = data.api.likes || [];
        allApis[index].dislikes = data.api.dislikes || [];
      }

      showPopup(alreadyLiked ? "You unliked this API 😅" : "You liked this API! 👍");
      updateFullApiReactions(apiId);
    } else {
      showPopup(data.message || "Failed to like.");
    }
  } catch {
    showPopup("Like failed. Try again later.");
  }
}

// ==== DISLIKE ====
async function dislikeApi(event, apiId) {
  event.stopPropagation();
  try {
    const api = allApis.find(a => a.id === apiId);
    if (!api) return showPopup("API not found.");

    const alreadyDisliked = api.dislikes?.includes(userId);

    const res = await fetch('/api/marketplace/react', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiId, type: 'dislike', userId })
    });
    const data = await res.json();

    if (data.success) {
      const index = allApis.findIndex(a => a.id === apiId);
      if (index !== -1) {
        allApis[index].likes = data.api.likes || [];
        allApis[index].dislikes = data.api.dislikes || [];
      }

      showPopup(alreadyDisliked ? "You removed your dislike 😅" : "You disliked this API! 👎");
      updateFullApiReactions(apiId); // <-- only update counts
    } else {
      showPopup(data.message || "Failed to dislike.");
    }
  } catch {
    showPopup("Dislike failed. Try again later.");
  }
}

  async function updateApi(apiId) {
    try {
      const res = await fetch(`/api/marketplace/update/${apiId}`, { method: "PATCH" });
      const data = await res.json();
      showPopup(data.message || "Updated!");
      if (data.success) showFullApi(apiId); // refresh view
    } catch (err) {
      showPopup("Update failed. Try again.");
    }
  }

// ==== COMMENTS ====
async function openCommentModal(apiId) {
  document.getElementById("commentModal").style.display = "flex";
  document.getElementById("commentModal").dataset.api = apiId;
  await loadComments(apiId);
}
function closeCommentModal() {
  document.getElementById("commentModal").style.display = "none";
  document.getElementById("commentBox").value = "";
}

// ==== SUBMIT COMMENT / REPLY ====
async function submitComment() {
  const commentText = document.getElementById("commentBox").value.trim();
  const apiId = document.getElementById("commentModal").dataset.api;
  const commentId = document.getElementById("commentModal").dataset.editing;
  const replyId = document.getElementById("commentModal").dataset.editingReply;

  if (!commentText) return showPopup("Please type a comment first.");

  try {
    let url = '/api/marketplace/react';
    let body = {
      apiId,
      type: 'comment',
      userId,
      username: localStorage.getItem('mxapi_username'),
      commentText,
      edit: !!commentId,
      commentId
    };

    if (replyId) {
      url = `/api/marketplace/comment/reply/${apiId}/${commentId}/${replyId}`;
      body = { userId, text: commentText };
    } else if (replyingTo) {
      url = '/api/marketplace/reply';
      body = {
        apiId,
        commentId: replyingTo.commentId,
        userId,
        username: localStorage.getItem('mxapi_username'),
        text: commentText
      };
    }

    const res = await fetch(url, {
      method: replyId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    if (!data.success) return showPopup(data.message || "Failed to submit.");

    showPopup(
      replyId
        ? "Reply edited successfully!"
        : replyingTo
        ? "Reply added successfully!"
        : commentId
        ? "Comment edited successfully!"
        : "Comment added successfully!"
    );

    document.getElementById("commentModal").dataset.editing = "";
    document.getElementById("commentModal").dataset.editingReply = "";
    document.getElementById("commentBox").value = "";
    cancelReply();

    // Update local allApis comments for accurate read-more
    const apiIndex = allApis.findIndex(a => a.id === apiId);
    if (apiIndex !== -1) {
      if (replyId) {
        const comment = allApis[apiIndex].comments.find(c => c._id === commentId);
        const reply = comment.replies.find(r => r._id === replyId);
        if (reply) { reply.text = commentText; reply.edited = true; }
      } else if (replyingTo) {
        const parentComment = allApis[apiIndex].comments.find(c => c._id === replyingTo.commentId);
        if (!parentComment.replies) parentComment.replies = [];
        parentComment.replies.push({
          _id: data.replies[data.replies.length - 1]?._id || Date.now(),
          userId,
          username: localStorage.getItem('mxapi_username'),
          text: commentText
        });
      } else if (commentId) {
        allApis[apiIndex].comments = data.comments || allApis[apiIndex].comments;
      } else {
        allApis[apiIndex].comments = allApis[apiIndex].comments || [];
        const newComment = {
          _id: data.newCommentId,
          userId,
          username: localStorage.getItem('mxapi_username'),
          text: commentText
        };
        allApis[apiIndex].comments.push(newComment);

        // Immediately render it fully (no read-more yet)
        commentContainer.innerHTML += `
          <div class="comment" style="margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #444;">
            ${renderCommentText(newComment, true)}
          </div>
        `;
      }
    }

    updateFullApiReactions(apiId);
    await loadComments(apiId);
  } catch (err) {
    console.error(err);
    showPopup("Failed to submit comment/reply. Try again.");
  }
}

function formatRelativeTime(dateString) {
  const now = new Date();
  const past = new Date(dateString);
  const diff = now - past; // difference in ms

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''}`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? 's' : ''}`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? 's' : ''}`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} wk${weeks > 1 ? 's' : ''}`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;

  const years = Math.floor(days / 365);
  return `${years} yr${years > 1 ? 's' : ''}`;
}

// ==== LOAD COMMENTS ====
async function loadComments(apiId) {
  // Add this line at the top of your JS (after DOM load or inside loadComments):
const commentContainer = document.getElementById("comment-container");
  commentContainer.innerHTML = `<p style="color:#aaa;">Loading comments...</p>`;

  try {
    const res = await fetch(`/api/marketplace/comments/${apiId}`);
    const data = await res.json();

    if (!data.success || !data.comments.length) {
      commentContainer.innerHTML = `<p style="color:#aaa;">No comments yet. Be the first! 🥇</p>`;
      return;
    }

    commentContainer.innerHTML = "";
    const firstCommenterId = data.firstCommenter?.userId;

    data.comments.forEach(c => {
      const isFirst = c.userId === firstCommenterId;
      const editable = c.userId === userId;
      const date = formatRelativeTime(c.createdAt);
      const isOwner = allApis.find(a => a.id === apiId)?.owner === c.username;
      const repliesCount = c.replies?.length || 0;

      commentContainer.innerHTML += `
        <div class="comment" style="margin-bottom:12px; padding-bottom:6px; border-bottom:1px solid #444;">
          <p style="font-size:0.85rem; color:#fff; margin-bottom:4px;">
            ${c.username || 'Anonymous'} 
            ${isOwner ? '<span style="color:#facc15; font-size:0.75rem;">• 👑 Owner</span>' : ''}
            ${isFirst ? '<span style="color:#38bdf8; font-size:0.75rem;">• 🥇 First Comment</span>' : ''}
            <span style="color:#888; font-size:0.75rem;">• ${date}</span>
          </p>

          ${renderCommentText(c)}

          <div style="display:flex; gap:6px; margin-bottom:4px;">
            <button onclick="startReply('${c._id}', '${c.username}')" class="btn-gray" style="padding:2px 6px; font-size:0.75rem;">💬 Reply</button>
            ${editable ? `<button onclick="editComment('${apiId}', '${c._id}', \`${escapeHTML(c.text)}\`)" 
  class="btn-gray" style="padding:2px 6px; font-size:0.75rem;">✏️</button>` : ''}
            ${editable ? `<button onclick="deleteComment('${apiId}', '${c._id}', this)" class="btn-red" style="padding:2px 6px; font-size:0.75rem;">🗑️</button>` : ''}
            ${repliesCount ? `<button onclick="toggleReplies('${c._id}')" class="btn-gray" style="padding:2px 6px; font-size:0.75rem;">👁️ ${repliesCount} Replies</button>` : ''}
          </div>

          <div id="replies-${c._id}" style="margin-left:16px; border-left:2px solid #444; padding-left:6px; display:none;"></div>
        </div>
      `;

      // Preload replies inside hidden div
      if (c.replies && c.replies.length) {
        const repliesDiv = document.getElementById(`replies-${c._id}`);
        c.replies.forEach(r => {
          const isReplyOwner = r.userId === userId;
          const replyDate = formatRelativeTime(r.createdAt || Date.now());
          repliesDiv.innerHTML += `
            <div style="margin-top:6px; padding:4px; background:#1f1f2f; border-radius:6px;">
              <p style="font-size:0.8rem; color:#aaa;">
                ${r.username || 'Anonymous'}${isReplyOwner ? ' • You' : ''} • ${replyDate}
              </p>
              ${renderCommentText(r)}
              ${isReplyOwner ? `
                <div style="display:flex; gap:4px; margin-top:2px;">
<button onclick="editReply('${c._id}', '${r._id}', '${apiId}', \`${escapeHTML(r.text)}\`)" 
  class="btn-gray" style="font-size:0.7rem; padding:2px 4px;">✏️</button>
                  <button onclick="deleteReply('${c._id}', '${r._id}', '${apiId}')" class="btn-red" style="font-size:0.7rem; padding:2px 4px;">🗑️</button>
                </div>` : ''}
            </div>
          `;
        });
      }
    });
  } catch {
    commentContainer.innerHTML = `<p style="color:#f87171;">⚠️ Failed to load comments.</p>`;
  }
}

function editReply(commentId, replyId, apiId, text) {
  const modal = document.getElementById("commentModal");
  modal.dataset.api = apiId;
  modal.dataset.editing = commentId;       // parent comment
  modal.dataset.editingReply = replyId;    // reply being edited
  document.getElementById("commentBox").value = text; // safe string
  modal.style.display = "flex";
}

async function deleteReply(commentId, replyId, apiId) {
  try {
    const res = await fetch(`/api/marketplace/comment/reply/${apiId}/${commentId}/${replyId}?userId=${userId}`, {
      method: "DELETE",
    });
    const data = await res.json();
    if (data.success) {
      showPopup("Reply deleted successfully!");
      await loadComments(apiId);
    } else {
      showPopup(data.message || "Failed to delete reply.");
    }
  } catch (err) {
    console.error(err);
    showPopup("Failed to delete reply.");
  }
}

// Toggle replies visibility
function toggleReplies(commentId) {
  const repliesDiv = document.getElementById(`replies-${commentId}`);
  if (!repliesDiv) return;
  repliesDiv.style.display = repliesDiv.style.display === "none" ? "block" : "none";
}

function startReply(commentId, username) {
  replyingTo = { commentId, username };
  document.getElementById("replyInfo").style.display = "block";
  document.getElementById("replyToName").innerText = escapeHTML(username);
  document.getElementById("commentBox").placeholder = `Reply to ${escapeHTML(username)}...`;
  document.getElementById("commentBox").focus();
}

function cancelReply() {
  replyingTo = null;
  document.getElementById("replyInfo").style.display = "none";
  document.getElementById("replyToName").innerText = '';
  document.getElementById("commentBox").placeholder = "Type your comment...";
}

async function deleteComment(apiId, commentId, btn) {
  if (!btn) btn = event?.target;
  const originalText = btn?.innerText || "🗑️";

  if (btn) {
    btn.disabled = true;
    btn.innerText = "Deleting...";
  }

  try {
    const res = await fetch(`/api/marketplace/comment/${apiId}/${commentId}?userId=${userId}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (!data.success) throw new Error(data.message || "Failed to delete comment.");

    // Remove comment locally
    const apiIndex = allApis.findIndex(a => a.id === apiId);
    if (apiIndex !== -1) {
      allApis[apiIndex].comments = (allApis[apiIndex].comments || [])
        .filter(c => c._id !== commentId);
    }

    // Update counts immediately
    updateFullApiReactions(apiId);

    // Reload comments
    await loadComments(apiId);

    showPopup("Comment deleted successfully!");
  } catch (err) {
    console.error(err);
    showPopup(err.message || "Error deleting comment. Try again.");
    if (btn) {
      btn.disabled = false;
      btn.innerText = originalText;
    }
  }
}

function truncateWords(text, maxWords = 150) {
  if (!text) return '';
  const words = text.split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(' ');
}
function escapeHTML(str) {
  if (!str) return '';
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Render comment text with "Read more"
function renderCommentText(item, expanded = false) {
  const shortText = escapeHTML(item.text || "");
  const needsReadMore = shortText.length > 120; // adjust threshold

  return `
    <div class="${item.replies ? 'comment-text' : 'reply-text'} ${expanded ? 'expanded' : ''}" id="text-${item._id}">
      ${shortText}
    </div>
    ${needsReadMore ? `<span class="read-more" onclick="toggleReadMore('${item._id}')">Read more</span>` : ''}
  `;
}

function toggleReadMore(commentId, fullText) {
  const p = document.querySelector(`#comment-${commentId} .comment-text`);
  if (!p) return;

  if (p.dataset.expanded === "true") {
    // collapse
    p.innerHTML = `${fullText.slice(0, 120)}...
      <span class="read-more" onclick="toggleReadMore('${commentId}', '${fullText.replace(/'/g,"&#39;")}')">Read more</span>`;
    p.dataset.expanded = "false";
  } else {
    // expand
    p.innerHTML = `${fullText}
      <span class="read-more" onclick="toggleReadMore('${commentId}', '${fullText.replace(/'/g,"&#39;")}')">Show less</span>`;
    p.dataset.expanded = "true";
  }
}

function findCommentById(commentId) {
  for (const api of allApis) {
    const main = api.comments?.find(c => c._id === commentId);
    if (main) return main;
    for (const c of api.comments || []) {
      const reply = c.replies?.find(rp => rp._id === commentId);
      if (reply) return reply;
    }
  }
  return null;
}

function editComment(apiId, commentId, text) {
  document.getElementById("commentBox").value = text;
  document.getElementById("commentModal").dataset.editing = commentId;
  document.getElementById("commentModal").dataset.api = apiId;
  document.getElementById("commentModal").style.display = "flex";
}

function reportComment(apiId) {
  const message = `⚠️ Please copy this API ID: ${apiId}.
It helps us track your report and also identify the API owner. 
After copying, you’ll be redirected to the contact page where you can describe the issue.`;

  showPopup(message, () => {
    window.location.href = "contact.html";
  });
}

fetchMarketplaceApis();