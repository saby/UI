/// <amd-module name="UI/_builder/Tmpl/codegen/Compatible" />

/**
 * @author Крылов М.А.
 */

import { genGetScope } from './Generator';
import { genUniteScope, getPlainMergeFunction } from './TClosure';

export function getDotsScopeSubstitution(): string {
   const innerScope = genGetScope('data');
   const outerScope = '{parent: undefined, element: undefined}';
   return genUniteScope(innerScope, outerScope) + `(${getPlainMergeFunction()})`;
}
