const userModel = require('../Model/userModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = "mySecretKey";

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, speciality } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields required" });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: role || "STUDENT",
      speciality
    });

    await newUser.save();

    const token = jwt.sign(
      { id: newUser._id, role: newUser.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "User created",
      token,
      user: newUser
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ error: "Account not found" });

    if (user.role !== role)
      return res.status(403).json({ error: "Access denied for this role" });

    const match = await bcrypt.compare(password, user.password);
    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secretKey",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};