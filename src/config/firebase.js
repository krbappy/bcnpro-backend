const admin = require('firebase-admin');

// Initialize Firebase Admin SDK with provided configuration
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: 'bcn-pro',
        storageBucket: 'bcn-pro.firebasestorage.app',
        messagingSenderId: '551589088902',
        appId: '1:551589088902:web:a342a34f750c28b81acb07'
    });
}

module.exports = admin; 