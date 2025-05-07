const express = require('express');
const router = express.Router();
const {
    createRoute,
    getRoutes,
    getRoute,
    updateRoute,
    deleteRoute
} = require('../controllers/routeController');

router.route('/')
    .post(createRoute)
    .get(getRoutes);

router.route('/:id')
    .get(getRoute)
    .put(updateRoute)
    .delete(deleteRoute);

module.exports = router; 