import { assert } from 'chai';
// import 'mocha';
import LinkPS from 'UI/theme/_controller/css/LinkPS';
import { THEME_TYPE } from 'UI/theme/controller';
import { getHtmlMarkup } from 'UI/theme/_controller/css/Base';
const href = '#Some/href';
const name = 'Some/Control';
const theme = 'Some-theme';


let link: LinkPS;

describe('UI/theme/_controller/css/LinkPS', () => {

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

   describe('outerHtml', () => {
      setHooks();
      it('outerHtml непустая строка', () => {
         assert.isString(link.outerHtml);
      });

      it('outerHtml возвращает html разметку', () => {
         const html = getHtmlMarkup(href, name, theme, THEME_TYPE.MULTI);
         assert.strictEqual(link.outerHtml, html);
      });
      [href, name, theme, THEME_TYPE.MULTI].forEach((attr) => {
         it('Разметка содержит ' + attr, () => { assert.include(link.outerHtml, attr, 'Разметка не содержит ' + attr); });
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
