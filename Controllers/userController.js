const userModel = require('../Model/userModel');
const bcrypt = require('bcrypt');


// ================= GET ALL USERS =================
module.exports.getAllUsers = async (req, res) => {
    try {
        const usersList = await userModel.find().select('-password');
        res.status(200).json({ usersList });
    } catch (error) {
        res.status(500).json({ error: 'Error getting users: ' + error.message });
    }
};


// ================= GET USER BY ID =================
module.exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId).select('-password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ error: 'Error getting user: ' + error.message });
    }
};


// ================= ADD USER =================
module.exports.addUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new userModel({
        name,
        email,
        role,
        password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({
        message: 'User added successfully',
        user: {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            role: newUser.role
        }
    });

  } catch (error) {
    res.status(500).json({ error: 'Erreur lors de l’ajout : ' + error.message });
  }
};


// ================= UPDATE USER =================
module.exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const updateData = { ...req.body };

        if (updateData.password) {
            updateData.password = await bcrypt.hash(updateData.password, 10);
        }

        const updatedUser = await userModel.findByIdAndUpdate(
            userId,
            updateData,
            { new: true }
        ).select('-password');

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser
        });

    } catch (error) {
        res.status(500).json({ error: 'Error updating user: ' + error.message });
    }
};


// ================= DELETE USER =================
module.exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        const deletedUser = await userModel.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({ message: 'User deleted successfully' });

    } catch (error) {
        res.status(500).json({ error: 'Error deleting user: ' + error.message });
    }
};