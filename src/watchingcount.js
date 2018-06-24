import firebase from "./firebase";

const countsRef = firebase.database().ref("counts");

let counts = {};
let countsCallback;
let joined = {};

function setCountsListener(room, callback) {
    countsCallback = countsRef.on("value", snap => {
        counts = snap.val();
        console.log(counts);
        callback(room in counts ? counts[room] : 0);

            if(!(room in joined)) {
                joined[room] = true;

                if(!(room in counts)) {
                    countsRef.child(room).set(1);
                } else {
                    countsRef.child(room).set(counts[room] + 1);
                }
            }
    });
}

function removeCountsListener(room) {
    countsRef.off("value", countsCallback);

    if(room in joined) {
        delete joined[room];
        countsRef.child(room).set(counts[room] - 1);
    }
}

export {
    setCountsListener,
    removeCountsListener,
}