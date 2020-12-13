import SingleLinkPS from 'UI/theme/_controller/css/SingleLinkPS';
import { assert } from 'chai';

const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';

let link: SingleLinkPS;

describe('UI/theme/_controller/css/SingleLinkPS', () => {

   const setHooks = () => {
      beforeEach(() => { link = new SingleLinkPS(href, name, theme); });
      afterEach(() => { link = null; });
   };

   describe('removeForce', () => {
      setHooks();
      it('при удалении экземпляр SingleLink также удаляется элемент из DOM', () => {
         return link.removeForce()
            .then(link.remove)
            .then((isRemoved) => { assert.isTrue(isRemoved); });
      });

      it('css, необходимая другим контролам, удаляется', () => {
         link.require();
         link.require();
         link.require();
         return link.removeForce()
            .then(link.remove)
            .then((isRemoved) => {
               assert.isFalse(link.isMounted);
               assert.isTrue(isRemoved);
            });
      });
   });
});
