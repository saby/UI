import { replaceCssURL } from "UI/theme/_controller/Loader";
import { assert } from 'chai';

describe('UI/theme/_controller/css/Loader', () => {
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
});

