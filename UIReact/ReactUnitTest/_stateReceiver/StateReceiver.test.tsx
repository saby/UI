import { assert } from 'chai';
import { createSandbox } from 'sinon';
import { render } from 'react-dom';
import { act } from 'react-dom/test-utils';
// FIXME: типы для jsdom нигде не подцеплены, подцепим после переезда на jest
// tslint:disable-next-line:ban-ts-ignore
// @ts-ignore
import { JSDOM } from 'jsdom';
import { default as Parent } from 'ReactUnitTest/_stateReceiver/Controls/Parent';

describe('UICore/Base:Control ReceivedState', () => {
   let clock;
   let sandbox;
   let container: HTMLDivElement;

   before(() => {
      const browser = new JSDOM();
      global.window = browser.window;
      global.document = window.document;
   });

   after(() => {
      delete global.window;
      delete global.document;
   });

   beforeEach(() => {
      sandbox = createSandbox();
      /*
      _afterMount и _afterUpdate зовутся в отдельной таске, чтобы браузер мог отрисовать кадр.
      Чтобы не делать тесты асинхронными, мы просто мокнем таймеры и сами будем управлять временем.
       */
      clock = sandbox.useFakeTimers();

      container = document.createElement('div');
      document.body.appendChild(container);
   });

   afterEach(() => {
      clock.restore();
      sandbox.restore();

      container.remove();
   });

   it('Потомкам проставляется ключ для StateReceiver', () => {
      let instance;
      act(() => {
         instance = render(
            <Parent/>,
            container
         );
      });

      /** Искомый потомок второй по счету а поддереве. Поэтому 0 (корень) _ 1 (второй потомок) */
      assert.equal(instance.getChildrenKey(), '_0_1_');
   });
});
