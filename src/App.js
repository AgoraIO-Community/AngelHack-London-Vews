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
      streamPage: true,
    };
  }

  componentDidMount() {
    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on("value", snap => {
      this.setState({ topic: snap.val() });
    });
  }

  componentWillUnmount() {
    this.topicRef.off("value", this.topicCallback);
  }

  render() {
    return (
      <div className="App">
        {this.state.topic ? (
            this.state.streamPage ? (
                <Stream />
                ) : (
                <Home topic={this.state.topic} onDiscuss={() => this.setState({streamPage: true})} />
            )
        ) : (
          <h1>Loading...</h1>
        )}
      </div>
    );
  }
}

export default App;
