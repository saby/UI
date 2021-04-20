import { Control } from 'UICore/Base';
import { IControlOptions } from 'UICommon/Base';

interface ITestOptions extends IControlOptions {
    testName: string;
    fromNode: boolean;
    afterMountCallback?: Function;
    afterUpdateCallback?: Function;
}

export class TestBaseControl extends Control<ITestOptions> {
    testName: string = '';
    fromNode: boolean = true;
    afterMountCallback: Function = null;
    afterUpdateCallback: Function = null;
    _beforeMount(options: ITestOptions): void {
        this.afterMountCallback = options.afterMountCallback;
        this.afterUpdateCallback = options.afterUpdateCallback;
        this.testName = options.testName;
        this.fromNode = options.fromNode;
    }
    _afterMount(): void {
        this.afterMountCallback && this.afterMountCallback();
    }
    _afterUpdate(): void {
        this.afterUpdateCallback && this.afterUpdateCallback();
    }
}
