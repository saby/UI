import {TemplateFunction} from 'UICore/Base';
import {TestBaseControl} from '../Base';

// @ts-ignore
import template = require('wml!UICore/UITest/Focus/SvgWithNoFocus');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    _afterMount() {
        TestBaseControl.prototype._afterMount.apply(this, arguments);
        // Emit ie svg without focus
        document.getElementById('svg').focus = undefined;
    }
}

export default TestControl;
