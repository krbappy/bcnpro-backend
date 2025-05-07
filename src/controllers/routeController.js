const Route = require('../models/Route');
const mongoose = require('mongoose');

// @desc    Create a new route
// @route   POST /api/routes
// @access  Private
const createRoute = async (req, res) => {
    try {
        // Create a new object without _id
        const routeData = { ...req.body };
        delete routeData._id; // Explicitly delete _id
        
        // Add user ID from authenticated user
        routeData.user = req.user._id;
        
        // Log the data being sent to create
        console.log('Creating route with data:', routeData);
        
        const route = await Route.create(routeData);
        res.status(201).json(route);
    } catch (error) {
        console.error('Error creating route:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors // Include validation errors if any
        });
    }
};

// @desc    Get all routes for logged in user
// @route   GET /api/routes
// @access  Private
const getRoutes = async (req, res) => {
    try {
        const routes = await Route.find({ user: req.user._id });
        res.status(200).json(routes);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get single route
// @route   GET /api/routes/:id
// @access  Private
const getRoute = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid route ID format' });
        }

        const route = await Route.findOne({
            _id: req.params.id,
            user: req.user._id
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.status(200).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Update route
// @route   PUT /api/routes/:id
// @access  Private
const updateRoute = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid route ID format' });
        }

        // Create a new object without _id
        const routeData = { ...req.body };
        delete routeData._id; // Explicitly delete _id
        delete routeData.user; // Prevent user field from being updated

        const route = await Route.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            routeData,
            { new: true, runValidators: true }
        );

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.status(200).json(route);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete route
// @route   DELETE /api/routes/:id
// @access  Private
const deleteRoute = async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return res.status(400).json({ message: 'Invalid route ID format' });
        }

        const route = await Route.findOneAndDelete({
            _id: req.params.id,
            user: req.user._id
        });

        if (!route) {
            return res.status(404).json({ message: 'Route not found' });
        }
        res.status(200).json({ message: 'Route deleted successfully' });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    createRoute,
    getRoutes,
    getRoute,
    updateRoute,
    deleteRoute
}; 