/// <amd-module name="UI/_builder/Tmpl/codegen/Compatible" />

/**
 * @description Code generation compatible methods
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/codegen/Compatible.ts
 */

import { genGetScope } from './Generator';
import { genUniteScope, getPlainMergeFunction } from './TClosure';

/**
 * Generate scope="{{ ... }}" substitution.
 */
export function getDotsScopeSubstitution(): string {
   const innerScope = genGetScope('data');
   const outerScope = '{parent: undefined, element: undefined}';
   return genUniteScope(innerScope, outerScope) + `(${getPlainMergeFunction()})`;
}
