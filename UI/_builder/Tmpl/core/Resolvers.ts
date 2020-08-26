/// <amd-module name="UI/_builder/Tmpl/core/Resolvers" />

/**
 * @author Крылов М.А.
 */

export function resolveComponentName(name: string): { name: string; path: string[]; } {
   const parts = name.split(':', 2);
   return {
      name: parts[0],
      path: parts[1] ? parts[1].split('.') : []
   };
}

export function resolveComponent(name: string): { library: string[]; module: string[]; } {
   const meta = resolveComponentName(name);
   return {
      library: meta.name.split('.'),
      module: meta.path
   }
}
