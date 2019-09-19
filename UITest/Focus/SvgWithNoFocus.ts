import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base';

import template = require('wml!UITest/Focus/SvgWithNoFocus');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    _afterMount() {
        TestBaseControl.prototype._afterMount.apply(this, arguments);
        // Emit ie svg without focus
        document.getElementById('svg').focus = undefined;
    }
}

export default TestControl;
