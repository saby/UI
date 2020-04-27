// import { assert } from 'chai';
// import 'mocha';
import { IMeta } from 'UI/_base/HTML/meta';
import Stack from 'UI/_base/HTML/_meta/Stack';
import State from 'UI/_base/HTML/_meta/State';
const meta: IMeta = {
   title: 'Page title',
   og: {
      title: 'OG title',
      description: 'OG description'
   }
};

describe('UI/_base/HTML/_meta/Stack', () => {

   describe('constructor', () => {
      it('creates Stack instance', () => {
         assert.instanceOf(Stack.newInstance(), Stack);
      });
   });

   describe('push', () => {
      it('returns State instance', () => {
         assert.instanceOf(Stack.newInstance().push(meta), State);
      });
   });

   describe('lastState', () => {
      it('returns last state', () => {
         const stack = Stack.newInstance();
         stack.push(meta);
         stack.push(meta);
         const lastState = stack.push(meta);
         assert.isTrue(stack.lastState.equal(lastState));
      });

      it('returns last state after removing', () => {
         const stack = Stack.newInstance();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(firstState));
         assert.isUndefined(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('throw Error if remove last state', () => {
         const stack = Stack.newInstance();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         try {
            stack.remove(firstState);
            assert.fail('doesnt throw Error!');
         } catch {
            assert.isTrue(stack.lastState.equal(firstState));
         }
      });
   });

   describe('remove', () => {
      it('removes last state', () => {
         const stack = Stack.newInstance();
         stack.push(meta);
         const prevState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(prevState));
      });

      it('removes middle state', () => {
         const stack = Stack.newInstance();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('removes middle states', () => {
         const stack = Stack.newInstance();
         const firstState = stack.push(meta);
         const middleState1 = stack.push(meta);
         const middleState2 = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState1);
         stack.remove(middleState2);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('removes first state', () => {
         const stack = Stack.newInstance();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(firstState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), middleState.getId());
      });

      it('removing null doesnt crash ', () => {
         const stack = Stack.newInstance();
         try {
            stack.remove(null);
            const lastState = stack.push(meta);
            stack.remove(null);
            assert.isTrue(stack.lastState.equal(lastState));
         } catch (e) {
            assert.fail('removing null is crashing Stack', e.message);
         }
      });

   });

   describe('serialize', () => {
      it('Restore states after serialization', () => {
         const stack = Stack.newInstance();
         const state1 = stack.push(meta);
         const state2 = stack.push(meta);
         const state3 = stack.push(meta);
         const stackRestored = Stack.restore(stack.serialize());

         assert.isTrue(stackRestored.lastState.equal(state3));
         stackRestored.remove(state2);
         assert.isTrue(stackRestored.lastState.equal(state3));
         stackRestored.remove(state3);
         assert.isTrue(stackRestored.lastState.equal(state1));
      });
   });
});
