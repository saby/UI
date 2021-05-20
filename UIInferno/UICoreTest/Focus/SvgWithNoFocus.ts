import { TemplateFunction } from 'UICommon/Base';
import {TestBaseControl} from '../Base';

// @ts-ignore
import template = require('wml!UICoreTest/Focus/SvgWithNoFocus');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    _afterMount() {
        TestBaseControl.prototype._afterMount.apply(this, arguments);
        // Emit ie svg without focus
        document.getElementById('svg').focus = undefined;
    }
}

export default TestControl;
