import AgoraRTC from "agora-rtc-sdk";
import React, { Component } from "react";
import * as queue from "../../queue";
import * as watchingcount from "../../watchingcount";
import Chat from "./Chat";

import "./Stream.scss";

let staticRoom = "";

function removeStaticRoom() {
  watchingcount.removeCountsListener(staticRoom);
  queue.stop(staticRoom);
}

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
      queueLength: 0,
      time: 15,
      watchingStream: null,
      numWatching: 0,
      canStream: false
    };
  }

  componentDidMount() {
    this.connect();

    watchingcount.setCountsListener(this.props.topic.id, count => {
        this.setState({numWatching: count});
    });

    staticRoom = this.props.topic.id;
    window.addEventListener('beforeunload', removeStaticRoom);
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
          queue.setIntervalListener(this.props.topic.id, interval => {
            this.setState({
              time: interval
            });
          });
          queue.setQueueListener(this.props.topic.id, queueState => {
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
            } else if (queueState.updateQueue) {
              return;
            } else {
              console.log("No items in queue, so stopping everything...");
              this.stopEverything();
            }
          });
        }
      );
    });

    client.on("stream-added", (evt) => {
      console.log("Stream added");
      var stream = evt.stream;
      //Subscribe to a remote stream after a new stream is added
      client.subscribe(stream, function(err) {});
    });

    client.on("stream-subscribed", evt => {
        var stream = evt.stream;
        stream.play("stream");

        this.setState({ watching: true, watchingStream: stream });
    });
  }

  disconnect() {
    this.stopEverything();
    queue.removeQueueListener(this.props.topic.id);
    let client = this.state.client;
    console.log("disconnecting...");

    client.leave(
      () => {
        console.log("client leaves channel");
        this.setState(
          {
            client: null,
            firstItem: false,
            inQueue: false,
            streaming: false,
            streamingStream: null,
            watching: false,
            time: 15,
            watchingStream: null
          },
          () => {
            this.connect();
          }
        );
      },
      err => {
        console.log("client leave failed ", err);
      }
    );
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
  }

  stream(uid) {
    if(this.state.streaming) {
        this.stopEverything();
    }

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
    if(this.state.streaming) {
        this.stopEverything();
    }

    let client = this.state.client;

    //  MONITOR
    // client.on("stream-added", evt => {
    //
    // });

    /*
      @event: peer-leave when existing stream left the channel
      */
    client.on("peer-leave", function(evt) {});

    /*
      @event: stream-subscribed when a stream is successfully subscribed
      */


    /*
      @event: stream-removed when a stream is removed
      */
    client.on("stream-removed", evt => {
      var stream = evt.stream;
      client.unsubscribe(stream);
      this.disconnect();
    });
  }

  componentWillUnmount() {
    //queueRef.off("value", this.queueCallback);
    this.stopEverything();
    this.disconnect();
    watchingcount.removeCountsListener(this.props.topic.id);

    window.removeEventListener("beforeunload", removeStaticRoom);
  }

  stop() {
    queue.stop(this.props.topic.id);
    this.setState({ inQueue: false });
  }

  enqueue() {
    queue.enqueue(this.props.topic.id);
    this.setState({ inQueue: true });
  }

  render() {
    return (
      <div className="stream">
        <div className="container">
          <div className="header">
            <h1>Discussion.</h1>
            <hr />
          </div>
        </div>
        <div className="streams-wrapper container">
          <div className="twelve columns">
            <div
              id="stream"
              className="stream-container"
              style={{
                position: "initial",
                width: "100%",
                height: 500
              }}
            >
              <div className="top-overlay" style={{
                display: this.state.time != 15 ? 'initial' : 'none'
              }}>Live: {this.state.time} seconds.</div>
              <div className="stream-overlay">{this.props.topic.title}</div>
              {!this.state.streaming && !this.state.watching ? (
                <h5>No one is streaming right now, why don't you?</h5>
              ) : null}
              <Chat onLoad={() => this.setState({canStream: true})}/>
            </div>
            <div className="info">
              <div style={{
                flexGrow: 1
              }}>
                 <p style={{
                margin: 0
                  }}>{this.state.numWatching} {this.state.numWatching === 1 ? "person" : "people"} watching.</p>
                <p
                  style={{
                    margin: 0,
                    marginTop: 2
                  }}
                >
                  {this.state.queueLength > 0 ? this.state.queueLength - 1 : 0} in the streaming queue.
                </p>
              </div>
              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                alignItems: 'flex-end',
                flexWrap: 'wrap'
              }}>
                  {
                    this.state.inQueue && this.state.firstItem.currentUsers ? (<div/>) : (<div
                        className="button back"
                        onClick={() => this.props.goBack()}
                    >
                        Back to Stories.
                    </div>
                      )
                  }
                {this.state.canStream ? (this.state.inQueue ? (
                  this.state.firstItem.currentUsers ? (
                    <div className="button" onClick={() => this.stop()}>
                      Stop streaming.
                    </div>
                  ) : (
                    <div className="button" onClick={() => this.stop()}>
                      Leave streaming queue.
                    </div>
                  )
                ) : (
                  <div className="button" onClick={() => this.enqueue()}>
                    Join streaming queue.
                  </div>
                )) : (<div/>)}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default Stream;
