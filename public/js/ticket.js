// Toast
function showToast(msg, type = "info") {
  const toast = document.getElementById("toast");
  toast.textContent = msg;
  toast.className = `toast show ${type}`;
  setTimeout(() => { toast.className = "toast"; }, 3000);
}

const token = localStorage.getItem("mxapi_token");
const publicId = localStorage.getItem("mxapi_id");
if (!token || !publicId) { window.location.href = "index.html"; }

const API = "https://mxapi-lnc.onrender.com/api/tickets";
let ticketsData = [];

// Fetch tickets
async function fetchTickets() {
  try {
    const res = await fetch(API, { headers: { Authorization: `Bearer ${token}` } });
    const data = await res.json();
    ticketsData = data.tickets || [];
    renderTickets();
  } catch (err) { console.error(err); }
}

// Render ticket list
function renderTickets() {
  const list = document.getElementById("ticketList");
  list.innerHTML = "";
  const searchVal = document.getElementById("search").value.toLowerCase();
  const statusVal = document.getElementById("statusFilter").value;

  const filtered = ticketsData.filter(t => {
    return (!statusVal || t.status.toLowerCase() === statusVal.toLowerCase()) &&
           (t.subject.toLowerCase().includes(searchVal) || t.message.toLowerCase().includes(searchVal));
  });

  if (filtered.length === 0) {
    const emptyMsg = document.createElement("div");
    emptyMsg.style.textAlign = "center";
    emptyMsg.style.padding = "40px 20px";
    emptyMsg.style.color = "#aaa";
    emptyMsg.style.fontSize = "15px";
    emptyMsg.innerHTML = "😢 No tickets found!";
    list.appendChild(emptyMsg);
    return;
  }

  filtered.forEach(t => {
    const div = document.createElement("div");
    div.className = "ticket";

    // subject
    const titleSpan = document.createElement("span");
    titleSpan.textContent = t.subject;

    // status
    const statusSpan = document.createElement("span");
    statusSpan.className = "status";
    statusSpan.textContent = t.status;

    // delete button (beside status)
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete";
    deleteBtn.innerHTML = "🗑️";
    deleteBtn.title = "Delete Ticket";

    // reply button
    const replyBtn = document.createElement("button");
    replyBtn.className = "reply";
    replyBtn.innerHTML = "↩️";
    replyBtn.title = "Reply to Ticket";

    // reply action
    replyBtn.onclick = (e) => {
      e.stopPropagation();
      openTicket(t); // open ticket detail
      document.getElementById("replyBox").style.display = "block";
    };

    // delete action
    deleteBtn.onclick = async (e) => {
      e.stopPropagation();
      deleteBtn.innerHTML = `<span class="deleting-text">Deleting...</span>`;
      deleteBtn.disabled = true;

      try {
        const res = await fetch(`${API}/${t._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json(); // 👈 always read response body

        if (res.ok) {
          showToast(data.msg || "✅ Ticket deleted successfully", "success");
          fetchTickets();
        } else {
          showToast(`${data.msg || "Failed to delete ticket"}`, "error");
          deleteBtn.innerHTML = "🗑️";
          deleteBtn.disabled = false;
        }
      } catch (err) {
        console.error(err);
        showToast("❌ Server error while deleting", "error");
        deleteBtn.innerHTML = "🗑️";
        deleteBtn.disabled = false;
      }
    };

    // right-side container for status + delete
    const rightBox = document.createElement("div");
    rightBox.style.display = "flex";
    rightBox.style.alignItems = "center";
    rightBox.style.gap = "8px";
    rightBox.appendChild(statusSpan);
    rightBox.appendChild(replyBtn);
    rightBox.appendChild(deleteBtn);

    div.appendChild(titleSpan);
    div.appendChild(rightBox);

    // open detail on click
    div.onclick = () => openTicket(t);

    list.appendChild(div);
  });
}

function renderReplies(ticket) {
  const repliesSection = document.getElementById("repliesSection");
  const repliesList = document.getElementById("repliesList");
  repliesList.innerHTML = "";

  if (!ticket.replies || ticket.replies.length === 0) {
    repliesSection.style.display = "none"; // hide section if no replies
    return;
  }

  repliesSection.style.display = "block"; // show only if replies exist

  ticket.replies.forEach(r => {
    const wrapper = document.createElement("div");
    wrapper.className = "reply-card";

    // if admin reply, add a badge
    let userLabel = r.username || "Unknown";
    if (r.isAdmin) {
      userLabel = `👑 ${r.username} (Admin)`;
    } else {
      userLabel = `👤 ${r.username}`;
    }

    wrapper.innerHTML = `
      <div class="reply-header">
        <span class="reply-user">${userLabel}</span>
        <span class="reply-date">${new Date(r.createdAt).toLocaleString()}</span>
      </div>
      <div class="reply-message">${r.message}</div>
    `;

    repliesList.appendChild(wrapper);
  });
}
document.getElementById("search").addEventListener("input", renderTickets);
document.getElementById("statusFilter").addEventListener("change", renderTickets);

// Overlay and form elements
const overlayBG = document.getElementById("ticketOverlay");
const subjectInput = document.getElementById("subject");
const messageInput = document.getElementById("message");
const typeInput = document.getElementById("type");
const categoryInput = document.getElementById("category");

subjectInput.addEventListener("input", () => { document.getElementById("subjectCount").textContent = `${subjectInput.value.length}/200`; });
messageInput.addEventListener("input", () => { document.getElementById("messageCount").textContent = `${messageInput.value.length}/1000`; });

function openCreate() {
  document.getElementById("overlayTitle").textContent = "Create Ticket";
  document.getElementById("overlayStatus").style.display = "none";
  document.getElementById("ticketForm").style.display = "block";
  document.getElementById("ticketView").style.display = "none";
  overlayBG.style.display = "block";

  subjectInput.value = "";
  messageInput.value = "";
  typeInput.value = "Medium";
  categoryInput.value = "";
  document.getElementById("subjectCount").textContent = "0/200";
  document.getElementById("messageCount").textContent = "0/1000";
  document.getElementById("repliesSection").style.display = "none";
  document.getElementById("repliesList").innerHTML = "";
}

let currentTicketId = null;
function openTicket(ticket) {
  currentTicketId = ticket._id;
  if (!ticket || !ticket.subject) {
    renderReplies(ticket);
    showToast("❌ Error: Ticket not found!", "error");
    return;
  }

  // Autofill username
  document.getElementById("replyUser").textContent = ticket.username || "Unknown User";

  // Reset reply fields
  document.getElementById("replyMessage").value = "";
  document.getElementById("replyCount").textContent = "0/1000";
  document.getElementById("replyAttachments").value = "";

  // Auto scroll down to reply box
  setTimeout(() => {
    document.getElementById("replyBox").scrollIntoView({ behavior: "smooth" });
  }, 300);

  // Character count
  document.getElementById("replyMessage").addEventListener("input", () => {
    document.getElementById("replyCount").textContent =
      `${document.getElementById("replyMessage").value.length}/1000`;
  });

  // Ticket detail setup
  document.getElementById("overlayTitle").textContent = "Ticket Detail";
  const statusSpan = document.getElementById("overlayStatus");
  statusSpan.textContent = ticket.status;
  statusSpan.style.display = "inline-block";
  document.getElementById("viewDate").textContent = new Date(ticket.createdAt).toLocaleString();

  document.getElementById("ticketForm").style.display = "none";
  document.getElementById("ticketView").style.display = "block";

  document.getElementById("viewSubject").textContent = ticket.subject;
  document.getElementById("viewUser").textContent = ticket.username || "Unknown User";
  document.getElementById("viewMessage").textContent = ticket.message;
  document.getElementById("viewType").textContent = ticket.type || "N/A";
  document.getElementById("viewCategory").textContent = ticket.category || "N/A";

  // Images
    const imgDiv = document.getElementById("viewImages");
    imgDiv.innerHTML = "";
    if (ticket.attachments && ticket.attachments.length > 0) {
      ticket.attachments.forEach(url => {
        const img = document.createElement("img");
        img.src = url;
        img.style.maxWidth = "100%";
        img.style.marginTop = "10px";
        img.style.borderRadius = "8px";
        img.style.boxShadow = "0 2px 8px rgba(0,0,0,0.4)";
        imgDiv.appendChild(img);
      });
    }

    // 🔥 Render replies when ticket opens
    renderReplies(ticket);

    overlayBG.style.display = "block";
  }

function closeOverlay() {
  overlayBG.style.display = "none";
  closeReply();
}

function closeReply() {
  document.getElementById("replyBox").style.display = "none";
}

async function submitReply() {
  const message = document.getElementById("replyMessage").value.trim();
  const replyBtn = document.getElementById("replyBtn"); // your reply button id

  if (!message) {
    showToast("❌ Reply message cannot be empty", "error");
    return;
  }

  if (!currentTicketId) {
    showToast("❌ No ticket selected", "error");
    return;
  }

  const formData = new FormData();
  formData.append("ticketId", currentTicketId); // ✅ send ticketId
  formData.append("message", message);

  const files = document.getElementById("replyAttachments").files;
  if (files.length > 3) {
    showToast("⚠️ Max 3 files allowed", "error");
    return;
  }
  for (let f of files) formData.append("attachments", f);

  try {
    replyBtn.disabled = true;
    replyBtn.textContent = "Submitting..."; // ✅ show state

    const res = await fetch(`${API}/reply`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const data = await res.json();
    if (res.ok) {
      showToast(data.msg || "✅ Reply submitted", "success");
      renderReplies(data.ticket);
      closeReply();
      document.getElementById("replyMessage").value = "";
      document.getElementById("replyCount").textContent = "0/1000";
      document.getElementById("replyAttachments").value = "";
    } else {
      showToast(`${data.msg || "Failed to send reply"}`, "error");
    }
  } catch (err) {
    console.error(err);
    showToast("❌ Server error while sending reply", "error");
  } finally {
    replyBtn.disabled = false;
    replyBtn.textContent = "Send Reply"; // reset
  }
}

// Ticket form submit
document.getElementById("ticketForm").addEventListener("submit", async e => {
  e.preventDefault();

  const formData = new FormData();
  formData.append("subject", subjectInput.value);
  formData.append("message", messageInput.value);
  formData.append("type", typeInput.value);
  formData.append("category", categoryInput.value);

  const files = document.getElementById("attachments").files;
  if (files.length > 5) { showToast("Max 5 files allowed", "error"); return; }
  for (let f of files) formData.append("attachments", f);

  const btn = e.target.querySelector("button");
  btn.disabled = true;
  btn.textContent = "Saving...";

  try {
    const res = await fetch(API, { 
      method: "POST", 
      headers: { Authorization: `Bearer ${token}` }, 
      body: formData 
    });
    const data = await res.json();

    if (res.ok) {
      showToast(data.msg || "✅ Ticket created", "success");
      fetchTickets();
      closeOverlay();
    } else {
      showToast(`${data.msg || "Failed to create ticket"}`, "error");
    }
  } catch (err) {
    showToast("❌ Server error", "error");
    console.error(err);
  }

  btn.disabled = false;
  btn.textContent = "Create Ticket";
});

fetchTickets();

const API_BASE = "https://mxapi-lnc.onrender.com";
async function fetchUser() {
  try {
    const res = await fetch(`${API_BASE}/api/auth/user/${publicId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to fetch user");
    const data = await res.json();

    // 👇 Set profile image
    const avatarUrl = data.user?.avatarUrl || "lumora.png";
    document.getElementById("profileImage").src = avatarUrl;

  } catch (err) {
    console.error("Error fetching user:", err);
  }
}

fetchUser();

document.getElementById("backToggle").addEventListener("click", () => {
  window.location.href = "dashboard.html"; // 👈 redirect to dashboard
});
