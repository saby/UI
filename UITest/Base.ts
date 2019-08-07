import {Control} from 'UI/Base';

export class TestBaseControl extends Control {
   _beforeMount(options) {
      if (typeof options.afterMountCallback === 'function') {
         this.afterMountCallback = options.afterMountCallback;
      }
      if (typeof options.afterUpdateCallback === 'function') {
         this.afterUpdateCallback = options.afterUpdateCallback;
      }
   }
   _afterMount() {
      this.afterMountCallback();
   }
   _afterUpdate() {
      this.afterUpdateCallback();
   }
   afterMountCallback(){}
   afterUpdateCallback(){}
}