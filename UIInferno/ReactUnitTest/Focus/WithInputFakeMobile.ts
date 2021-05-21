import { TemplateFunction } from 'UICommon/Base';
import {TestBaseControl} from '../Base';
import {detection} from 'Env/Env';

// @ts-ignore
import template = require('wml!ReactUnitTest/Focus/WithInputFakeMobile');

class TestControl extends TestBaseControl {
    _template: TemplateFunction = template;
    protected isMobilePlatform: boolean;
    _beforeMount() {
        TestBaseControl.prototype._beforeMount.apply(this, arguments);
        this.isMobilePlatform = detection.isMobilePlatform;
        detection.isMobilePlatform = true;
    }
    destroy() {
        // @ts-ignore
        TestBaseControl.prototype.destroy.apply(this, arguments);
        detection.isMobilePlatform = this.isMobilePlatform;
    }
}

export default TestControl;
