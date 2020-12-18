import Todo from '../TODO/TODO';
import {createElement, Component} from 'react';

export default class App extends Component<{}, {}> {
    render(): unknown {
        return createElement('div', null, createElement(Todo));
    }
}
