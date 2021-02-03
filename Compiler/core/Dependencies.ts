/**
 * @description Represents dependencies controller.
 * @author Крылов М.А.
 * @file Compiler/core/Dependencies.ts
 */

import { IPath } from './Resolvers';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as Deferred from 'Core/Deferred';
// @ts-ignore TODO: This module can only be referenced with ECMAScript imports/exports
//             by turning on the 'esModuleInterop' flag and referencing its default export.
import * as ParallelDeferred from 'Core/ParallelDeferred';

/**
 * Interface for dependencies controller.
 */
export interface IDependenciesController {

   /**
    * Register dependency.
    * @param path {IPath} Dependency path.
    */
   registerDependency(path: IPath): void;

   /**
    * Request all dependencies.
    */
   requestDependencies(): ParallelDeferred<unknown>;
}

/**
 * Dependencies collection.
 */
interface IDependencies {

   /**
    * Dependency item.
    */
   [fullPath: string]: IPath;
}

/**
 * Implements dependencies controller interface.
 */
class DependenciesController implements IDependenciesController {

   /**
    * Flag - load all dependencies (for JIT only)
    */
   private readonly loadDependencies: boolean;

   /**
    * Dependencies collection.
    */
   private readonly dependencies: IDependencies;

   /**
    * Dependency requests collection.
    */
   private readonly dependencyRequests: Deferred<unknown>[];

   /**
    * Initialize new instance of controller.
    * @param loadDependencies {boolean} Load requested dependencies.
    */
   constructor(loadDependencies: boolean) {
      this.loadDependencies = loadDependencies;
      this.dependencies = { };
      this.dependencyRequests = [];
   }

   /**
    * Register dependency.
    * @param path {IPath} Dependency path.
    */
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

   /**
    * Request all dependencies.
    */
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

/**
 * Create dependencies controller.
 * @param loadDependencies {boolean} Load requested dependencies.
 */
export default function createController(loadDependencies: boolean): IDependenciesController {
   return new DependenciesController(loadDependencies);
}
