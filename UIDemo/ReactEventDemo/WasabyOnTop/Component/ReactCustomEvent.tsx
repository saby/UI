import * as React from 'react';

export default class ReactCustomEvent extends React.Component<{eventName: string, onMycustomevent: Function}> {
    state = {
        wasEmulated: false
    };

    callCustomEvent = () => {
        this.props.onMycustomevent();
    };

    render() {
        return (
            <button onClick={this.callCustomEvent}>
                call {this.props.eventName}
            </button>
        );
    }
}
