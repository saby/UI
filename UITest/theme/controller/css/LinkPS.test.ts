// import { assert } from 'chai';
// import 'mocha';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import { ILoader } from 'UI/theme/_controller/css/interface';
const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';

class LoaderMock implements ILoader {
   load(_: string): Promise<void> {
      return Promise.resolve(void 0);
   }
}

let link: LinkPS;
let loader: LoaderMock;

describe('UI/theme/_controller/css/LinkPS', () => {

   const setHooks = () => {
      beforeEach(() => {
         link = new LinkPS(href, name, theme);
         loader = new LoaderMock();
      });
      afterEach(() => {
         link = null;
         loader = null;
      });
   };
   describe('load', () => {
      setHooks();
      it('load returns Promise<void>', () => {
         assert.instanceOf(link.load(loader), Promise);
      });

      it('isMounted true after load', () => {
         return link.load(loader)
            .then(() => { assert.isTrue(link.isMounted); })
            .then(() => link.remove());
      });
   });

   describe('outerHtml', () => {
      setHooks();
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
      });
   });

   describe('require / remove', () => {
      setHooks();
      it('невостребованный экземпляр LinkPS удаляется', () => {
         return link.remove().then((isRemoved) => {
            assert.isFalse(link.isMounted);
            assert.isTrue(isRemoved);
         });
      });

      it('css, необходимая другим контролам, не удаляется', () => {
         link.require();
         return link.remove().then((isRemoved) => {
            assert.isFalse(isRemoved);
         });
      });
   });
});
