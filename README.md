# BCN Backend

This is the backend server for the BCN Booking System. It provides APIs for user management and booking operations.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
NODE_ENV=development
PORT=5000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_jwt_secret
```

3. Replace `your_mongodb_atlas_connection_string` with your MongoDB Atlas connection string
4. Replace `your_jwt_secret` with a secure secret key for JWT token generation

## Running the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Users
- POST `/api/users` - Register a new user
- POST `/api/users/login` - Login user
- GET `/api/users/:id` - Get user profile (Protected)
- PUT `/api/users/:id` - Update user profile (Protected)

### Bookings
- POST `/api/bookings` - Create a new booking (Protected)
- GET `/api/bookings` - Get all bookings for logged-in user (Protected)
- GET `/api/bookings/:id` - Get specific booking (Protected)
- PUT `/api/bookings/:id` - Update booking (Protected)
- DELETE `/api/bookings/:id` - Delete booking (Protected)

## Authentication

Protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
``` 