import {
   onStartSync as _onStartSync,
   onEndSync as _onEndSync
} from 'UI/DevtoolsHook';

const startedRootId = {};

export function onStartSync(rootId) {
   startedRootId[rootId] = startedRootId[rootId] || 0;
   if (startedRootId[rootId] === 0) {
      _onStartSync(rootId);
   }
   startedRootId[rootId]++;
}
export function onEndSync(rootId) {
   startedRootId[rootId] = startedRootId[rootId] || 1;
   startedRootId[rootId]--;
   if (startedRootId[rootId] === 0) {
      _onEndSync(rootId);
   }
}