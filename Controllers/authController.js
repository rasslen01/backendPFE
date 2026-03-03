const userModel = require('../Model/userModel');
const centreModel = require("../Model/centreModel"); // ✅ ADD
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || "mySecretKey";

// ================= REGISTER =================
exports.register = async (req, res) => {
  try {
    console.log("REGISTER BODY:", req.body);

    const { name, email, password, role, speciality } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        error: "All fields required",
        details: { name: !!name, email: !!email, password: !!password }
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ normalize role to uppercase
    const normalizedRole = (role || "STUDENT").toUpperCase();

    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
      role: normalizedRole,
      speciality
    });

    await newUser.save();

    // ✅ If CENTRE: also create Centre document
    if (normalizedRole === "CENTRE") {
      const existingCentre = await centreModel.findOne({ email: email.toLowerCase() });
      if (!existingCentre) {
        await centreModel.create({
          name,
          email,          // centreModel has lowercase:true so ok
          // status will be "pending" by default
        });
      }
    }

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
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ error: err.message });
  }
};


// ================= LOGIN =================
exports.login = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    const user = await userModel.findOne({ email });

    if (!user)
      return res.status(404).json({ error: "Account not found" });

    if (user.role !== role)
      return res.status(403).json({ error: "Access denied for this role" });

    const match = await bcrypt.compare(password, user.password);

    if (!match)
      return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      JWT_SECRET,   // ✅ même secret
      { expiresIn: "1d" }
    );

    res.status(200).json({
      token,
      user
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
