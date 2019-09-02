import {Control} from 'UI/Base';

export class TestBaseControl extends Control {
    testName = '';
    fromNode = true;
    afterMountCallback = null;
    afterUpdateCallback = null;
   _beforeMount(options) {
      this.afterMountCallback = options.afterMountCallback;
      this.afterUpdateCallback = options.afterUpdateCallback;
      this.testName = options.testName;
      this.fromNode = options.fromNode;
   }
   _afterMount() {
       this.afterMountCallback && this.afterMountCallback();
   }
   _afterUpdate() {
       this.afterUpdateCallback && this.afterUpdateCallback();
   }
}
