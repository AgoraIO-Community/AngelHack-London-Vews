import React, { Component } from 'react';
import firebase from "./firebase";

import "./App.scss";

class App extends Component {
  state = {
    topic: { name: "" }
  };

  componentDidMount() {
    this.topicRef = firebase.database().ref("/topic");
    this.topicCallback = this.topicRef.on('value', (snap) => {
      this.setState({ topic: snap.val() });
    });
  }

  componentWillUnmount() {
    this.topicRef.off("value", this.topicCallback);
  }

  render() {
    return (
      <div className="App">
        <h1>Hello!</h1>
        <p>The current topic is {JSON.stringify(this.state.topic)}</p>
      </div>
    );
  }
}

export default App;
