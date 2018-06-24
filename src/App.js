import AgoraRTC from "agora-rtc-sdk";
import React, { Component } from "react";
import firebase from "./firebase";

import Home from "./pages/Home/Home";
import Stream from "./pages/Stream/Stream";

import "./App.scss";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      topic: null,
      client: null,
      streamPage: false,
      uid: null,
      currentTopic: null,
    };
  }

  goBack() {
    this.setState({
      streamPage: false
    });
  }

  componentDidMount() {
    this.unregisterAuthObserver = firebase.auth().onAuthStateChanged(user => {
      if (!user) {
        firebase.auth().signInAnonymously();
      } else {
        console.log(user.uid);
        this.setState({ uid: user.uid });
      }
    });

    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on("value", snap => {
      this.setState({ topic: snap.val() });
    });
  }

  componentWillUnmount() {
    this.unregisterAuthObserver();
    this.topicRef.off("value", this.topicCallback);
  }

  discuss(topic) {
    this.setState({currentTopic: topic});
    this.setState({ streamPage: true });
  }

  render() {
    return (
      <div className="App">
        {this.state.topic && this.state.uid ? (
          (this.state.streamPage && this.state.currentTopic) ? (
            <Stream uid={this.state.uid} topic={this.state.currentTopic} goBack={this.goBack.bind(this)} />
          ) : (
            <Home
              topic={this.state.topic}
              onDiscuss={topic => this.discuss(topic)}
            />
          )
        ) : (
          <h1 />
        )}
      </div>
    );
  }
}

export default App;
