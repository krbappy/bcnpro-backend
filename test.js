const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test data that matches the frontend format
const firebaseUid = '7wzQQEEl2CVDRx4FDfMuITAwPXv1';
const userData = {
    firebaseUid,
    email: 'bappybd40@gmail.com',
    name: 'Md. khalisur rahman bappy',
    phone: '01516133456',
    company: 'Test Company'
};

const bookingData = {
    firebaseUid: '7wzQQEEl2CVDRx4FDfMuITAwPXv1',
    stops: [1, 2],
    selectedAddresses: {
        '0': {
            street: '3947 Kozy Korner Road, Center Valley, Pennsylvania 18034, United States',
            city: 'Center Valley',
            state: 'Pennsylvania',
            zipCode: '18034',
            country: 'United States',
            coordinates: [40.5315, -75.4068]
        },
        '1': {
            street: '2786 Evergreen Circle, Emmaus, Pennsylvania 18049, United States',
            city: 'Emmaus',
            state: 'Pennsylvania',
            zipCode: '18049',
            country: 'United States',
            coordinates: [40.5391, -75.4951]
        }
    },
    routeDistance: { meters: 10772.723, displayValue: '6.7 mi' },
    vehicleType: 'suv',
    deliveryTiming: { date: '2023-11-14', timeWindow: 'rush', isValid: true },
    orderDetails: { weight: '11', size: '1' },
    orders: [
        {
            id: '1',
            poNumber: '234567',
            orderNumber: '987654',
            bolNumber: '123456',
            items: [
                {
                    description: 'Test item',
                    length: '10',
                    width: '20',
                    height: '30',
                    weight: '40',
                    quantity: '2'
                }
            ],
            isOpen: true
        }
    ],
    totalWeight: '11',
    additionalInfo: 'Contact information completed',
    contactInfo: {
        '0': {
            name: 'Md. khalisur rahman bappy',
            phone: '01516133456',
            email: 'bappybd40@gmail.com',
            company: 'ABC Company',
            notes: 'Sherpur',
            saveToAddressBook: false
        },
        '1': {
            name: 'John Doe',
            phone: '01234567890',
            email: 'john@example.com',
            company: 'XYZ Corp',
            notes: 'Recipient',
            saveToAddressBook: false
        }
    }
};

// Function to create a user
async function createUser() {
    try {
        const response = await axios.post(`${API_URL}/users`, userData);
        console.log('User created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating user:', error.response?.data || error.message);
    }
}

// Function to create a booking
async function createBooking() {
    try {
        const response = await axios.post(`${API_URL}/bookings`, bookingData);
        console.log('Booking created:', response.data);
        return response.data;
    } catch (error) {
        console.error('Error creating booking:', error.response?.data || error.message);
    }
}

// Run the tests
async function runTests() {
    console.log('Creating user...');
    await createUser();
    
    console.log('\nCreating booking...');
    await createBooking();
}

runTests(); 