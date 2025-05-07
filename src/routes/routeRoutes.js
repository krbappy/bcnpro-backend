const express = require('express');
const router = express.Router();
const {
    createRoute,
    getRoutes,
    getRoute,
    updateRoute,
    deleteRoute
} = require('../controllers/routeController');
const { protect } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

router.route('/')
    .post(createRoute)
    .get(getRoutes);

router.route('/:id')
    .get(getRoute)
    .put(updateRoute)
    .delete(deleteRoute);

module.exports = router; 