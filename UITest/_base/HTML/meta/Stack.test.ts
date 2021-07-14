import { assert } from 'chai';
import { IMeta } from 'UI/_base/meta';
import Stack from 'UI/_base/_meta/Stack';
import State from 'UI/_base/_meta/State';
import { createStatesStore } from 'UI/_base/_meta/Store';
import { IMetaStateInternal } from 'UI/_base/_meta/interface';
const meta: IMeta = {
   title: 'Page title',
   og: {
      title: 'OG title',
      description: 'OG description'
   }
};

describe('UI/_base/_meta/Stack', () => {

   describe('constructor', () => {
      it('creates Stack instance', () => {
         assert.instanceOf(new Stack(createStatesStore()), Stack);
      });
   });

   describe('push', () => {
      it('returns State instance', () => {
         assert.instanceOf(new Stack(createStatesStore()).push(meta), State);
      });
   });

   describe('lastState', () => {
      it('returns last state', () => {
         const stack = new Stack(createStatesStore());
         stack.push(meta);
         stack.push(meta);
         const lastState = stack.push(meta);
         assert.isTrue(stack.lastState.equal(lastState));
      });

      it('link states after middle state removing', () => {
         const stack = new Stack(createStatesStore());
         const firstState = stack.push(meta) as IMetaStateInternal;
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.strictEqual(stack.lastState.getPrevStateId(), firstState.getId());
         assert.strictEqual(firstState.getNextStateId(), lastState.getId());
      });

      it('returns last state after removing', () => {
         const stack = new Stack(createStatesStore());
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(firstState));
      });

      it('throw Error if remove last state', () => {
         const stack = new Stack(createStatesStore());
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
         const stack = new Stack(createStatesStore());
         stack.push(meta);
         const prevState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(lastState);
         assert.isTrue(stack.lastState.equal(prevState));
      });

      it('removes middle state', () => {
         const stack = new Stack(createStatesStore());
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), firstState.getId());
      });

      it('removes middle states', () => {
         const stack = new Stack(createStatesStore());
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
         const stack = new Stack(createStatesStore());
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(firstState);
         assert.isTrue(stack.lastState.equal(lastState));
         assert.equal(stack.lastState.getPrevStateId(), middleState.getId());
      });

      it('removing null doesnt crash ', () => {
         const stack = new Stack(createStatesStore());
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
         const stack = new Stack(createStatesStore());
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
