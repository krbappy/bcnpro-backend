# Notification System Documentation

## Overview
The notification system provides real-time notifications for various events in the delivery booking system using Socket.IO. It supports different types of notifications (booking, payment, system) and includes both real-time updates and historical notification retrieval.

## Frontend Implementation

### 1. Socket.IO Client Setup

First, install the required dependencies:
```bash
npm install socket.io-client
```

### 2. Create a Notification Context

Create a new file `src/contexts/NotificationContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);

    useEffect(() => {
        // Initialize socket connection
        const newSocket = io('http://your-backend-url', {
            query: {
                userId: 'current-user-id' // Replace with actual user ID
            }
        });

        // Listen for new notifications
        newSocket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
        });

        setSocket(newSocket);

        // Cleanup on unmount
        return () => newSocket.close();
    }, []);

    // Fetch historical notifications
    const fetchNotifications = async () => {
        try {
            const response = await fetch('http://your-backend-url/api/notifications', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            const data = await response.json();
            setNotifications(data);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await fetch(`http://your-backend-url/api/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, seen: true }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            fetchNotifications,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
```

### 3. Wrap Your App with the Provider

In your `App.js` or main component:

```javascript
import { NotificationProvider } from './contexts/NotificationContext';

function App() {
    return (
        <NotificationProvider>
            {/* Your app components */}
        </NotificationProvider>
    );
}
```

### 4. Create a Notification Component

Create a new file `src/components/NotificationList.js`:

```javascript
import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationList = () => {
    const { notifications, fetchNotifications, markAsRead } = useNotifications();

    useEffect(() => {
        fetchNotifications();
    }, []);

    return (
        <div className="notifications-container">
            <h2>Notifications</h2>
            <div className="notifications-list">
                {notifications.map(notification => (
                    <div
                        key={notification._id}
                        className={`notification-item ${notification.seen ? 'seen' : 'unseen'}`}
                        onClick={() => markAsRead(notification._id)}
                    >
                        <div className="notification-content">
                            <p>{notification.message}</p>
                            <small>{new Date(notification.createdAt).toLocaleString()}</small>
                        </div>
                        {!notification.seen && <div className="unread-indicator" />}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NotificationList;
```

### 5. Add Basic Styling

Create a new file `src/styles/notifications.css`:

```css
.notifications-container {
    max-width: 400px;
    margin: 0 auto;
}

.notification-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
    position: relative;
    transition: background-color 0.2s;
}

.notification-item:hover {
    background-color: #f5f5f5;
}

.notification-item.unseen {
    background-color: #f0f7ff;
}

.unread-indicator {
    width: 8px;
    height: 8px;
    background-color: #007bff;
    border-radius: 50%;
    position: absolute;
    right: 15px;
    top: 50%;
    transform: translateY(-50%);
}

.notification-content p {
    margin: 0 0 5px 0;
}

.notification-content small {
    color: #666;
}
```

## Usage Examples

### 1. Display Notifications in a Component

```javascript
import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationList from '../components/NotificationList';

const Dashboard = () => {
    const { notifications } = useNotifications();

    return (
        <div>
            <h1>Dashboard</h1>
            <div className="notification-badge">
                {notifications.filter(n => !n.seen).length} unread
            </div>
            <NotificationList />
        </div>
    );
};
```

### 2. Show Notification Badge in Navigation

```javascript
import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const Navigation = () => {
    const { notifications } = useNotifications();
    const unreadCount = notifications.filter(n => !n.seen).length;

    return (
        <nav>
            <div className="nav-item">
                Notifications
                {unreadCount > 0 && (
                    <span className="badge">{unreadCount}</span>
                )}
            </div>
        </nav>
    );
};
```

## Best Practices

1. **Error Handling**: Always implement proper error handling for API calls and socket events.

2. **Reconnection**: Implement socket reconnection logic for better reliability:
```javascript
const socket = io('http://your-backend-url', {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000
});
```

3. **Authentication**: Ensure proper authentication headers are sent with API requests.

4. **Performance**: Consider implementing pagination for notifications if the list grows large.

5. **Offline Support**: Consider implementing local storage for notifications when offline.

## API Endpoints

### GET /api/notifications
- Returns a list of notifications for the authenticated user
- Requires authentication
- Returns notifications sorted by createdAt in descending order

### PATCH /api/notifications/:id/read
- Marks a specific notification as read
- Requires authentication
- Returns the updated notification

## Socket Events

### new_notification
- Emitted when a new notification is created
- Payload: Notification object
- Example:
```javascript
socket.on('new_notification', (notification) => {
    console.log('New notification:', notification);
});
```

## Troubleshooting

1. **Socket Connection Issues**
   - Check if the backend URL is correct
   - Ensure CORS is properly configured
   - Verify authentication token is valid

2. **Notifications Not Showing**
   - Check if the user ID is correctly passed in socket connection
   - Verify API endpoints are accessible
   - Check browser console for errors

3. **Real-time Updates Not Working**
   - Ensure socket connection is established
   - Check if the user is in the correct room
   - Verify event names match between frontend and backend