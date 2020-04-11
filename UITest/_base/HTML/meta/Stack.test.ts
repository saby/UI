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
         assert.instanceOf(new Stack(), Stack);
      });
   });

   describe('push', () => {
      it('returns State instance', () => {
         assert.instanceOf(new Stack().push(meta), State);
      });
   });

   describe('lastState', () => {
      it('returns last state', () => {
         const stack = new Stack();
         stack.push(meta);
         stack.push(meta);
         const lastState = stack.push(meta);
         assert.isTrue(stack.lastState.equal(lastState));
      });

      it('returns last state after removing', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(firstState));
         assert.isUndefined(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('throw Error if remove last state', () => {
         const stack = new Stack();
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
         const stack = new Stack();
         stack.push(meta);
         const prevState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(prevState));
      });

      it('removes middle state', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('removes middle states', () => {
         const stack = new Stack();
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
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(firstState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), middleState.getId());
      });

   });

   describe('serialize', () => {
      it('Restore states after serialization', () => {
         const stack = new Stack();
         const state1 = stack.push(meta);
         const state2 = stack.push(meta);
         const state3 = stack.push(meta);
         const stackRestored = Stack.deserialize(stack.serialize());

         assert.isTrue(stackRestored.lastState.equal(state3));
         stackRestored.remove(state2);
         assert.isTrue(stackRestored.lastState.equal(state3));
         stackRestored.remove(state3);
         assert.isTrue(stackRestored.lastState.equal(state1));
      });
   });
});
