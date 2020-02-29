import LinkSP from 'UI/theme/_controller/css/LinkSP';
import { THEME_TYPE } from 'UI/theme/controller';
import { ILoader } from 'UI/theme/_controller/css/Base';

const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;

class LoaderMock implements ILoader {
   load(_: string): Promise<void> {
      return Promise.resolve(void 0);
   }
}

let link: LinkSP;
let loader: LoaderMock;

describe('UI/theme/_controller/css/LinkSP', () => {

   const setHooks = () => {
      beforeEach(() => {
         link = new LinkSP(href, name, theme, themeType);
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
   });

   describe('outerHtml', () => {
      setHooks();
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
      });
   });

   describe('require / remove', () => {
      setHooks();
      it('невостребованный экземпляр LinkSP удаляется', () => {
         return link.remove().then((isRemoved) => {
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
