const userModel = require('../Model/userModel');
const badgeModel = require('../Model/badgeModel');

// GET all users with badges
module.exports.getAllUsersWithBadges = async (req, res) => {
    try {
        const users = await userModel.find().populate('badges');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET badges of one user
module.exports.getUserBadges = async (req, res) => {
    try {
        const user = await userModel.findById(req.params.userId).populate('badges');
        res.status(200).json({ badges: user.badges });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// ADD badge to user
module.exports.addBadgeToUser = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({ name: req.body.badge });
        const user = await userModel.findById(req.params.userId);

        if (!badge) return res.status(404).json({ message: "Badge not found" });

        user.badges.push(badge._id);
        await user.save();

        res.status(200).json({ message: "Badge added", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// REMOVE badge from user
module.exports.removeBadgeFromUser = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({ name: req.body.badge });
        const user = await userModel.findById(req.params.userId);

        user.badges = user.badges.filter(
            b => b.toString() !== badge._id.toString()
        );

        await user.save();
        res.status(200).json({ message: "Badge removed", user });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// SEARCH users by badge name
module.exports.searchUsersByBadges = async (req, res) => {
    try {
        const badge = await badgeModel.findOne({
            name: { $regex: req.query.name, $options: "i" }
        });

        const users = await userModel.find({ badges: badge._id }).populate('badges');
        res.status(200).json({ users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// GET available badges
module.exports.getAvailableBadges = async (req, res) => {
    try {
        const badges = await badgeModel.find();
        res.status(200).json({ badges });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// CREATE new badge type
module.exports.addBadgeType = async (req, res) => {
    try {
        const newBadge = await badgeModel.create(req.body);
        res.status(201).json({ newBadge });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// BADGE STATS
module.exports.getBadgeStats = async (req, res) => {
    try {
        const stats = await userModel.aggregate([
            { $unwind: "$badges" },
            {
                $group: {
                    _id: "$badges",
                    count: { $sum: 1 }
                }
            }
        ]);

        res.status(200).json({ stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};