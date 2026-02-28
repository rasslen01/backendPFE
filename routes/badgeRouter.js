var express = require('express');
var router = express.Router();

const badgeController = require('../Controllers/badgeController');

router.get('/getAllUsersWithBadges', badgeController.getAllUsersWithBadges);
router.get('/getUserBadges/:userId', badgeController.getUserBadges);
router.post('/addBadgeToUser/:userId', badgeController.addBadgeToUser);
router.put('/removeBadgeFromUser/:userId', badgeController.removeBadgeFromUser);
router.get('/searchUsersByBadges', badgeController.searchUsersByBadges);
router.get('/getAvailableBadges', badgeController.getAvailableBadges);
router.get('/getBadgeStats', badgeController.getBadgeStats);
router.post('/addBadgeType', badgeController.addBadgeType);

module.exports = router;