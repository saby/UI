import {Control} from 'UI/ReactComponent';
import {createElement} from 'react';
import Todo from '../TODO/TODO';

export default class App extends Control {
    render() {
        return createElement('div', {className: 'demo-ReactWasaby__app'}, createElement(Todo));
    }
}
