import * as React from 'react';

import ReactButton from './Component/ReactButton';
import WasabyButton from '../WasabyOverReact/Component/WasabyButton';


export default class Counter extends React.Component {
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


    emulator = () => {
        this.setState({
            count: (this.state.count - 1)
        });
    };

    render() {
        const wasabyDecrement = {
            buttonText: "wasaby decrement",
            buttonHandler: this.decrement
        };
        const wasabyIncrement = {
            buttonText: "wasaby increment",
            buttonHandler: this.increment
        };
        return (
            <div className="Counter">
                <div>
                    Проверяем работы нативных событий на примере click
                </div>
                <div>
                    react decrement/react increment - чистые react контролы
                </div>
                <div>
                    on DOM decrement/on DOM increment - подписка на DOM-элементах
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
                    <span >{this.state.count}</span>
                </div>
                <div>
                    <ReactButton buttonText="react decrement" buttonHandler={this.decrement} />
                    <ReactButton buttonText="react increment" buttonHandler={this.increment} />
                </div>
                <div>
                    <button onClick={this.decrement}>
                        on DOM decrement
                    </button>
                    <button onClick={this.increment}>
                        on DOM increment
                    </button>
                </div>
                <div>
                    <WasabyButton {...wasabyDecrement } />
                    <WasabyButton {...wasabyIncrement } />
                </div>
            </div>
        );
    }
}
