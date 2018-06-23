import AgoraRTC from 'agora-rtc-sdk';
import React, {Component} from 'react';
import firebase from "./firebase";

import "./App.scss";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topic: {name: ""},
      client: null
    };
  }

  componentDidMount() {
    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on('value', (snap) => {
      this.setState({topic: snap.val()});
    });

    // noinspection JSCheckFunctionSignatures
    const client = AgoraRTC.createClient({mode: 'interop'});

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function () {
      console.log("AgoraRTC client initialized");
    });

    client.join(null, "webtest", undefined, (uid) => {
      console.log("User " + uid + " join channel successfully");
      console.log("Timestamp: " + Date.now());

      // noinspection JSUnresolvedFunction
      let localStream = AgoraRTC.createStream({
        streamID: uid,
        audio: true,
        video: true,
        screen: false
      });

      // noinspection JSUnresolvedFunction
      localStream.setVideoProfile("480p_4");

      localStream.init(function () {
        console.log("Local stream initialized");
        setTimeout(() => {
          localStream.play("agora-remote");
        }, 5000)
        // noinspection JSUnresolvedFunction
        client.publish(localStream, function (err) {
          console.log("Publish stream failed", err);
        });
      });

      this.setState({
        client
      })
    });


      //  MONITOR
      client.on('stream-added', function (evt) {
        var stream = evt.stream;
        console.log("New stream added: " + stream.getId());
        console.log("Timestamp: " + Date.now());
        console.log("Subscribe ", stream);
        //Subscribe to a remote stream after a new stream is added
        client.subscribe(stream, function (err) {
          console.log("Subscribe stream failed", err);
        });
      });

      /*
      @event: peer-leave when existing stream left the channel
      */
      client.on('peer-leave', function (evt) {
        console.log("Peer has left: " + evt.uid);
        console.log("Timestamp: " + Date.now());
        console.log(evt);
      });

      /*
      @event: stream-subscribed when a stream is successfully subscribed
      */
      client.on('stream-subscribed', function (evt) {
        var stream = evt.stream;
        console.log("Got stream-subscribed event");
        console.log("Timestamp: " + Date.now());
        console.log("Subscribe remote stream successfully: " + stream.getId());
        console.log(evt);
      });

      /*
      @event: stream-removed when a stream is removed
      */
      client.on("stream-removed", function (evt) {
        var stream = evt.stream;
        console.log("Stream removed: " + evt.stream.getId());
        console.log("Timestamp: " + Date.now());
        console.log(evt);
      });
  }

  stream() {

  }

  componentWillUnmount() {
    this.topicRef.off("value", this.topicCallback);
  }

  render() {
    return (
        <div className="App">
          {
            this.state.topic ? (
                <div>
                  <h1>{this.state.topic.title}</h1>
                  <div id="agora-remote" style={{
                    width: 640,
                    height: 480
                  }}></div>
                  <p>{this.state.topic.description}</p>
                  <div className="button">Discuss</div>
                </div>
            ) : (
                <h1>Loading...</h1>
            )
          }
        </div>
    );
  }
}

export default App;
