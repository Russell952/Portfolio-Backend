// backend/server.js
require("dotenv").config(); // still needed for local testing

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- MongoDB Setup ---
mongoose
  .connect(process.env.MONGODB_URI) // this will use Render's environment variable
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// --- Message Schema ---
const messageSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

const Message = mongoose.model("Message", messageSchema);

// --- Routes ---

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend is running 🚀" });
});

// Contact form route
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res
      .status(400)
      .json({ success: false, msg: "All fields are required" });
  }

  try {
    // Save to MongoDB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();
    console.log("📩 Message saved:", name, email);

    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // Render's env
        pass: process.env.EMAIL_PASS, // Render's env
      },
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER, // notifications to yourself
      subject: `New message from ${name}`,
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) console.error("❌ Email error:", err);
      else console.log("✉ Email sent:", info.response);
    });

    // Respond to frontend
    res.json({ success: true, msg: "Message received 💌" });
  } catch (err) {
    console.error("❌ Error handling contact form:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// --- Start Server ---
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});