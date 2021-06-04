import {Control} from 'UICore/Base';
import * as React from 'react';

// tslint:disable:ban-ts-ignore
// tslint:disable:no-any
export default class ControlThrowError extends Control {
    constructor(props: any, ctx: any) {
        super(props, ctx);
        // @ts-ignore
        this.state = { shouldThrowError: false };
        this.throwError = this.throwError.bind(this);
    }


    throwError(): void {
        // @ts-ignore
        this.setState(() => ({
            shouldThrowError: true
        }));
    }
    render(): any {
        // @ts-ignore
        if(this.state.shouldThrowError){
            throw new Error('i crashed');
        }
        return React.createElement('div',{onClick: this.throwError}, 'click to throw error');
    }
}
