import * as React from 'react';

import ReactButton from './Component/ReactButton';

export default class ReactInReact extends React.Component {
    state = {
        count: 0
    };

    increment = () => {
        this.setState({
            count: (this.state.count + 1)
        });
    };

    decrement = () => {
        this.setState({
            count: (this.state.count - 1)
        });
    };

    render() {
        return (
            <div>
                <div>
                    Проверяем работу нативных событий на примере click
                </div>
                <div>
                    React в React
                </div>
                <div>
                    <span>{this.state.count}</span>
                </div>
                <div>
                    <ReactButton buttonText="react decrement" buttonHandler={this.decrement} />
                    <ReactButton buttonText="react increment" buttonHandler={this.increment} />
                </div>
            </div>
        );
    }
}
