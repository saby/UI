import { assert } from 'chai';
import LinkPS from 'UICommon/theme/_controller/css/LinkPS';
const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';


let link: LinkPS;

describe('UICommon/theme/_controller/css/LinkPS', () => {

   const setHooks = () => {
      beforeEach(() => { link = new LinkPS(href, name, theme); });
      afterEach(() => { link = null; });
   };
   describe('load', () => {
      setHooks();
      it('load returns Promise<void>', () => {
         assert.instanceOf(link.load(), Promise);
      });

      it('isMounted true after load', () => {
         return link.load()
            .then(() => { assert.isTrue(link.isMounted); })
            .then(() => link.remove());
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
