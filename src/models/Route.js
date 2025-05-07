const mongoose = require('mongoose');

const stopSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    phoneNumber: {
        type: String,
        required: true
    },
    deliveryNotes: String,
    center: {
        type: [Number],
        required: true,
        validate: {
            validator: function(v) {
                return v.length === 2 && 
                       v[0] >= -180 && v[0] <= 180 && 
                       v[1] >= -90 && v[1] <= 90;
            },
            message: 'Center must be a valid [longitude, latitude] pair'
        }
    }
});

const optimizedRouteSchema = new mongoose.Schema({
    sequence: [Number],
    estimatedTime: Number,
    fuelCost: Number,
    distance: Number,
    distanceDisplay: String
});

const driverSchema = new mongoose.Schema({
    name: {
        type: String,
        default: 'Not assigned'
    },
    autoAssigned: {
        type: Boolean,
        default: false
    }
});

const routeSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['Single Stop', 'Multi Stop']
    },
    stops: [stopSchema],
    optimizedRoute: optimizedRouteSchema,
    driver: driverSchema,
    status: {
        type: String,
        required: true,
        enum: ['draft', 'assigned', 'in-progress', 'completed', 'cancelled'],
        default: 'draft'
    }
}, {
    timestamps: true,
    _id: true
});

routeSchema.pre('save', function(next) {
    if (this._id && !mongoose.Types.ObjectId.isValid(this._id)) {
        delete this._id;
    }
    next();
});

routeSchema.pre('validate', function(next) {
    if (this._id && !mongoose.Types.ObjectId.isValid(this._id)) {
        delete this._id;
    }
    next();
});

module.exports = mongoose.model('Route', routeSchema); 