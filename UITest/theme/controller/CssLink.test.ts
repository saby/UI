import CssLink, { replaceCssURL } from 'UI/theme/_controller/CssLink';
import { DEFAULT_THEME, DEFAULT_THEME_TYPE, THEME_TYPE } from 'UI/theme/_controller/CssLinkSP';
import { assert } from 'chai';
import 'mocha';

class ElementMock {
   __removed = false;
   innerHTML = 'test css';
   getAttribute(attr) {
      return this[attr];
   }
   setAttribute(attr, val) {
      this[attr] = val;
   }
   remove() {
      this.__removed = true;
   }
}

describe('UI/theme/_controller/CssLink', () => {
   describe('replaceCssURL', () => {
      it('replaceCssURL не меняет пути cdn, data', () => {
         const tests = {
            'url(/cdn/themes/1.0.0/background.jpg)': 'url(/cdn/themes/1.0.0/background.jpg)',
            'url(/cdn/themes/1.0.0/background.jpg?#iefix)': 'url(/cdn/themes/1.0.0/background.jpg?#iefix)',
            'url("/cdn/themes/1.0.0/background.jpg?#iefix")': 'url("/cdn/themes/1.0.0/background.jpg?#iefix")',
            'url(data:image/png;base64,iVBORw0KGg=)': 'url(data:image/png;base64,iVBORw0KGg=)',
            'fill: url(#woodH)': 'fill: url(#woodH)'
         };
         for (const path in tests) {
            assert.equal(path, replaceCssURL(tests[path]));
         }
      });

      it('replaceCssURL разрешает относительные пути', () => {
         const tests = {
            'fill: url("/Controls/Input/Text/../../icons/im.png?#iefix")': ['fill: url("../../icons/im.png?#iefix")', '/Controls/Input/Text/Text.css'],
            'background: url("/EngineLanguage/Selector/images/flags.png");': ['background: url("images/flags.png");', '/EngineLanguage/Selector/Selector.css'],
            'fill: url("/Controls/Input/Text/../../icons/im.png")': ['fill: url("../../icons/im.png")', '/Controls/Input/Text/Text.css'],
         };
         for (const path in tests) {
            assert.equal(path, replaceCssURL.apply(null, tests[path]));
         }
      });
   });

   describe('constructor', () => {
      it('default property CssLink`s instance ', () => {
         const cssLink = new CssLink(new ElementMock());
         assert.equal(cssLink.theme, DEFAULT_THEME);
         assert.equal(cssLink.themeType, DEFAULT_THEME_TYPE);
      });

      it('экземпляр CssLink извлекает название темы и контрола из HTMLElement`a', () => {
         const name = 'Some/control';
         const theme = 'Some-theme';
         const themeType = THEME_TYPE.SINGLE;
         const element = new ElementMock();
         element.setAttribute('css-name', name);
         element.setAttribute('theme-name', theme);
         const cssLink = new CssLink(element, themeType);
         assert.equal(cssLink.name, name);
         assert.equal(cssLink.theme, theme);
         assert.equal(cssLink.themeType, themeType);
      });
   });

   describe('require / remove', () => {
      it('при удалении экземпляр CssLink также удаляется элемент из DOM', async () => {
         const element = new ElementMock();
         const cssLink = new CssLink(element);
         const isRemoved = await cssLink.remove();
         assert.isTrue(isRemoved);
         assert.isTrue(element.__removed);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         const element = new ElementMock();
         const cssLink = new CssLink(element);
         cssLink.require();
         const isRemoved = await cssLink.remove();
         assert.isFalse(isRemoved);
         assert.isFalse(element.__removed);
      });
   });
});
