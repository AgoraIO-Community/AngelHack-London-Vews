import firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

// noinspection SpellCheckingInspection
export default firebase.initializeApp({
    apiKey: "AIzaSyCHfRLcliBlOfsH473flOCwS3eh3FVSWwA",
    authDomain: "vews-news.firebaseapp.com",
    databaseURL: "https://vews-news.firebaseio.com",
    projectId: "vews-news",
    storageBucket: "vews-news.appspot.com",
    messagingSenderId: "116314913987"
});