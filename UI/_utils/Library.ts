/**
 * Workaround for library module name syntax support.
 * @public
 * @author Мальцев А.А.
 */

interface ILibrary<T> {
   [propName: string]: T | ILibrary<T>;
}

interface IParsed {
   name: string;
   path: string[];
}

type Loader<T> = (name: string) => Promise<T>;

function defaultLoader<T>(name: string): Promise<T> {
   return import(name);
}

/**
 * Loads module as a library.
 * @param name Module name like 'Library/Name:Path.To.Module' or just 'Module/Name'
 * @param [loader] Modules loader (current RequireJS instance by default)
 * @return Loaded module
 * @public
 */
export function load<T>(name: string, loader?: Loader<T>): Promise<T> {
   if (!name) {
      return Promise.reject(new Error('Module name must be specified'));
   }

   const actualLoader: Loader<T> = loader || defaultLoader;
   const info = parse(name);

   return actualLoader(info.name).then((implementation) => {
      const module = extract<T>(implementation, info);
      if (module instanceof Error) {
         throw module;
      }
      return module;
   });
}

/**
 * Extracts module from the library.
 * @param exports Library implementation
 * @param info Library info
 * @return Module implementation
 * @public
 */
export function extract<T>(exports: T | ILibrary<T>, info: IParsed): T | ReferenceError {
   let module = exports;

   if (info.path.length) {
      // Extract module by the path
      const processed = [];
      for (let i = 0; i < info.path.length; i++) {
         const property = info.path[i];
         processed.push(property);
         if (module && typeof module === 'object' && property in module) {
            module = module[property];
         } else {
            return new ReferenceError(
               `Cannot find module "${processed.join('.')}" in library "${info.name}".`
            );
         }
      }
   } else {
      // The library is module itself. But mind the default export for ES6 modules.
      if (module && (module as ILibrary<T>).__esModule && (module as ILibrary<T>).default) {
         module = (module as ILibrary<T>).default;
      }
   }

   return module as T;
}

/**
 * Parses module declaration include library name name and path.
 * @param name Module name like 'Library/Name:Path.To.Module' or just 'Module/Name'
 * @public
 */
export function parse(name: string): IParsed {
   const parts = String(name || '').split(':', 2);
   return {
      name: parts[0],
      path: parts[1] ? parts[1].split('.') : []
   };
}
