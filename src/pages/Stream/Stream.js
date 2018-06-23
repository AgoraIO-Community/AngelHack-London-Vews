import AgoraRTC from "agora-rtc-sdk";
import React, { Component } from "react";
import { queueRef } from "../../queue";

import "./Stream.scss";

class Stream extends Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      queue: null,
    };
  }

  componentDidMount() {
    const client = AgoraRTC.createClient({ mode: "interop" });

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function() {
      console.log("AgoraRTC client initialized");
    });

    client.join(null, "webtest", undefined, uid => {
      console.log("User " + uid + " join channel successfully");
      console.log("Timestamp: " + Date.now());

      this.setState({
        client
      }, () => {
        //this.stream(uid);
        //this.watch();
      });
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

    localStream.setVideoProfile("480p_4");

    localStream.init(function() {
      console.log("Local stream initialized");
      localStream.play("outgoing-stream");
      client.publish(localStream, function(err) {
        console.log("Publish stream failed", err);
      });
    });
  }

  watch() {
    let client = this.state.client;

    //  MONITOR
    client.on("stream-added", function(evt) {
      var stream = evt.stream;
      console.log("New stream added: " + stream.getId());
      console.log("Timestamp: " + Date.now());
      console.log("Subscribe ", stream);
      //Subscribe to a remote stream after a new stream is added
      client.subscribe(stream, function(err) {
        console.log("Subscribe stream failed", err);
      });
    });

    /*
      @event: peer-leave when existing stream left the channel
      */
    client.on("peer-leave", function(evt) {
      console.log("Peer has left: " + evt.uid);
      console.log("Timestamp: " + Date.now());
      console.log(evt);
    });

    /*
      @event: stream-subscribed when a stream is successfully subscribed
      */
    client.on("stream-subscribed", function(evt) {
      var stream = evt.stream;
      stream.play("incoming-stream");
      console.log("Got stream-subscribed event");
      console.log("Timestamp: " + Date.now());
      console.log("Subscribe remote stream successfully: " + stream.getId());
      console.log(evt);
    });

    /*
      @event: stream-removed when a stream is removed
      */
    client.on("stream-removed", function(evt) {
      var stream = evt.stream;
      console.log("Stream removed: " + evt.stream.getId());
      console.log("Timestamp: " + Date.now());
      console.log(evt);
    });
  }

  componentWillUnmount() {
      //queueRef.off("value", this.queueCallback);
  }

  render() {
    return (
      <div className="Stream">
        <div
          id="incoming-stream"
          style={{
            width: 640,
            height: 480
          }}
        />
        <div
          id="outgoing-stream"
          style={{
            width: 640,
            height: 480
          }}
        />
      </div>
    );
  }
}

export default Stream;
