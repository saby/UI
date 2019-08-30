import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base';
import {detection} from 'Env/Env';

import template = require('wml!UITest/Focus/WithInputFakeMobile');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    _beforeMount() {
        TestBaseControl.prototype._beforeMount.apply(this, arguments);
        if (this.fromNode) {
            detection['test::isMobilePlatform'] = true;
        } else {
            detection.isMobilePlatform = true;
        }
    }
    destroy() {
        TestBaseControl.prototype.destroy.apply(this, arguments);
        if (this.fromNode) {
            detection['test::isMobilePlatform'] = true;
        } else {
            detection.isMobilePlatform = true;
        }
    }
}

export default TestControl;
