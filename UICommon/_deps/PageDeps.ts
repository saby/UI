/// <amd-module name='UICommon/_deps/PageDeps' />

import { ICollectedFiles, IDeps } from './Interface';
import { getUnpackDepsFromCookie, getDebugDeps, getDepsCollector, isDebug } from 'UICommon/_deps/RecursiveWalker';

export default class PageDeps {

   collect(initDeps: IDeps = [], unpackRtPackDeps: IDeps): ICollectedFiles {
      if (isDebug()) {
         return getDebugDeps(initDeps);
      }
      const unpack = getUnpackDepsFromCookie().concat(unpackRtPackDeps);
      return getDepsCollector().collectDependencies(initDeps, unpack);
   }
}
