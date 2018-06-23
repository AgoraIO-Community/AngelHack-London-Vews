import firebase from "./firebase";

let uid = null;
let firstItem = null;
let currentCallback;
let queue;

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
            callback({
                firstItem: false,
                inQueue: false
            });
            return;
        }

        queue = Object.keys(val).map(key => ({
            key: key,
            ...val[key],
            currentUsers: val[key].uid === uid
        }));

        if(queue.length === 0) {
            callback({
                firstItem: false,
                inQueue: false
            });
        } else {
            //if(firstItem && (queue[0].key === firstItem.key)) return;

            firstItem = queue[0];

            const inQueue = queue.some(i => i.currentUsers);

            if(firstItem.currentUsers) {
                firstItem.timeoutId = setTimeout(stop, 15000);
            }

            callback({
                firstItem,
                inQueue
            });
        }
    });
}

function removeQueueListener() {
    if(currentCallback) {
        queueRef.off("value", currentCallback);
    }
}

function stop() {
    if(firstItem && firstItem.currentUsers) {
        clearTimeout(firstItem.timeoutId);
        queueRef.child(firstItem.key).remove();
    } else {
        let toRemove = queue.find(item => item.uid === uid);
        if(toRemove) {
            queueRef.child(toRemove.key).remove();
        }
    }
}

function enqueue() {
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
window.enqueue = enqueue;
window.setQueueListener = setQueueListener;

export {
    queueRef,
    stop,
    enqueue,
    setQueueListener,
    removeQueueListener
}