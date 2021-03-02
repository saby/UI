import * as React from 'react';

export default class ReactCustom extends React.Component<{handlerName: string, onMyCustomEvent: Function}> {
    state = {
        wasEmulated: false
    };

    emulator = () => {
        this.props.onMyCustomEvent();
    };

    render() {
        return (
            <button onClick={this.emulator}>
               call {this.props.handlerName}
            </button>
        );
    }
}
