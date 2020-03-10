import SingleLinkPS from 'UI/theme/_controller/css/SingleLinkPS';
import { ILoader } from 'UI/theme/_controller/css/interface';
// import { assert } from 'chai';
// import 'mocha';

const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';

class LoaderMock implements ILoader {
   load(_: string): Promise<void> {
      return Promise.resolve(void 0);
   }
}

let link: SingleLinkPS;
let loader: LoaderMock;

describe('UI/theme/_controller/css/SingleLinkPS', () => {

   const setHooks = () => {
      beforeEach(() => {
         link = new SingleLinkPS(href, name, theme);
         loader = new LoaderMock();
      });
      afterEach(() => {
         link = null;
         loader = null;
      });
   };

   describe('removeForce', () => {
      setHooks();
      it('при удалении экземпляр SingleLink также удаляется элемент из DOM', () => {
         return link.removeForce().then(() => {
            assert.isTrue(link['requirement'] === 0);
         });
      });

      it('css, необходимая другим контролам, удаляется', () => {
         link.require();
         link.require();
         link.require();
         return link.removeForce().then(() => {
            assert.isTrue(link['requirement'] === 0);
         });
      });
   });
});
