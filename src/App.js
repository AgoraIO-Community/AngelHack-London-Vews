import AgoraRTC from 'agora-rtc-sdk';
import React, { Component } from 'react';
import firebase from "./firebase";

import "./App.scss";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topic: "Current Topic",
      client: null
    };
  }

  componentDidMount() {
    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on('value', (snap) => {
      this.setState({ topic: snap.val() });
    });

    var client = AgoraRTC.createClient({mode:'interop'});

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function(){
      console.log("AgoraRTC client initialized");
    });

    client.join(null, "webtest", undefined, (uid) => {
      console.log("User " + uid + " join channel successfully");
      console.log("Timestamp: " + Date.now());

      let localStream = AgoraRTC.createStream({
        streamID: uid,
        audio: true,
        video: true,
        screen: false
      })

      localStream.setVideoProfile("480p_4");

      localStream.init(function(){
        console.log("Local stream initialized");
        client.publish(localStream, function(err){
          console.log("Publish stream failed", err);
        });
      });

      this.setState({
        client
      })
    });
  }

  componentWillUnmount() {
    this.topicRef.off("value", this.topicCallback);
  }

  render() {
    return (
      <div className="App">
        <h1>Hello!</h1>
      </div>
    );
  }
}

export default App;
