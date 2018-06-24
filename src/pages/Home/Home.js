import React, { Component } from "react";

import "./Home.scss";

class Home extends Component {
  render() {
    return (
      <div className="page home">
        <div className="container">
          <h1>{this.props.topic.title}</h1>
          <h5>{this.props.topic.description}</h5>
          <div className="button" onClick={this.props.onDiscuss}>
            Discuss
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
