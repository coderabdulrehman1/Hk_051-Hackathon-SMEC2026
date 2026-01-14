# Campus Resource Booking System

A web-based application for managing campus resource bookings with user authentication and admin approval system.

## Features

- 🔐 User authentication (Login/Signup)
- 📅 Resource booking system
- 📆 Calendar view for availability
- ⚙️ Admin dashboard for managing bookings
- 👥 Role-based access (User/Admin)

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- A modern web browser (Chrome, Firefox, Edge, etc.)

## Project Structure

```
Task09/
├── code/
│   ├── backend/
│   │   ├── server.js          # Express server
│   │   ├── package.json       # Backend dependencies
│   │   └── node_modules/      # Installed packages (auto-generated)
│   └── frontend/
│       ├── index.html         # Main booking interface
│       ├── login.html         # Login page
│       ├── signup.html        # Signup page
│       ├── script.js          # Frontend JavaScript
│       └── styles.css         # Styling
└── README.md                  # This file
```

## Installation & Setup

### Step 1: Install Backend Dependencies

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```bash
   cd Task09/code/backend
   ```

3. Install the required packages:
   ```bash
   npm install
   ```

   This will install:
   - `express` - Web framework for Node.js
   - `cors` - Cross-Origin Resource Sharing middleware

### Step 2: Start the Backend Server

1. Make sure you're still in the `backend` directory
2. Start the server:
   ```bash
   node server.js
   ```

   You should see:
   ```
   🚀 Backend running on http://localhost:3000
   ```

3. **Keep this terminal window open** - the server needs to keep running

### Step 3: Open the Frontend

1. Open a **new terminal/command prompt** window (keep the backend server running)
2. Navigate to the frontend directory:
   ```bash
   cd Task09/code/frontend
   ```

3. Open the application in your browser. You have two options:

   **Option A: Using a local server (Recommended)**
   - If you have Python installed:
     ```bash
     # Python 3
     python -m http.server 8000
     
     # Python 2
     python -m SimpleHTTPServer 8000
     ```
   - Then open: `http://localhost:8000/login.html`

   **Option B: Direct file access**
   - Simply open `login.html` in your web browser
   - Note: Some browsers may have CORS restrictions with this method

## Default Credentials

The system comes with pre-configured accounts:

### Admin Account
- **Email:** `admin@campus.com`
- **Password:** `admin`
- **Role:** Admin (can approve/reject bookings)

### Regular User Account
- **Email:** `user@campus.com`
- **Password:** `1234`
- **Role:** User (can book resources)

## Usage

1. **Sign Up** (or use existing credentials)
   - Go to `signup.html` to create a new account
   - Or use the default credentials above

2. **Login**
   - Go to `login.html`
   - Enter your email and password
   - Click "Login"

3. **Book a Resource**
   - Select a resource from the dropdown
   - Choose a date and time
   - Click "Book Resource"
   - Your booking will be pending until approved by an admin

4. **Admin Functions** (Admin only)
   - View all pending bookings
   - Approve or reject booking requests
   - See all approved bookings

## API Endpoints

The backend server provides the following endpoints:

- `POST /signup` - Create a new user account
- `POST /login` - Authenticate user
- `GET /resources` - Get list of available resources
- `GET /bookings` - Get all bookings
- `POST /book` - Create a new booking request
- `POST /admin/update` - Update booking status (Admin only)

**Base URL:** `http://localhost:3000`

## Troubleshooting

### Backend won't start
- Make sure port 3000 is not already in use
- Check that you've run `npm install` in the backend directory
- Verify Node.js is installed: `node --version`

### Frontend can't connect to backend
- Ensure the backend server is running on `http://localhost:3000`
- Check your browser's console for CORS errors
- Try using a local server instead of opening files directly

### Port already in use
- If port 3000 is busy, you can change it in `server.js`:
  ```javascript
  app.listen(3000, ...)  // Change 3000 to another port
  ```
- Remember to update the frontend API calls accordingly

## Development Notes

- The backend uses in-memory storage (data resets on server restart)
- User passwords are stored in plain text (not recommended for production)
- CORS is enabled for all origins (configure appropriately for production)

## Technologies Used

- **Backend:** Node.js, Express.js
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **External Libraries:** FullCalendar.js

## License

This project is part of a hackathon submission.
