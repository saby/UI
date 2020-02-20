import { assert } from 'chai';
// @ts-ignore
import { constants } from 'Env/Env';
import 'mocha';
import Link from 'UI/theme/_controller/css/Link';
import Style, { replaceCssURL } from 'UI/theme/_controller/css/Style';

const name = 'Some/Control';

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

describe('UI/theme/_controller/css/Style', () => {
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

   describe('from', () => {
      if (!constants.isBrowserPlatform) { return; }

      it('Style`s instance from css ', () => {
         const link = Style.from('css', name);
         assert.instanceOf(link, Link);
      });
   });

   describe('require / remove', () => {

      it('при удалении экземпляр Style также удаляется элемент из DOM', async () => {
         const element = new ElementMock();
         const style = new Style(name, null, null, element);
         const isRemoved = await style.remove();
         assert.isTrue(isRemoved);
         assert.isTrue(element.__removed);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         const element = new ElementMock();
         const style = new Style(name, null, null, element);
         style.require();
         const isRemoved = await style.remove();
         assert.isFalse(isRemoved);
         assert.isFalse(element.__removed);
      });
   });
});
