if (typeof firebaseConfig === 'undefined') {
const firebaseConfig = {
  apiKey: "...",
  authDomain: "alma-coffee-shop.firebaseapp.com",
  projectId: "alma-coffee-shop",
  storageBucket: "alma-coffee-shop.firebasestorage.app",
  messagingSenderId: "...",
  appId: "..."
};
    firebase.initializeApp(firebaseConfig);
    var auth = firebase.auth();
    var db = firebase.firestore();
    var storage = firebase.storage();
    console.log('Firebase OK');
}
