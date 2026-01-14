const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* USERS */
const users = [
  { email: "user@campus.com", password: "1234", name: "User", role: "user" },
  { email: "admin@campus.com", password: "admin", name: "Admin", role: "admin" }
];

/* DATA */
let resources = [
  { id: 1, name: "Computer Lab A" },
  { id: 2, name: "Auditorium Hall" }
];

let bookings = [];

/* SIGNUP */
app.post("/signup", (req, res) => {
  const { email, password, name } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }
  
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: "Email already exists" });
  }
  
  const newUser = {
    email,
    password,
    name: name || email.split("@")[0],
    role: "user"
  };
  
  users.push(newUser);
  console.log(`✅ New user registered: ${email}`);
  res.json({ message: "Signup successful", role: newUser.role });
});

/* LOGIN */
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ role: user.role, name: user.name });
});

/* GET resources */
app.get("/resources", (req, res) => res.json(resources));

/* GET bookings */
app.get("/bookings", (req, res) => res.json(bookings));

/* BOOK SLOT */
app.post("/book", (req, res) => {
  const { resourceId, date, time } = req.body;

  const conflict = bookings.find(
    b => b.resourceId == resourceId &&
         b.date == date &&
         b.time == time &&
         b.status === "Approved"
  );

  if (conflict)
    return res.status(400).json({ message: "Slot already booked" });

  bookings.push({
    id: Date.now(),
    resourceId,
    date,
    time,
    status: "Pending"
  });

  console.log("📧 Booking request sent");
  res.json({ message: "Booking requested" });
});

/* ADMIN UPDATE */
app.post("/admin/update", (req, res) => {
  const { id, status } = req.body;
  const booking = bookings.find(b => b.id === id);
  booking.status = status;
  console.log(`📩 Notification: ${status}`);
  res.json({ message: "Updated" });
});

app.listen(3000, () =>
  console.log("🚀 Backend running on http://localhost:3000")
);
