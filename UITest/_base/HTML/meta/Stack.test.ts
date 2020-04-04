import { State, IMeta, deserializeState } from 'UI/_base/HTML/meta';
import { assert } from 'chai';
import 'mocha';
import Stack, { deserializeStack } from 'UI/_base/HTML/_meta/Stack';

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

   describe('last', () => {
      it('returns last state', () => {
         const stack = new Stack();
         stack.push(meta);
         stack.push(meta);
         const lastState = stack.push(meta);
         assert.isTrue(stack.last().equal(lastState));
      });

      it('returns last state after removing', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         assert.isTrue(stack.last().equal(firstState));
         assert.isUndefined(stack.last().getPrevStateId(), firstState.getId());
      });

      it('returns null if no state exist', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         stack.remove(lastState);
         stack.remove(firstState);
         assert.isNull(stack.last());
      });
   });

   describe('remove', () => {
      it('removes last state', () => {
         const stack = new Stack();
         stack.push(meta);
         const prevState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(lastState);
         assert.isTrue(stack.last().equal(prevState));
      });

      it('removes middle state', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState);
         assert.isTrue(stack.last().equal(lastState));
         assert.equal(stack.last().getPrevStateId(), firstState.getId());
         assert.equal(stack.last().getId(), firstState.getNextStateId());
      });

      it('removes middle states', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState1 = stack.push(meta);
         const middleState2 = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(middleState1);
         stack.remove(middleState2);
         assert.isTrue(stack.last().equal(lastState));
         assert.equal(stack.last().getPrevStateId(), firstState.getId());
         assert.equal(stack.last().getId(), firstState.getNextStateId());
      });

      it('removes first state', () => {
         const stack = new Stack();
         const firstState = stack.push(meta);
         const middleState = stack.push(meta);
         const lastState = stack.push(meta);
         stack.remove(firstState);
         assert.isTrue(stack.last().equal(lastState));
         assert.equal(stack.last().getPrevStateId(), middleState.getId());
         assert.equal(stack.last().getId(), middleState.getNextStateId());
      });

   });

   describe('serialize', () => {
      it('Restore states after serialization', () => {
         const stack = new Stack();
         const state1 = stack.push(meta);
         const state2 = stack.push(meta);
         const state3 = stack.push(meta);
         const stackRestored = deserializeStack(stack.serialize());

         assert.isTrue(stackRestored.last().equal(state3));
         stackRestored.remove(state2);
         assert.isTrue(stackRestored.last().equal(state3));
         stackRestored.remove(state3);
         assert.isTrue(stackRestored.last().equal(state1));
      });
   });
});
