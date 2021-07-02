/// <amd-module name='UICommon/_deps/PageDeps' />

import { ICollectedFiles, IDeps } from './Interface';
import { DepsCollector } from 'UICommon/_deps/DepsCollector';
import { getUnpackDepsFromCookie, getDebugDeps, getDepsCollectorParams, isDebug } from 'UICommon/_deps/RecursiveWalker';

const { links, nodes, bundles } = getDepsCollectorParams();
const depsCollector = new DepsCollector(links, nodes, bundles);

export default class PageDeps {

   collect(initDeps: IDeps = [], unpackRtPackDeps: IDeps): ICollectedFiles {
      if (isDebug()) {
         return getDebugDeps(initDeps);
      }
      const unpack = getUnpackDepsFromCookie().concat(unpackRtPackDeps);
      return depsCollector.collectDependencies(initDeps, unpack);
   }
}
