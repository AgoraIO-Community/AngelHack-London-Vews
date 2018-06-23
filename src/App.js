import AgoraRTC from 'agora-rtc-sdk';
import React, { Component } from 'react';
import firebase from "./firebase";

import Home from "./pages/Home/Home";

import "./App.scss";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topic: null,
      client: null
    };
  }

  componentDidMount() {
    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on('value', (snap) => {
      this.setState({ topic: snap.val() });
    });

    // noinspection JSCheckFunctionSignatures
    const client = AgoraRTC.createClient({mode:'interop'});

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function(){
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

      localStream.init(function(){
        console.log("Local stream initialized");
        // noinspection JSUnresolvedFunction
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
          {
              this.state.topic ? (
                  <Home topic={this.state.topic}/>
              ) : (
                  <h1>Loading...</h1>
              )
          }
      </div>
    );
  }
}

export default App;
