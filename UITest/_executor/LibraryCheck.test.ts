import { assert } from 'chai';
import { isLibraryModuleString } from 'UICommon/_executor/_Utils/Common';


describe('isLibraryModuleString', () => {
   describe('Dot syntax', () => {
      describe('Is Library', () => {
         it('Base path', () => {
            let moduleName: string = 'Storage.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path.Storage.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path.SubPath.Storage.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Root.Path.SubPath.Storage.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with submodule', () => {
            let moduleName: string = 'Storage.Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path.Storage.Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path.SubPath.Storage.Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Root.Path.SubPath.Storage.Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with numeric', () => {
            let moduleName: string = 'Storage0.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library0:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage0.Library0:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with underline', () => {
            let moduleName: string = 'Storage_One.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage._Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library:_Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage_One.Library_One:__Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with hyphen', () => {
            let moduleName: string = 'Storage-One.Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library-One:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library:Module-One';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage-One.Library-One:Module-One';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

      });
      describe('Not Library', () => {
         it('Not module in path', () => {
            let moduleName: string = 'Path.Storage.Library';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Path.Storage.Library:3408';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
         it('More dots in path', () => {
            let moduleName: string = 'Storage..Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
         it('Path with space', () => {
            let moduleName: string = 'Storage .Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage. Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library :Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage.Library: Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Стенд unit-unit.tmpl.ru:3408 уже существует.';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Это Storage.Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
         it('DNS or IP', () => {
            let moduleName: string = 'unit-unit.tmpl.ru';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'unit-unit.tmpl.ru:3408';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = '192.168.0.1';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = '192.168.0.1:3408';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
      });
   });
   describe('Slash syntax', () => {
      describe('Is Library', () => {
         it('Base path', () => {
            let moduleName: string = 'Storage/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path/Storage/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path/SubPath/Storage/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Root/Path/SubPath/Storage/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with submodule', () => {
            let moduleName: string = 'Storage/Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path/Storage/Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Path/SubPath/Storage/Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Root/Path/SubPath/Storage/Library:Module.SubModule';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with numeric', () => {
            let moduleName: string = 'Storage0/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library0:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage0/Library0:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with underline', () => {
            let moduleName: string = 'Storage_One/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage/_Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library:_Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage_One/Library_One:__Module';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

         it('Path with hyphen', () => {
            let moduleName: string = 'Storage-One/Library:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library-One:Module';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library:Module-One';
            assert.isTrue(isLibraryModuleString(moduleName));
            moduleName = 'Storage-One/Library-One:Module-One';
            assert.isTrue(isLibraryModuleString(moduleName));
         });

      });
      describe('Not Library', () => {
         it('Not module in path', () => {
            let moduleName: string = 'Path/Storage/Library';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
         it('More slash in path', () => {
            let moduleName: string = 'Storage//Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
         it('Path with space', () => {
            let moduleName: string = 'Storage /Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage/ Library:Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library :Module';
            assert.isFalse(isLibraryModuleString(moduleName));
            moduleName = 'Storage/Library: Module';
            assert.isFalse(isLibraryModuleString(moduleName));
         });
      });
   });
});
