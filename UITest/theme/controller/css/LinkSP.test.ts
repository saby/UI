import { assert } from 'chai';
import LinkSP from 'UI/theme/_controller/css/LinkSP';
import { THEME_TYPE } from 'UI/theme/controller';
import { ILoader } from 'UI/theme/_controller/css/Base';

const href = 'Some/href';
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

   beforeEach(() => {
      link = new LinkSP(href, name, theme, themeType);
      loader = new LoaderMock();
   });

   describe('load', () => {
      it('load returns Promise<void>', () => {
         assert.instanceOf(link.load(loader), Promise);
      });
   });

   describe('outerHtml', () => {
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
      });
   });

   describe('require / remove', () => {
      it('невостребованный экземпляр LinkSP удаляется', async () => {
         const isRemoved = await link.remove();
         assert.isTrue(isRemoved);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         link.require();
         const isRemoved = await link.remove();
         assert.isFalse(isRemoved);
      });
   });
});
