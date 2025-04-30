/**
 * Calculate the delivery price based on distance, vehicle type, and other factors
 * 
 * @param {Object} booking - The booking object with route and vehicle details
 * @returns {number} - The calculated price in dollars
 */
const calculateDeliveryPrice = (booking) => {
    // Base rates by vehicle type (in dollars)
    const baseRates = {
        'van': 50,
        'box-truck': 75,
        'straight-truck': 100,
        'semi-truck': 150
    };
    
    // Get the base rate for the selected vehicle type or default to 50
    const baseRate = baseRates[booking.vehicleType] || 50;
    
    // Extract distance in kilometers or default to 10
    const distanceInKm = booking.routeDistance?.meters 
        ? (booking.routeDistance.meters / 1000) 
        : 10;
    
    // Price per kilometer based on vehicle type
    const ratePerKm = {
        'van': 1.5,
        'box-truck': 2,
        'straight-truck': 2.5,
        'semi-truck': 3
    }[booking.vehicleType] || 1.5;
    
    // Calculate distance cost
    const distanceCost = distanceInKm * ratePerKm;
    
    // Calculate stops cost (each additional stop after the first two costs extra)
    const stopsCount = booking.stops?.length || 2;
    const stopsCost = Math.max(0, (stopsCount - 2) * 10);
    
    // Calculate weight surcharge if total weight is provided
    let weightSurcharge = 0;
    if (booking.totalWeight) {
        const weightInKg = parseFloat(booking.totalWeight) || 0;
        if (weightInKg > 500) {
            weightSurcharge = 25;
        } else if (weightInKg > 200) {
            weightSurcharge = 15;
        } else if (weightInKg > 50) {
            weightSurcharge = 5;
        }
    }
    
    // Total price calculation
    const totalPrice = baseRate + distanceCost + stopsCost + weightSurcharge;
    
    // Round to 2 decimal places and ensure minimum price
    return Math.max(50, Math.round(totalPrice * 100) / 100);
};

module.exports = { calculateDeliveryPrice }; 