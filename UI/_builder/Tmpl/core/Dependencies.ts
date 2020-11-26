/// <amd-module name="UI/_builder/Tmpl/core/Dependencies" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/Dependencies.ts
 */

import { IPath } from 'UI/_builder/Tmpl/core/Resolvers';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as Deferred from 'Core/Deferred';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as ParallelDeferred from 'Core/ParallelDeferred';

export interface IDependenciesController {
   registerDependency(path: IPath): void;
   requestDependencies(): ParallelDeferred<unknown>;
}

interface IDependencies {
   [fullPath: string]: IPath;
}

class DependenciesController implements IDependenciesController {
   private readonly loadDependencies: boolean;
   private readonly dependencies: IDependencies;
   private readonly dependencyRequests: Deferred<unknown>[];

   constructor(loadDependencies: boolean) {
      this.loadDependencies = loadDependencies;
      this.dependencies = { };
      this.dependencyRequests = [];
   }

   registerDependency(path: IPath): void {
      const fullPath = path.getFullPhysicalPath();
      if (!this.dependencies.hasOwnProperty(fullPath)) {
         this.dependencies[fullPath] = path;
      }
      if (!this.loadDependencies || requirejs.defined(fullPath)) {
         return;
      }
      const deferred = new Deferred();
      this.dependencyRequests.push(deferred);
      if (require.defined(fullPath)) {
         deferred.callback(require(fullPath));
         return;
      }
      require([fullPath], (module) => {
         if (module || module === null) {
            deferred.callback(module);
            return;
         }
         deferred.errback(new Error(`Не удалось загрузить файл "${fullPath}"`));
      }, (error) => {
         deferred.errback(error);
      });
   }

   requestDependencies(): ParallelDeferred<unknown> {
      const parallelDeferred = new ParallelDeferred();
      if (!this.loadDependencies || this.dependencyRequests.length === 0) {
         return parallelDeferred.done().getResult();
      }
      this.dependencyRequests.forEach((deferred) => {
         parallelDeferred.push(deferred);
      });
      return parallelDeferred.done().getResult();
   }
}

export default function createController(loadDependencies: boolean): IDependenciesController {
   return new DependenciesController(loadDependencies);
}
