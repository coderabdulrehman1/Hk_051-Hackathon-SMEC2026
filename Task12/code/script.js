// Initialize map (Karachi coordinates)
let map = L.map('map').setView([24.8607, 67.0011], 12);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Load rides from localStorage
let rides = JSON.parse(localStorage.getItem('uniRides')) || [];

// Save rides to localStorage
function saveRides() {
    localStorage.setItem('uniRides', JSON.stringify(rides));
}

// Show specific tab
function showTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="showTab('${tabId}')"]`).classList.add('active');
    if (tabId === 'history') displayHistory();
}

// Post new ride
document.getElementById('postRideForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const ride = {
        id: Date.now(),
        from: document.getElementById('from').value,
        to: document.getElementById('to').value,
        time: document.getElementById('time').value,
        seats: parseInt(document.getElementById('seats').value),
        booked: 0, // number of seats booked
        driver: "You" // fake user
    };
    rides.push(ride);
    saveRides();
    alert('Ride posted successfully!');
    e.target.reset();
    showTab('find');
    displayRides();
});

// Display available rides
function displayRides(filteredRides = rides) {
    const list = document.getElementById('rideList');
    list.innerHTML = '';
    filteredRides.forEach(ride => {
        if (ride.seats - ride.booked > 0) { // only show if seats available
            const div = document.createElement('div');
            div.className = 'ride-card';
            div.innerHTML = `
                <strong>${ride.from} → ${ride.to}</strong><br>
                Time: ${new Date(ride.time).toLocaleString()}<br>
                Available Seats: ${ride.seats - ride.booked}/${ride.seats}<br>
                Driver: ${ride.driver}
                <button class="book-btn" onclick="bookSeat(${ride.id})">Book Seat</button>
            `;
            div.onclick = () => showRouteOnMap(ride.from, ride.to);
            list.appendChild(div);
        }
    });
}

// Book a seat
function bookSeat(id) {
    const ride = rides.find(r => r.id === id);
    if (ride && ride.seats - ride.booked > 0) {
        ride.booked++;
        saveRides();
        alert('Seat booked successfully!');
        displayRides();
        displayHistory();
    } else {
        alert('No seats available!');
    }
}

// Search rides
function searchRides() {
    const from = document.getElementById('searchFrom').value.toLowerCase();
    const to = document.getElementById('searchTo').value.toLowerCase();
    const filtered = rides.filter(ride => 
        ride.from.toLowerCase().includes(from) && 
        ride.to.toLowerCase().includes(to) &&
        ride.seats - ride.booked > 0
    );
    displayRides(filtered);
}

// Show simple route on map (markers only)
function showRouteOnMap(from, to) {
    // Fake coordinates for Karachi locations
    const locations = {
        'ku gate': [24.8607, 67.0011],
        'gulshan': [24.9160, 67.0900],
        'clifton': [24.8030, 67.0260],
        'defence': [24.8170, 67.0750]
    };
    map.eachLayer(layer => { if (layer instanceof L.Marker) map.removeLayer(layer); });

    const fromCoord = locations[from.toLowerCase()] || [24.8607, 67.0011];
    const toCoord = locations[to.toLowerCase()] || [24.9160, 67.0900];

    L.marker(fromCoord).addTo(map).bindPopup(from);
    L.marker(toCoord).addTo(map).bindPopup(to);
    map.fitBounds([fromCoord, toCoord]);
}

// Display ride history
function displayHistory() {
    const list = document.getElementById('historyList');
    list.innerHTML = '';
    rides.forEach(ride => {
        const div = document.createElement('div');
        div.className = 'ride-card';
        div.innerHTML = `
            <strong>${ride.from} → ${ride.to}</strong><br>
            Time: ${new Date(ride.time).toLocaleString()}<br>
            Seats: ${ride.seats - ride.booked}/${ride.seats} available<br>
            Status: ${ride.seats - ride.booked > 0 ? 'Active' : 'Full'}
        `;
        list.appendChild(div);
    });
}

// Initial load
displayRides();
showTab('post');