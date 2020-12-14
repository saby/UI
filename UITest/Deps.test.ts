import { assert } from 'chai';
import { addPageDeps } from 'UI/Deps';
import { headDataStore } from 'UI/Base';


describe('UI/Deps:addPageDeps', () => {
   if (typeof window === 'undefined') {
      it('add module', () => {
         const moduleName: string = 'Module/Name';
         addPageDeps([moduleName]);
         // @ts-ignore
         const initDeps = headDataStore.read('initDeps');
         assert.hasAnyKeys(initDeps, [moduleName], 'Модуль не был добавлен в зависимости страницы');
      });

      it('add library', () => {
         const moduleName: string = 'Library/Name:Module';
         const libName: string = 'Library/Name';
         addPageDeps([moduleName]);
         // @ts-ignore
         const initDeps = headDataStore.read('initDeps');
         assert.hasAnyKeys(initDeps, [libName], 'Библиотека не была добавлена в зависимости страницы');
      });
   }
});
