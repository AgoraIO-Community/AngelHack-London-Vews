import firebase from "./firebase";

const countsRef = firebase.database().ref("counts");

let counts = {};
let countsCallback;

function setCountsListener(room, callback) {
    countsCallback = countsRef.on("value", snap => {
        counts = snap.val();
        callback(room in counts ? counts[room] : 0);
    });
}

function removeCountsListener() {
    countsRef.off("value", countsCallback);
}

function join(room) {
    let newValue = 1;
    if(room in counts) {
        newValue = counts[room] + 1;
    }
    countsRef.child(room).set(newValue);
}

function leave(room) {
    let newValue = 0;
    if(room in counts) {
        newValue = counts[room] - 1;
    }
    countsRef.child(room).set(newValue);
}

export {
    setCountsListener,
    removeCountsListener,
    join,
    leave
}