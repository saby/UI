import * as React from 'react';

import WasabyButton from './Component/WasabyButton';

export default class WasabyInReact extends React.Component {
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
        const wasabyDecrement = {
            buttonText: "decrement",
            buttonHandler: this.decrement
        };
        const wasabyIncrement = {
            buttonText: "increment",
            buttonHandler: this.increment
        };
        return (
            <div>
                <div>
                    Проверяем работу нативных событий на примере click
                </div>
                <div>
                    WasabyOverReact in React
                </div>
                <div>
                    wasaby decrement/wasaby increment - wasabyOverReact контролы (наследники UI/ReactComponent)
                    <div>
                        контролы с подпиской on: - вызывают обработчик через on:click
                    </div>
                    <div>
                        контролы без on: - вызывают обработчик через onClick
                    </div>
                </div>
                <div>
                    <span>{this.state.count}</span>
                </div>
                <div>
                    <WasabyButton {...wasabyDecrement } />
                    <WasabyButton {...wasabyIncrement } />
                </div>
            </div>
        );
    }
}
