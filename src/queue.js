import firebase from "./firebase";

let uid = null;
let firstItem = null;
let currentCallback;

firebase.auth().onAuthStateChanged(user => {
    if (user) uid = user.uid;
});

const queueRef = firebase.database().ref("/queue");

function setQueueListener(callback) {
    if(currentCallback) {
        queueRef.off("value", currentCallback);
    }
    currentCallback = queueRef.on("value", snap => {
        const val = snap.val();
        if(!val) {
            callback(false);
            return;
        }

        const queue = Object.keys(val).map(key => ({
            key: key,
            ...val[key],
            currentUsers: val[key].uid === uid
        }));

        if(queue.length === 0) {
            callback(false);
        } else {
            firstItem = queue[0];

            if(firstItem.currentUsers) {
                firstItem.timeoutId = setTimeout(stop, 15000);
            }

            callback(firstItem);
        }
    });
}

function stop() {
    if(firstItem && firstItem.currentUsers) {
        clearTimeout(firstItem.timeoutId);
        queueRef.child(firstItem.key).remove();
    }
}

function queue() {
    if (!uid) return;
    const item = {
        uid: uid
    };
    let queueItem = queueRef.push(item);
    return {
        key: queueItem.key,
        ...item
    }
}

window.stop = stop;
window.queue = queue;
window.setQueueListener = setQueueListener;

export {
    queueRef,
    stop,
    queue,
    setQueueListener
}