const userModel = require('../Model/userModel');

module.exports.getAllUsers = async (req, res) => {
    try {
        const usersList = await userModel.find();
        res.status(200).json({usersList});
    } catch (error) {
        res.status(500).json({ error: 'Error getting users: ' + error.message });
    }
}

module.exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({user});
    } catch (error) {
        res.status(500).json({ error: 'Error getting user: ' + error.message });
    }
}

module.exports.addUser = async (req, res) => {
  try {
    const { name, email, role, password } = req.body;

    if (!name || !email || !role || !password) {
      return res.status(400).json({ error: 'Tous les champs sont obligatoires.' });
    }

    const newUser = new userModel({ name, email, role, password });
    await newUser.save();

    res.status(201).json({ message: 'User added successfully', user: newUser });
  } catch (error) {
    console.error("AddUser error:", error);
    res.status(500).json({ error: 'Erreur lors de l’ajout de l’utilisateur : ' + error.message });
  }
};

module.exports.updateUser = async (req, res) => {
    try {
        const userId = req.params.id;
        const { name, email , role , password , xp , isActive } = req.body;
        const updatedUser = await userModel.findByIdAndUpdate(userId, { name, email , role , password, xp , isActive }, { new: true });
        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ error: 'Error updating user: ' + error.message });
    }
}

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
}
