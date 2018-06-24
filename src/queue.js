import firebase from "./firebase";

let uid = null;
let firstItemMap = {};
let currentCallbackMap = {};
// let currentIntervalCallback;
let queueMap = {};
let queueRefs = {};

firebase.auth().onAuthStateChanged(user => {
  if (user) uid = user.uid;
});

// const queueRef = firebase.database().ref("/queue");
//const intervalRef = firebase.database().ref("/interval");
let intervalRefs = {};
let intervalCallbacks = {};

// For online count

// const amOnline = new Firebase('https://<demo>.firebaseio.com/.info/connected');
// const userRef = new Firebase('https://<demo>.firebaseio.com/presence/' + userid);
// amOnline.on('value', function(snapshot) {
//   if (snapshot.val()) {
//     userRef.onDisconnect().remove();
//     userRef.set(true);
//   }
// });

// let interval;
// let time = 30;
let timeMap = {};
let updateIntervalsMap = {};

function setIntervalListener(room, callback) {
  if(room in intervalRefs && room in intervalCallbacks) {
    intervalRefs[room].off("value", intervalCallbacks[room]);
  }
  const intervalRef = firebase.database().ref("/interval/" + room);
  intervalRefs[room] = intervalRef;
  intervalCallbacks[room] = intervalRef.on("value", snap => {
    const val = snap.val() || {time: 15};
    console.log("val", val);
    timeMap[room] = val.time;
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
    console.log(`Queue:`, queueMap[room]);

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
        firstItem.timeoutId = setTimeout(() => stop(room), 15000);
        timeMap[room] = 15;
        updateIntervalsMap[room] = setInterval(() => stopInterval(room), 1000);
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
  if (intervalCallbacks[room]) {
    intervalRefs[room].off("value", intervalCallbacks[room]);
  }
}

function stopInterval(room) {
  let time = 15;
  if(room in timeMap) {
    console.log("in time map!");
    time = timeMap[room] - 1;
  }
  console.log({time});
  intervalRefs[room].set({time});
}

function stop(room) {
  console.log(`QUEUE-DEBUG: Stopping user in room ${room}`);
  console.log(`QUEUE-DEBUG: First item`, firstItemMap[room]);
  if (firstItemMap[room] && firstItemMap[room].currentUsers) {
    timeMap[room] = 15;
    intervalRefs[room].set({
        time: timeMap[room]
    });
    clearInterval(updateIntervalsMap[room]);
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
