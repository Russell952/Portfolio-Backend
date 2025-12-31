// Load environment variables FIRST
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- MONGODB ----------------
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Atlas connected"))
  .catch((err) => console.error("❌ MongoDB error:", err));

// ---------------- SCHEMA ----------------
const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Message = mongoose.model("Message", messageSchema);

// ---------------- ROUTES ----------------

// Health check
app.get("/api/test", (req, res) => {
  res.json({ message: "Backend alive 🚀" });
});

// Contact form
app.post("/api/contact", async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, msg: "All fields required" });
  }

  try {
    // Save to DB
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    // Email setup
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `New portfolio message from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `
    };

    await transporter.sendMail(mailOptions);

    res.json({ success: true, msg: "Message sent successfully 💌" });

  } catch (err) {
    console.error("❌ Contact error:", err);
    res.status(500).json({ success: false, msg: "Server error" });
  }
});

// ---------------- START SERVER ----------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});