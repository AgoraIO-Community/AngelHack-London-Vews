import firebase from "./firebase";

let uid = null;
let firstItemMap = {};
let currentCallbackMap = {};
let currentIntervalCallback;
let queueMap = {};
let queueRefs = {};

firebase.auth().onAuthStateChanged(user => {
  if (user) uid = user.uid;
});

// const queueRef = firebase.database().ref("/queue");
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

function setQueueListener(room, callback) {
  console.log(`QUEUE-DEBUG: Setting queue listener for room ${room}`);
  const queueRefPath = `/queue/${room}`;
  const queueRef = firebase.database().ref(queueRefPath);
  console.log(`QUEUE-DEBUG: Path to queue ref is ${queueRefPath}`);
  if (currentCallbackMap[room]) {
    queueRefs[room].off("value", currentCallbackMap[room]);
  }
  queueRefs[room] = queueRef;
  currentCallbackMap[room] = queueRef.on("value", snap => {
    const val = snap.val();
    if (!val) {
      callback({
        firstItem: false,
        inQueue: false,
        queueLength: 0
      });
      return;
    }

    const queue = Object.keys(val).map(key => ({
      key: key,
      ...val[key],
      currentUsers: val[key].uid === uid
    }));

    queueMap[room] = queue;

    if (queue.length === 0) {
      callback({
        firstItem: false,
        inQueue: false,
        queueLength: queue.length
      });
    } else {
      if (firstItemMap[room] && queue[0].key === firstItemMap[room].key) {
        callback({
          updateQueue: true,
          queueLength: queue.length
        });
        return;
      }

      const firstItem = queue[0];

      const inQueue = queue.some(i => i.currentUsers);

      if (firstItem.currentUsers) {
        firstItem.timeoutId = setTimeout(stop, 30000);
        interval = setInterval(stopInterval, 1000);
      }

      firstItemMap[room] = firstItem;

      callback({
        firstItem,
        inQueue,
        queueLength: queue.length
      });
    }
  });
}

function removeQueueListener(room) {
  console.log(`QUEUE-DEBUG: Removing queue listener for room ${room}`);
  if ((room in currentCallbackMap) && (room in queueRefs)) {
    queueRefs[room].off("value", currentCallbackMap[room]);
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

function stop(room) {
  console.log(`QUEUE-DEBUG: Stopping user in room ${room}`);
  if (firstItemMap[room] && firstItemMap[room].currentUsers) {
    time = 30;
    intervalRef.set({
      time
    });
    clearInterval(interval);
    clearTimeout(firstItemMap[room].timeoutId);
    queueRefs[room].child(firstItemMap[room].key).remove();
  } else {
    let toRemove = queueMap[room].find(item => item.uid === uid);
    if (toRemove) {
      queueRefs[room].child(toRemove.key).remove();
    }
  }
}

function enqueue(room) {
  console.log(`QUEUE-DEBUG: Enqueuing user in room ${room}`);
  if (!uid) return;
  const item = {
    uid: uid
  };
  let queueItem = queueRefs[room].push(item);
  return {
    key: queueItem.key,
    ...item
  };
}

window.stop = stop;
window.enqueue = enqueue;
window.setQueueListener = setQueueListener;

export {
  stop,
  enqueue,
  setQueueListener,
  removeQueueListener,
  setIntervalListener
};
