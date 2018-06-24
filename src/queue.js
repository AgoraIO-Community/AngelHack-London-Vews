import firebase from "./firebase";

let uid = null;
let firstItem = null;
let currentCallback;
let currentIntervalCallback;
let queue;

firebase.auth().onAuthStateChanged(user => {
  if (user) uid = user.uid;
});

const queueRef = firebase.database().ref("/queue");
const intervalRef = firebase.database().ref("/interval");

// For online count
// const amOnline = new Firebase('https://<demo>.firebaseio.com/.info/connected');
// const userRef = new Firebase('https://<demo>.firebaseio.com/presence/' + userid);
// amOnline.on('value', function(snapshot) {
//   if (snapshot.val()) {
//     userRef.onDisconnect().remove();
//     userRef.set(true);
//   }
// });

let interval;
let time = 30;

function setIntervalListener(callback) {
  currentIntervalCallback = intervalRef.on("value", snap => {
    const val = snap.val();
    console.log("val", val);
    callback(val.time);
  });
}

function setQueueListener(callback) {
  if (currentCallback) {
    queueRef.off("value", currentCallback);
  }
  currentCallback = queueRef.on("value", snap => {
    const val = snap.val();
    if (!val) {
      callback({
        firstItem: false,
        inQueue: false,
        queueLength: 0
      });
      return;
    }

    queue = Object.keys(val).map(key => ({
      key: key,
      ...val[key],
      currentUsers: val[key].uid === uid
    }));

    if (queue.length === 0) {
      callback({
        firstItem: false,
        inQueue: false,
        queueLength: queue.length
      });
    } else {
      if (firstItem && queue[0].key === firstItem.key) {
        callback({
          updateQueue: true,
          queueLength: queue.length
        });
        return;
      }

      firstItem = queue[0];

      const inQueue = queue.some(i => i.currentUsers);

      if (firstItem.currentUsers) {
        firstItem.timeoutId = setTimeout(stop, 30000);
        interval = setInterval(stopInterval, 1000);
      }

      callback({
        firstItem,
        inQueue,
        queueLength: queue.length
      });
    }
  });
}

function removeQueueListener() {
  if (currentCallback) {
    queueRef.off("value", currentCallback);
  }
  if (currentIntervalCallback) {
    intervalRef.off("value", currentIntervalCallback);
  }
}

function stopInterval() {
  time--;
  intervalRef.set({
    time
  });
}

function stop() {
  if (firstItem && firstItem.currentUsers) {
    time = 30;
    intervalRef.set({
      time
    });
    clearInterval(interval);
    clearTimeout(firstItem.timeoutId);
    queueRef.child(firstItem.key).remove();
  } else {
    let toRemove = queue.find(item => item.uid === uid);
    if (toRemove) {
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
  };
}

window.stop = stop;
window.enqueue = enqueue;
window.setQueueListener = setQueueListener;

export {
  queueRef,
  stop,
  enqueue,
  setQueueListener,
  removeQueueListener,
  setIntervalListener
};
