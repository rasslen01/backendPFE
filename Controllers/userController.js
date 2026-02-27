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
        const { name, email , role , password } = req.body;
        const newUser = new userModel({ name, email , role , password });
        await newUser.save();
        res.status(201).json({ message: 'User added successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ error: 'Error adding user: ' + error.message });
    }
}
