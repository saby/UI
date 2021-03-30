import * as React from 'react';

// import WasabyButton from './Component/WasabyButton';
import WasabyNotify from './Component/WasabyNotify';

export default class WasabyInReact extends React.Component {
    // state = {
    //     count: 0
    // };
    //
    // increment = () => {
    //     this.setState({
    //         count: (this.state.count + 1)
    //     });
    // };
    //
    // decrement = () => {
    //     this.setState({
    //         count: (this.state.count - 1)
    //     });
    // };

    render() {
        // const wasabyDecrement = {
        //     buttonText: "decrement",
        //     buttonHandler: this.decrement
        // };
        // const wasabyIncrement = {
        //     buttonText: "increment",
        //     buttonHandler: this.increment
        // };
        return (
            <div>
                <div>
                    <WasabyNotify />
                </div>
            </div>
        );
    }
}
