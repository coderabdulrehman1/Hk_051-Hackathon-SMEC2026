const API = "http://localhost:3000";
const role = localStorage.getItem("role");
const userName = localStorage.getItem("name") || "User";
let calendarInstance = null; // Store calendar instance globally
let currentDisplayedDate = null; // Store currently displayed date

if (!role) window.location = "login.html";
if (role === "admin") document.getElementById("admin").style.display = "block";

// Display user name
const userNameElement = document.getElementById("userName");
if (userNameElement) {
  userNameElement.textContent = `👤 ${userName}`;
}

function logout() {
  localStorage.clear();
  window.location = "login.html";
}

async function loadResources() {
  const res = await fetch(`${API}/resources`);
  const data = await res.json();
  resource.innerHTML = data.map(r =>
    `<option value="${r.id}">${r.name}</option>`
  ).join("");
}

async function book() {
  if (!resource.value || !date.value || !time.value) {
    alert("Please fill in all fields");
    return;
  }
  
  const res = await fetch(`${API}/book`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      resourceId: resource.value,
      date: date.value,
      time: time.value
    })
  });
  
  const data = await res.json();
  alert(data.message);
  
  if (res.ok) {
    // Get the date that was booked before resetting
    const bookedDate = document.getElementById("date").value;
    
    // Reset form
    document.getElementById("date").value = "";
    document.getElementById("time").value = "";
    loadCalendar();
    loadAdmin();
    
    // Refresh day bookings to show new booking
    if (bookedDate) {
      showDayBookings(bookedDate);
    } else {
      loadTodayBookings();
    }
  }
}

async function loadCalendar() {
  const res = await fetch(`${API}/bookings`);
  const data = await res.json();
  
  // Get resources for display
  const resourcesRes = await fetch(`${API}/resources`);
  const resources = await resourcesRes.json();

  const events = data
    .filter(b => b.status === "Approved")
    .map(b => {
      const resource = resources.find(r => r.id == b.resourceId);
      const resourceName = resource ? resource.name : `Resource ${b.resourceId}`;
      return {
        title: resourceName,
        start: `${b.date}T${b.time}`,
        color: '#667eea'
      };
    });

  const calendarEl = document.getElementById("calendar");
  if (calendarEl) {
    // Clear existing calendar if any
    calendarEl.innerHTML = "";
    
    calendarInstance = new FullCalendar.Calendar(calendarEl, {
      initialView: "dayGridMonth",
      headerToolbar: {
        left: "prev,next today",
        center: "title",
        right: "dayGridMonth,timeGridWeek,timeGridDay"
      },
      events,
      eventDisplay: 'block',
      height: 'auto',
      dateClick: function(info) {
        // Format date as YYYY-MM-DD
        const selectedDate = info.dateStr;
        showDayBookings(selectedDate);
      }
    });

    calendarInstance.render();
  }
}

async function loadAdmin() {
  if (role !== "admin") return;
  const res = await fetch(`${API}/bookings`);
  const data = await res.json();
  
  if (data.length === 0) {
    adminBookings.innerHTML = '<p style="text-align: center; color: #666; padding: 20px;">No bookings to review</p>';
    return;
  }
  
  // Get resources for display
  const resourcesRes = await fetch(`${API}/resources`);
  const resources = await resourcesRes.json();
  
  adminBookings.innerHTML = data.map(b => {
    const resource = resources.find(r => r.id == b.resourceId);
    const resourceName = resource ? resource.name : `Resource ${b.resourceId}`;
    const statusClass = b.status.toLowerCase();
    
    return `
      <div class="admin-booking-item">
        <div class="admin-booking-info">
          <h3>${resourceName}</h3>
          <p>📅 Date: ${b.date}</p>
          <p>🕐 Time: ${b.time}</p>
          <span class="status-badge status-${statusClass}">${b.status}</span>
        </div>
        <div class="admin-actions">
          <button class="btn-approve" onclick="update(${b.id}, 'Approved')">✓ Approve</button>
          <button class="btn-decline" onclick="update(${b.id}, 'Declined')">✗ Decline</button>
        </div>
      </div>
    `;
  }).join("");
}

async function update(id, status) {
  await fetch(`${API}/admin/update`, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({ id, status })
  });
  loadAdmin();
  loadCalendar();
  
  // Refresh day bookings to show updated status
  if (currentDisplayedDate) {
    showDayBookings(currentDisplayedDate);
  } else {
    loadTodayBookings();
  }
}

// Function to format date for display
function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const selectedDate = new Date(date);
  selectedDate.setHours(0, 0, 0, 0);
  
  if (selectedDate.getTime() === today.getTime()) {
    return "Today";
  }
  
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
}

// Function to show bookings for a specific date
async function showDayBookings(dateStr) {
  currentDisplayedDate = dateStr; // Store current displayed date
  
  const res = await fetch(`${API}/bookings`);
  const bookings = await res.json();
  
  // Get resources for display
  const resourcesRes = await fetch(`${API}/resources`);
  const resources = await resourcesRes.json();
  
  // Filter bookings for the selected date
  const dayBookings = bookings.filter(b => b.date === dateStr);
  
  const dayBookingsContainer = document.getElementById("dayBookings");
  const dayBookingsTitle = document.getElementById("dayBookingsTitle");
  const dayBookingsSubtitle = document.getElementById("dayBookingsSubtitle");
  
  // Update title
  const formattedDate = formatDate(dateStr);
  dayBookingsTitle.textContent = `📋 Bookings for ${formattedDate}`;
  dayBookingsSubtitle.textContent = `${dayBookings.length} booking(s) found`;
  
  if (dayBookings.length === 0) {
    dayBookingsContainer.innerHTML = `
      <div class="no-bookings">
        <p>No bookings scheduled for this date.</p>
        <p class="sub-text">Click on the calendar to view bookings for other dates.</p>
      </div>
    `;
    return;
  }
  
  // Sort bookings by time
  dayBookings.sort((a, b) => a.time.localeCompare(b.time));
  
  dayBookingsContainer.innerHTML = dayBookings.map(b => {
    const resource = resources.find(r => r.id == b.resourceId);
    const resourceName = resource ? resource.name : `Resource ${b.resourceId}`;
    const statusClass = b.status.toLowerCase();
    
    return `
      <div class="day-booking-item">
        <div class="day-booking-time">
          <span class="time-display">🕐 ${b.time}</span>
        </div>
        <div class="day-booking-info">
          <h3>${resourceName}</h3>
          <span class="status-badge status-${statusClass}">${b.status}</span>
        </div>
      </div>
    `;
  }).join("");
}

// Load today's bookings on page load
function loadTodayBookings() {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  showDayBookings(todayStr);
}

loadResources();
loadCalendar();
loadAdmin();
loadTodayBookings();