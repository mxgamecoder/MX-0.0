const sidebar = document.getElementById('sidebar');
  const toggleButton = document.getElementById('sidebarToggle');
  const bodyOverlay = document.getElementById('bodyOverlay');

  const closeSidebar = () => {
    sidebar.classList.remove('open');
    bodyOverlay.classList.remove('show');
  };
  toggleButton.addEventListener('click', () => {
    sidebar.classList.add('open');
    bodyOverlay.classList.add('show');
  });
  bodyOverlay.addEventListener('click', closeSidebar);

  async function fetchUser(publicId, token) {
    try {
      const res = await fetch(`/api/auth/user/${publicId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch user");
      const data = await res.json();
      return data.user;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  function initSession() {
    const token = localStorage.getItem("mxapi_token");
    const publicId = localStorage.getItem("mxapi_id");
    if (!token || !publicId) {
      window.location.href = "index.html";
      return null;
    }
    return { token, publicId };
  }

  window.addEventListener("DOMContentLoaded", async () => {
    const session = initSession();
    if (!session) return;
    const { token, publicId } = session;

    const user = await fetchUser(publicId, token);
    if (!user) return;

    if (window.history.replaceState) {
      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState(null, "", cleanUrl);
    }

    const greetingEl = document.getElementById('greeting');
    const hour = new Date().getHours();
    let greeting = "Welcome";
    if (hour < 12) greeting = "🌅 Good morning";
    else if (hour < 17) greeting = "🌞 Good afternoon";
    else greeting = "🌙 Good evening";

    greetingEl.textContent = `${greeting}, ${user.username} 👋`;
  });

  function logout() {
    localStorage.clear();
    window.location.href = 'index.html';
  }

function openStudio() {
  const agreed = localStorage.getItem("mxapi_tc_agreed");
  if (agreed === "true") {
    // User already accepted → go straight to Studio
    window.location.href = "apistudio.html"; 
  } else {
    // User hasn’t accepted → show T&C first
    window.location.href = "t@c.html";
  }
}