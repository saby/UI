import {TemplateFunction} from 'UI/Base';
import {TestBaseControl} from '../Base';
import {detection} from 'Env/Env';

import template = require('wml!UITest/Focus/WithInputFakeMobile');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    isMobilePlatform: false;
    _beforeMount() {
        TestBaseControl.prototype._beforeMount.apply(this, arguments);
        if (this.fromNode) {
            this.isMobilePlatform = detection['test::isMobilePlatform'];
            detection['test::isMobilePlatform'] = true;
        } else {
            this.isMobilePlatform = detection.isMobilePlatform;
            detection.isMobilePlatform = true;
        }
    }
    destroy() {
        TestBaseControl.prototype.destroy.apply(this, arguments);
        if (this.fromNode) {
            detection['test::isMobilePlatform'] = this.isMobilePlatform
        } else {
            detection.isMobilePlatform = this.isMobilePlatform;
        }
    }
}

export default TestControl;
