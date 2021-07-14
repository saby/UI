import { assert } from 'chai';
import { IMeta } from 'UI/_base/meta';
import State from 'UI/_base/_meta/State';

describe('UI/_base/_meta/State', () => {
   const meta: IMeta = {
      title: 'Page title',
      og: {
         title: 'OG title',
         description: 'OG description'
      }
   };

   describe('constructor', () => {
      it('create instance', () => {
         assert.instanceOf(new State(meta), State);
      });

   });

   describe('outerHTML', () => {
      const og = {
         title: 'OG title',
         description: 'OG description',
         image: 'OG Image'
      };
      const markup = new State({ title: void 0, og }).outerHTML;
      Object.keys(og).forEach((tag) => {
         it(`State's markup includes ${tag}-tag`, () => {
            assert.include(markup, tag, `Markup doesn't include ${tag}-tag`);
            assert.include(markup, og[tag], `Markup doesn't include ${tag}-tag's value`);
         });
      });

      it('If meta.title is undefined, title will be empty string', () => {
         assert.notInclude(new State({ title: void 0 }).outerHTML, 'undefined');
      });
   });

   describe('equal', () => {
      it('instance equal self', () => {
         const state = new State(meta);
         assert.isTrue(state.equal(state));
      });

      it('Instances with same meta are not equal', () => {
         assert.isFalse(new State(meta).equal(new State(meta)));
      });
   });

   describe('serialize / deserialize', () => {
      it('serialize() returns string', () => {
         assert.isString(new State(meta).serialize());
      });

      it('deserialize() returns State', () => {
         const str = new State(meta).serialize();
         assert.instanceOf(State.deserialize(str), State);
      });

      it('instance is equal self after serailization', () => {
         const state = new State(meta);
         const state2 = State.deserialize(state.serialize());
         assert.isTrue(state.equal(state2));
      });

      it('Serialized instances with same meta are not equal', () => {
         assert.notStrictEqual(new State(meta).serialize(), new State(meta).serialize());
      });

      it('Instances with same meta are not equal after serailization', () => {
         const state = new State(meta);
         const state2 = State.deserialize(new State(meta).serialize());
         assert.isFalse(state.equal(state2));
      });
   });

   describe('getNextStateId / setNextState', () => {
      it('getNextStateId() returns state`s id set by setNextState', () => {
         const state = new State(meta);
         const state2 = new State(meta);
         state.setNextState(state2);
         assert.equal(state.getNextStateId(), state2.getId());
      });
      it('getNextStateId() returns undefined set by setNextState(null)', () => {
         const state = new State(meta);
         state.setNextState(null);
         assert.isUndefined(state.getNextStateId());
      });
      it('getNextStateId() returns state`s id set by setNextState after serialization', () => {
         const state = new State(meta);
         const state2 = new State(meta);
         state.setNextState(state2);
         const stateRestored = State.deserialize(state.serialize());
         const state2Restored = State.deserialize(state2.serialize());
         assert.equal(stateRestored.getNextStateId(), state2Restored.getId());
      });
   });

   describe('getPrevStateId / setPrevState', () => {
      it('getPrevStateId() returns state`s id set by setPrevState', () => {
         const state = new State(meta);
         const state2 = new State(meta);
         state.setPrevState(state2);
         assert.equal(state.getPrevStateId(), state2.getId());
      });
      it('getPrevStateId() returns undefined set by setPrevState(null)', () => {
         const state = new State(meta);
         state.setPrevState(null);
         assert.isUndefined(state.getPrevStateId());
      });
      it('getPrevStateId() returns state`s id set by setPrevState after serialization', () => {
         const state = new State(meta);
         const state2 = new State(meta);
         state.setPrevState(state2);
         assert.equal(state.getPrevStateId(), state2.getId());
      });
   });
});
