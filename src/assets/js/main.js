function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className =
    "toast " + (type === "error" ? "toast-error" : "toast-success");
  toast.style.display = "block";

  // Ensure toast is visible on mobile
  toast.style.zIndex = "10000";

  // Clear any existing timeout
  if (toast.timeoutId) {
    clearTimeout(toast.timeoutId);
  }

  // Set new timeout
  toast.timeoutId = setTimeout(() => {
    toast.style.display = "none";
  }, 3000);
}

async function loadStreamers() {
  try {
    const response = await fetch("/api/streamers");
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    const streamers = await response.json();
    const listElement = document.getElementById("streamerList");

    listElement.innerHTML = streamers
      .map(
        (streamer) => `
          <div class="streamer-item" id="${streamer.streamer_name}">
              <input type="text" value="${streamer.streamer_name}" aria-label="Streamer name">
              <input type="text" value="${streamer.going_live_message}" aria-label="Going live message">      
              <button class="update-btn" onclick="updateStreamer('${streamer.streamer_name}', this.parentElement.children[0].value, this.parentElement.children[1].value)">Update</button>
              <button class="delete-btn" onclick="deleteStreamer('${streamer.streamer_name}')">Delete</button>
          </div>
      `
      )
      .join("");
  } catch (error) {
    console.error("Error loading streamers:", error);
    showToast("Error loading streamers", "error");
  }
}

async function updateStreamer(oldName, newName, newMessage) {
  try {
    const response = await fetch("/api/streamers", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        oldName,
        newName,
        newMessage,
      }),
    });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    } else if (response.status === 404) {
      showToast("Streamer not found", "error");
    } else if (response.status === 400) {
      showToast("Invalid Twitch username", "error");
    } else {
      showToast("Streamer updated successfully!");
    }
    loadStreamers();
  } catch (error) {
    console.error("Error updating streamer:", error);
    showToast("Error updating streamer", "error");
  }
}

async function deleteStreamer(streamerName) {
  try {
    const response = await fetch("/api/streamers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ streamerName }),
    });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }
    showToast("Streamer deleted successfully!");
    loadStreamers();
  } catch (error) {
    console.error("Error deleting streamer:", error);
    showToast("Error deleting streamer", "error");
  }
}

async function addStreamer() {
  const nameInput = document.getElementById("newStreamerName");
  const messageInput = document.getElementById("newGoingLiveMessage");

  try {
    const response = await fetch("/api/streamers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        streamer_name: nameInput.value,
        going_live_message: messageInput.value,
      }),
    });
    if (response.status === 401) {
      window.location.href = "/login.html";
      return;
    }

    nameInput.value = "";
    messageInput.value = "";
    showToast("Streamer added successfully!");
    loadStreamers();
  } catch (error) {
    console.error("Error adding streamer:", error);
    showToast("Error adding streamer", "error");
  }
}

async function logout() {
  try {
    await fetch("/logout", { method: "POST" });
    window.location.href = "/login.html";
  } catch (error) {
    console.error("Error logging out:", error);
  }
}

// Add touch event handlers for better mobile response
document.addEventListener("DOMContentLoaded", () => {
  loadStreamers();

  // Add touch feedback for buttons
  document.addEventListener(
    "touchstart",
    (e) => {
      if (e.target.matches("button")) {
        e.target.style.opacity = "0.7";
      }
    },
    { passive: true }
  );

  document.addEventListener(
    "touchend",
    (e) => {
      if (e.target.matches("button")) {
        e.target.style.opacity = "1";
      }
    },
    { passive: true }
  );

  // Prevent double-tap zoom on buttons
  document.addEventListener("dblclick", (e) => {
    if (e.target.matches("button")) {
      e.preventDefault();
    }
  });

  // Add form validation
  const addForm = document.querySelector(".add-form");
  addForm.addEventListener("submit", (e) => {
    e.preventDefault();
    addStreamer();
  });

  // Improve input handling
  const inputs = document.querySelectorAll("input");
  inputs.forEach((input) => {
    input.addEventListener("blur", () => {
      window.scrollTo(0, 0);
    });
  });
});
