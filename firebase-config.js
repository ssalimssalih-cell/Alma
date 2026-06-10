// ==================== FIREBASE CONFIGURATION - ALMA COFFEE SHOP ====================
// À remplacer par vos propres clés après création du projet Firebase "alma-coffee-shop"

const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "alma-coffee-shop.firebaseapp.com",
    projectId: "alma-coffee-shop",
    storageBucket: "alma-coffee-shop.firebasestorage.app",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialisation Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app();
}

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

console.log('☕ Alma Coffee Shop - Firebase OK');
