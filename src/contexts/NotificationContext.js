import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [socket, setSocket] = useState(null);
    const [unreadCount, setUnreadCount] = useState(0);
    const [connectionStatus, setConnectionStatus] = useState('disconnected');
    const [error, setError] = useState(null);

    // Initialize socket connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        const userId = localStorage.getItem('userId');
        
        if (!token || !userId) {
            console.log('[NotificationContext] No token or userId found, skipping socket connection');
            return;
        }

        console.log('[NotificationContext] Initializing socket connection with:', {
            url: process.env.REACT_APP_API_URL,
            userId
        });

        const newSocket = io(process.env.REACT_APP_API_URL, {
            query: { userId },
            auth: { token }
        });

        // Connection event handlers
        newSocket.on('connect', () => {
            console.log('[NotificationContext] Socket connected successfully. Socket ID:', newSocket.id);
            setConnectionStatus('connected');
            setError(null);
        });

        newSocket.on('connect_error', (err) => {
            console.error('[NotificationContext] Socket connection error:', err);
            setConnectionStatus('error');
            setError(err.message);
        });

        newSocket.on('disconnect', (reason) => {
            console.log('[NotificationContext] Socket disconnected. Reason:', reason);
            setConnectionStatus('disconnected');
        });

        // Listen for new notifications
        newSocket.on('new_notification', (notification) => {
            console.log('[NotificationContext] SUCCESS: Received new_notification event from server:', notification);
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        setSocket(newSocket);

        return () => {
            console.log('[NotificationContext] Cleaning up socket connection');
            newSocket.close();
        };
    }, []);

    // Fetch historical notifications
    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[NotificationContext] No token found, skipping notification fetch');
                return;
            }

            console.log('[NotificationContext] Fetching notifications...');
            const response = await axios.get(`${process.env.REACT_APP_API_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            console.log('[NotificationContext] Fetched notifications:', response.data);
            setNotifications(response.data);
            setUnreadCount(response.data.filter(n => !n.seen).length);
        } catch (error) {
            console.error('[NotificationContext] Error fetching notifications:', error);
            setError(error.message);
        }
    };

    // Mark notification as read
    const markAsRead = async (notificationId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[NotificationContext] No token found, skipping mark as read');
                return;
            }

            console.log('[NotificationContext] Marking notification as read:', notificationId);
            await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/notifications/${notificationId}/read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
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
            console.error('[NotificationContext] Error marking notification as read:', error);
            setError(error.message);
        }
    };

    // Mark all notifications as read
    const markAllAsRead = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.log('[NotificationContext] No token found, skipping mark all as read');
                return;
            }

            console.log('[NotificationContext] Marking all notifications as read');
            await axios.patch(
                `${process.env.REACT_APP_API_URL}/api/notifications/mark-all-read`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            
            setNotifications(prev =>
                prev.map(notification => ({ ...notification, seen: true }))
            );
            setUnreadCount(0);
        } catch (error) {
            console.error('[NotificationContext] Error marking all notifications as read:', error);
            setError(error.message);
        }
    };

    return (
        <NotificationContext.Provider value={{
            notifications,
            unreadCount,
            connectionStatus,
            error,
            fetchNotifications,
            markAsRead,
            markAllAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => useContext(NotificationContext); 