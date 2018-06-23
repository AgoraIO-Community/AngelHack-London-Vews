import AgoraRTC from "agora-rtc-sdk";
import React, { Component } from "react";
import { queueRef } from "../../queue";

import "./Stream.scss";

class Stream extends Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      queue: null
    };
  }

  componentDidMount() {
    const client = AgoraRTC.createClient({ mode: "interop" });

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function() {});

    client.join(null, "webtest", undefined, uid => {
      this.setState(
        {
          client
        },
        () => {
          this.stream(uid);
          this.watch();
        }
      );
    });

    /*this.queueCallback = queueRef.on("value", snap => {
      this.setState({ queue: snap.val() });
      console.log(snap.val());
    });*/
  }

  stream(uid) {
    let client = this.state.client;

    let localStream = AgoraRTC.createStream({
      streamID: uid,
      audio: true,
      video: true,
      screen: false
    });

    localStream.setVideoProfile("720P_3");

    localStream.init(function() {
      client.enableDualStream(function() {}, function(err) {});
      localStream.play("outgoing-stream");
      client.publish(localStream, function(err) {});
    });
  }

  watch() {
    let client = this.state.client;

    //  MONITOR
    client.on("stream-added", function(evt) {
      var stream = evt.stream;
      //Subscribe to a remote stream after a new stream is added
      client.subscribe(stream, function(err) {});
    });

    /*
      @event: peer-leave when existing stream left the channel
      */
    client.on("peer-leave", function(evt) {});

    /*
      @event: stream-subscribed when a stream is successfully subscribed
      */
    client.on("stream-subscribed", function(evt) {
      var stream = evt.stream;
      document.getElementById("incoming-stream").innerHTML = "";
      stream.play("incoming-stream");
    });

    /*
      @event: stream-removed when a stream is removed
      */
    client.on("stream-removed", function(evt) {
      var stream = evt.stream;
    });
  }

  componentWillUnmount() {
    //queueRef.off("value", this.queueCallback);
  }

  render() {
    return (
      <div className="stream">
        <div className="container titles">
          <div className="location">
            London, UK.
          </div>
          <div className="time">
            00:57
          </div>
        </div>
        <div className="streams-wrapper container">
          <div className="eight columns">
          <div
              id="outgoing-stream"
              className="stream-container"
              style={{
                display: "none",
                width: "100%",
                height: 500
              }}
            />
            <div
              id="incoming-stream"
              className="stream-container"
              style={{
                position: "initial",
                width: "100%",
                height: 500
              }}
            />
          </div>
          <div className="four columns">
            <div className="chat" />
          </div>
        </div>
      </div>
    );
  }
}

export default Stream;
