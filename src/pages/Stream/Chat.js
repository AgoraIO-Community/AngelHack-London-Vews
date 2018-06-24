import React, {Component} from "react";
// noinspection ES6CheckImport
import { ChatManager, TokenProvider } from '@pusher/chatkit'

import "./Chat.scss";

class Chat extends Component {
    state = {
        messages: [],
        chatManager: null,
        currentUser: null,
        emojis: [
            "👌",
            "👎",
            "❤️"
        ],
        loaded: false
    };

    componentDidMount() {
        const chatManager = new ChatManager({
            instanceLocator: "v1:us1:e689a8bc-0470-4836-809a-fdfff285adc9",
            userId: "user",
            tokenProvider: new TokenProvider({
                url: "https://us1.pusherplatform.io/services/chatkit_token_provider/v1/e689a8bc-0470-4836-809a-fdfff285adc9/token\n"
            })
        });
        this.setState({chatManager});

        let initialMessageQueue = [];
        let addingInitialMessages = true;

        const doInitialMessageQueue = () => {
            addingInitialMessages = false;

            const doInitialShowMessage = () => {
                if(initialMessageQueue.length > 0) {
                    const m = initialMessageQueue.shift();
                    addMessage(m);
                    setTimeout(doInitialMessageQueue, 100);
                }
            };

            doInitialShowMessage();
        };

        const addMessage = (message) => {
            this.setState({messages: [...this.state.messages, message]});

            setTimeout(() => {
                this.setState({messages: this.state.messages.filter(m => m.id !== message.id)});
            }, 1900)
        };

        chatManager
            .connect()
            .then(currentUser => {
                this.setState({currentUser});
                // noinspection JSUnresolvedFunction, JSUnresolvedVariable, JSUnusedGlobalSymbols
                currentUser.subscribeToRoom({
                    roomId: currentUser.rooms[0].id,
                    messageLimit: 10,
                    hooks: {
                        onNewMessage: message => {
                            if(!this.state.loaded) {
                                this.setState({loaded: true});
                                this.props.onLoad();
                                setTimeout(doInitialMessageQueue, 150);
                            }

                            const m = {
                                id: message.id,
                                text: message.text,
                                x: Math.random() * 80
                            };

                            if(addingInitialMessages) {
                                initialMessageQueue.push(m)
                            } else {
                                addMessage(m);
                            }
                        }
                    }
                });

                console.log("Connected: ", currentUser);
            })
            .catch(error => {
                console.error("Chat error:", error);
            });
    }

    componentWillUnmount() {
        this.setState({currentUser: null});
        this.state.chatManager.disconnect();
    }

    sendMessage(message) {
        const { currentUser } = this.state;
        // noinspection JSUnresolvedVariable
        currentUser.sendMessage({
            text: message,
            roomId: currentUser.rooms[0].id
        });
    }

    render() {
        return (
            <div className="chat-container">
                <div className="chat-messages">
                    {
                        this.state.messages.map(message => (
                            <p key={message.id} className="chat-message" style={{left: message.x + "%"}}>{message.text}</p>
                        ))
                    }
                </div>
                <div className="chat-emoji-buttons">
                    {
                        this.state.emojis.map(emoji => (
                            <div key={emoji} className="emoji-button-container">
                                <div className="emoji-button" onClick={() => this.sendMessage(emoji)}>{emoji}</div>
                            </div>
                        ))
                    }
                </div>
            </div>
        )
    }
}

export default Chat;