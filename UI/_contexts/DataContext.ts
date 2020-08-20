class DataContext {
   private _version: 0;
   private _$users$;

   getVersion() {
      return this._version;
   };
   _nextVersion() {
      this._version++;
   };
   registerConsumer(control) {
      if(!this._$users$) {
         this._$users$ = [];
      }
      if (!~this._$users$.indexOf(control)) {
         this._$users$.push(control);
      }
   };
   unregisterConsumer(control) {
      if(this._$users$) {
         var index = this._$users$.indexOf(control);
         if (index > -1) {
            this._$users$.splice(index, 1);
         }
      }
   };
   updateConsumers() {
      if(this._$users$ && this._$users$.length) {
         for(var i = 0; i < this._$users$.length; i++) {
            this._$users$[i]._forceUpdate();
         }
      }
   };
}

export default DataContext;