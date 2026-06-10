var express = require('express');
var router  = express.Router();
const badgeController = require('../Controllers/badgeController');
const { verifyToken } = require('../Middleware/authMiddleware');

// ─── XP & Gamification ───────────────────────────────
router.get('/me',               verifyToken, badgeController.getMyXP);
router.post('/add-review-xp',   verifyToken, badgeController.addReviewXP);
router.post('/add-inscription-xp', verifyToken, badgeController.addInscriptionXP); // ✅ NOUVEAU
router.get('/leaderboard',                   badgeController.getLeaderboard);

// ─── Admin badges ─────────────────────────────────────
router.get('/getAllUsersWithBadges',        badgeController.getAllUsersWithBadges);
router.get('/getUserBadges/:userId',        badgeController.getUserBadges);
router.post('/addBadgeToUser/:userId',      badgeController.addBadgeToUser);
router.put('/removeBadgeFromUser/:userId',  badgeController.removeBadgeFromUser);
router.get('/searchUsersByBadges',          badgeController.searchUsersByBadges);
router.get('/getAvailableBadges',           badgeController.getAvailableBadges);
router.get('/getBadgeStats',                badgeController.getBadgeStats);
router.post('/addBadgeType',                badgeController.addBadgeType);
router.put('/updateBadgeType/:id',          badgeController.updateBadgeType);
router.delete('/deleteBadgeType/:id',       badgeController.deleteBadgeType);

module.exports = router;