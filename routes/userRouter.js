var express = require("express");
var router = express.Router();

const userController = require("../Controllers/userController");
const { verifyToken } = require("../Middleware/authMiddleware");

// Cache headers for preferences
router.use("/preferences", (req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  res.set("Surrogate-Control", "no-store");
  next();
});

// ✅ Existing routes
router.get("/getAllUsers", verifyToken, userController.getAllUsers);
router.get("/getUserById/:id", verifyToken, userController.getUserById);
router.post("/addUser", userController.addUser);
router.put("/updateUser/:id", userController.updateUser);
router.delete("/deleteUser/:id", userController.deleteUser);

router.put("/preferences", verifyToken, userController.savePreferences);
router.get("/preferences", verifyToken, userController.getPreferences);

// ✅ ALIAS pour matcher ApiUser.js (sans le modifier)
router.get("/getUser/:id", verifyToken, userController.getUserById);

// ✅ /users/me (le front l'appelle)
router.get("/me", verifyToken, async (req, res) => {
  try {
    const user = await require("../Model/userModel")
      .findById(req.user.id)
      .select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.status(200).json({ user });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;