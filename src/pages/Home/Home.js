import React, { Component } from 'react';

import "./Home.scss"

class Home extends Component {
    render() {
        return (
            <div className="page home">
                <div>
                    <h1>{this.props.topic.title}</h1>
                    <p>{this.props.topic.description}</p>
                    <p>{this.props.topic.date}</p>
                    <div className="button" onClick={this.props.onDiscuss}><i className="fal fa-comments"/>Discuss</div>
                </div>
            </div>
        )
    }
}

export default Home;