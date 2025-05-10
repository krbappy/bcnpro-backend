# Frontend Notification System Implementation Guide

## Overview
This guide explains how to implement the notification system in your React frontend application. The system uses Socket.IO for real-time notifications and REST APIs for fetching historical notifications.

## 1. Setup Socket.IO Client

First, install the required dependencies:
```bash
npm install socket.io-client axios
```

## 2. Create Notification Context

Create a new file `src/contexts/NotificationContext.js`:

```javascript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);

    // Initialize socket connection
    useEffect(() => {
        const token = idToken;
        if (!token) return;

        const newSocket = io(process.env.REACT_APP_API_URL, {
            query: {
                userId: localStorage.getItem('userId')
            },
            auth: {
                token
            }
        });

        // Listen for new notifications
        newSocket.on('new_notification', (notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        setSocket(newSocket);

        return () => newSocket.close();
    }, []);

    // Fetch historical notifications
    const fetchNotifications = async () => {
        try {
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.seen).length);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                }
            );
            setNotifications(prev =>
                prev.map(notification =>
                    notification._id === notificationId
                        ? { ...notification, seen: true }
                        : notification
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                }
            );
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, seen: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext);
```

## 3. Create Notification Components

### Notification Bell Component
Create `src/components/NotificationBell.js`:

```javascript
import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationList from './NotificationList';

const NotificationBell = () => {
    const { unreadCount } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="notification-bell">
            <button 
                className="notification-bell-button"
                onClick={() => setIsOpen(!isOpen)}
            >
                <i className="fas fa-bell" />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount}</span>
                )}
            </button>
            {isOpen && <NotificationList onClose={() => setIsOpen(false)} />}
        </div>
    );
};

export default NotificationBell;
```

### Notification List Component
Create `src/components/NotificationList.js`:

```javascript
import React, { useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationList = ({ onClose }) => {
    const { notifications, markAsRead, markAllAsRead } = useNotifications();

    useEffect(() => {
        // Fetch notifications when component mounts
        fetchNotifications();
    }, []);

    const handleNotificationClick = async (notification) => {
        if (!notification.seen) {
            await markAsRead(notification._id);
        }
        // Handle notification click based on type
        switch (notification.type) {
            case 'booking':
                // Navigate to booking details
                break;
            case 'payment':
                // Navigate to payment details
                break;
            case 'team':
                // Navigate to team details
                break;
            default:
                break;
        }
    };

    return (
        <div className="notification-list">
            <div className="notification-header">
                <h3>Notifications</h3>
                <button onClick={markAllAsRead}>Mark all as read</button>
                <button onClick={onClose}>Close</button>
            </div>
            <div className="notification-items">
                {notifications.length === 0 ? (
                    <p className="no-notifications">No notifications</p>
                ) : (
                    notifications.map(notification => (
                        <div
                            key={notification._id}
                            className={`notification-item ${notification.seen ? 'seen' : 'unseen'}`}
                            onClick={() => handleNotificationClick(notification)}
                        >
                            <div className="notification-content">
                                <p>{notification.message}</p>
                                <small>{new Date(notification.createdAt).toLocaleString()}</small>
                            </div>
                            {!notification.seen && <div className="unread-indicator" />}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default NotificationList;
```


Create `src/styles/notifications.css`:

```css
.notification-bell {
    position: relative;
}

.notification-bell-button {
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px;
    position: relative;
}

.notification-badge {
    position: absolute;
    top: 0;
    right: 0;
    background-color: #ff4444;
    color: white;
    border-radius: 50%;
    padding: 2px 6px;
    font-size: 12px;
}

.notification-list {
    position: absolute;
    top: 100%;
    right: 0;
    width: 350px;
    max-height: 500px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.notification-header {
    padding: 15px;
    border-bottom: 1px solid #eee;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.notification-items {
    overflow-y: auto;
    max-height: 400px;
}

.notification-item {
    padding: 15px;
    border-bottom: 1px solid #eee;
    cursor: pointer;
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

.no-notifications {
    padding: 20px;
    text-align: center;
    color: #666;
}
```

## 5. Usage in App

Wrap your app with the NotificationProvider and add the NotificationBell component:

```javascript
// App.js
import { NotificationProvider } from './contexts/NotificationContext';
import NotificationBell from './components/NotificationBell';

function App() {
    return (
        <NotificationProvider>
            <div className="app">
                <header>
                    <nav>
                        {/* Other navigation items */}
                        <NotificationBell />
                    </nav>
                </header>
                {/* Rest of your app */}
            </div>
        </NotificationProvider>
    );
}
```

## 6. API Endpoints

### GET /api/notifications
- Returns a list of notifications for the authenticated user
- Requires authentication
- Returns notifications sorted by createdAt in descending order
- Example response:
```javascript
[
    {
        "_id": "notification_id",
        "userId": "user_id",
        "message": "Your delivery has been booked successfully",
        "type": "booking",
        "seen": false,
        "createdAt": "2024-03-14T12:00:00.000Z"
    }
]
```

### PATCH /api/notifications/:id/read
- Marks a specific notification as read
- Requires authentication
- Returns the updated notification

### PATCH /api/notifications/mark-all-read
- Marks all notifications as read
- Requires authentication
- Returns success message

## 7. Socket Events

### new_notification
- Emitted when a new notification is created
- Payload: Notification object
- Example:
```javascript
{
    "_id": "notification_id",
    "userId": "user_id",
    "message": "Your delivery has been booked successfully",
    "type": "booking",
    "seen": false,
    "createdAt": "2024-03-14T12:00:00.000Z"
}
```

## 8. Best Practices

1. **Error Handling**
   - Always implement proper error handling for API calls
   - Show user-friendly error messages
   - Implement retry logic for failed API calls

2. **Performance**
   - Implement pagination for notifications
   - Use debouncing for mark-as-read operations
   - Cache notifications in local storage

3. **User Experience**
   - Show loading states
   - Implement smooth animations
   - Provide clear feedback for actions

4. **Security**
   - Always include authentication token in API calls
   - Validate notification data before processing
   - Implement proper error boundaries

## 9. Example Usage




## 10. Troubleshooting

1. **Socket Connection Issues**
   - Check if the backend URL is correct
   - Verify authentication token is valid
   - Check browser console for connection errors

2. **Notifications Not Showing**
   - Verify user ID is correctly passed in socket connection
   - Check API endpoints are accessible
   - Verify notification data structure

3. **Real-time Updates Not Working**
   - Ensure socket connection is established
   - Check if the user is in the correct room
   - Verify event names match between frontend and backend 