import * as React from 'react';

export default class OnDomElement extends React.Component {
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
                    подписка на DOM-элементах
                </div>
                <div>
                    <span>{this.state.count}</span>
                </div>
                <div>
                    <button onClick={this.decrement}>
                        on DOM decrement
                    </button>
                    <button onClick={this.increment}>
                        on DOM increment
                    </button>
                </div>
            </div>
        );
    }
}
