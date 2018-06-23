import AgoraRTC from "agora-rtc-sdk";
import React, { Component } from "react";
import * as queue from "../../queue";
import Chat from "./Chat";

import "./Stream.scss";

class Stream extends Component {
  constructor(props) {
    super(props);
    this.state = {
      client: null,
      firstItem: false,
      inQueue: false,
      streaming: false,
      streamingStream: null,
      watching: false,
      watchingStream: null
    };
  }

  componentDidMount() {
    //this.connect();
  }

  connect() {
    const client = AgoraRTC.createClient({ mode: "interop" });

    client.init("8afc4d7d7acf4d10a4014c306d7153c1", function() {});

    client.join(null, "webtest", undefined, uid => {
      this.setState(
        {
          client
        },
        () => {
          console.log("Client ready!");

          queue.setQueueListener(queueState => {
            console.log(`Queue state changed to ${JSON.stringify(queueState)}`);
            this.setState(queueState);
            if (queueState.firstItem) {
              console.log("First item exists...");
              if (queueState.firstItem.currentUsers) {
                console.log("Streaming current user...");
                this.stream(uid);
              } else {
                console.log("Watching...");
                this.watch();
              }
            } else {
              console.log("No items in queue, so stopping everything...");
              this.stopEverything();
            }
          });
        }
      );
    });
  }

  disconnect() {
    queue.removeQueueListener();
    let client = this.state.client;
    console.log("disconnecting...")

    client.leave(() => {
      console.log("client leaves channel");
      this.setState({
        client: null,
        firstItem: false,
        inQueue: false,
        streaming: false,
        streamingStream: null,
        watching: false,
        watchingStream: null
      }, () => {

        this.connect();
      })
    }, (err) => {
      console.log("client leave failed ", err);
    });
  }

  stopEverything() {
    console.log("Stopping everything...");
    if (this.state.streaming) {
      console.log("Stopping stream...");
      this.state.client.unpublish(this.state.streamingStream);
      this.state.streamingStream.stop();
      this.state.streamingStream.close();
      this.setState({ streaming: false, streamingStream: null });
    }
    if (this.state.watching) {
      console.log("Stopping watch...");
      this.state.watchingStream.stop();
      this.state.watchingStream.close();
      this.setState({ watching: false, watchingStream: null });
    }
    document.getElementById("stream").innerHTML = "";
  }

  stream(uid) {
    this.stopEverything();

    let client = this.state.client;

    let localStream = AgoraRTC.createStream({
      streamID: uid,
      audio: true,
      video: true,
      screen: false
    });

    localStream.setVideoProfile("720P_3");

    localStream.init(() => {
      //client.enableDualStream(function() {}, function(err) {});
      localStream.play("stream");
      client.publish(localStream, function(err) {});

      this.setState({ streaming: true, streamingStream: localStream });
    });
  }

  watch() {
    this.stopEverything();

    let client = this.state.client;

    //  MONITOR
    client.on("stream-added", evt => {
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
    client.on("stream-subscribed", evt => {
      var stream = evt.stream;
      stream.play("stream");

      this.setState({ watching: true, watchingStream: stream });
    });

    /*
      @event: stream-removed when a stream is removed
      */
    client.on("stream-removed", (evt) => {
      var stream = evt.stream;
      client.unsubscribe(stream);
      this.disconnect();
    });
  }

  componentWillUnmount() {
    //queueRef.off("value", this.queueCallback);
  }

  stop() {
      queue.stop();
      this.setState({inQueue: false});
  }

  enqueue() {
      queue.enqueue();
      this.setState({inQueue: true});
  }

  render() {
    return (
      <div className="stream">
        <div className="container titles">
          <div className="location">London, UK.</div>
          <div className="time">00:57</div>
        </div>
        <div className="streams-wrapper container">
          <div className="eight columns">
            <div
              id="stream"
              className="stream-container"
              style={{
                position: "initial",
                width: "100%",
                height: 400
              }}
            />
            <div className="info">
              {this.state.inQueue ? (
                  this.state.firstItem.currentUsers
                      ? (
                          <div className="button" onClick={() => this.stop()}>
                              Stop streaming.
                          </div>
                      )
                      : ( <div className="button" onClick={() => this.stop()}>
                              Leave streaming queue.
                          </div>
                      )
              ) : (
                <div className="button" onClick={() => this.enqueue()}>
                  Join streaming queue.
                </div>
              )}
            </div>
          </div>
          <div className="four columns">
            <div className="chat">
                <Chat uid={this.props.uid}/>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Stream;
