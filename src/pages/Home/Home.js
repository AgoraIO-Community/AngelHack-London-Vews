import React, { Component } from "react";

import "./Home.scss";

class Home extends Component {
  render() {
    return (
      <div className="page home">
        <div className="container">
        <div className="header">
          <h1>Stories.</h1>
          <hr />
        </div>
          {this.props.topic.map((current, i) => {
            return (
              <div className="topic" key={i}>
                <h1 style={{
                  color: (i === 0 ? "white" : "#5A5B5E")
                }}>{current.title}</h1>
                <h5 style={{
                  color: (i === 0 ? "white" : "#5A5B5E")
                }}>{current.description}</h5>
                <div className={"button" + (i === 0 ? " first" : " rest")} onClick={this.props.onDiscuss}>
                  Discuss
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default Home;
