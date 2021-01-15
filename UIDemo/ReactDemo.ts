import {Control, TemplateFunction} from 'UI/Base';
// @ts-ignore
import * as template from 'wml!UIDemo/ReactDemo/Index';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import App from './ReactDemo/App/App';

export default class Index extends Control {
    _template: TemplateFunction = template;

    protected _afterMount(): void {
        ReactDOM.render(React.createElement(App), document.getElementById('app'));
    }
}
