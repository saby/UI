import { assert } from 'chai';
import 'mocha';
import {Base} from 'UI/theme/_controller/css/Base';
import { THEME_TYPE } from 'UI/theme/controller';

const name = 'Some/Control';
const theme = 'Some-theme';
const themeType = THEME_TYPE.MULTI;


let base: Base;

describe('UI/theme/_controller/css/Link', () => {

   beforeEach(() => {
      base = new Base(name, theme, themeType);
   });

   describe('require / remove', () => {

      it('при удалении экземпляр Base также удаляется элемент из DOM', async () => {
         const isRemoved = await base.remove();
         assert.isTrue(isRemoved);
      });

      it('css, необходимая другим контролам, не удаляется', async () => {
         base.require();
         const isRemoved = await base.remove();
         assert.isFalse(isRemoved);
      });
   });
});
