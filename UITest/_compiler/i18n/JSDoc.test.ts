import createJSDocProcessor from 'Compiler/i18n/JSDoc';
import { assert } from 'chai';

const JSDoc = {
   'UIModule/Component': {
      'properties': {
         'ws-config': {
            'options': {
               'arrayOption': {
                  'type': 'Array'
               },
               'fullyTranslatableArrayOption': {
                  'type': 'Array',
                  'translatable': true
               },
               'translatableArrayOption': {
                  'type': 'Array',
                  'itemType': 'ArrayItems.typedef'
               },
               'booleanOption': {
                  'type': 'Boolean'
               },
               'functionOption': {
                  'type': 'function'
               },
               'objectOption': {
                  'type': 'Object'
               },
               'fullyTranslatableObjectOption': {
                  'type': 'Object',
                  'translatable': true
               },
               'numberOption': {
                  'type': 'Number'
               },
               'stringOption': {
                  'type': 'String'
               },
               'translatableStringOption': {
                  'type': 'String',
                  'translatable': true
               },
               'specialObjectOption': {
                  'itemType': 'SpecialObject.typedef',
                  'type': 'object'
               },
               'fullyTranslatableObject': {
                  'type': 'object',
                  'translatable': true
               }
            }
         }
      }
   },
   'ArrayItems.typedef': {
      'properties': {
         'ws-config': {
            'options': {
               'translatableOption': {
                  'translatable': true
               },
               'notTranslatableOption': {
                  'translatable': false
               }
            }
         }
      }
   },
   'SpecialObject.typedef': {
      'properties': {
         'ws-config': {
            'options': {
               'translatableProperty': {
                  'arrayElementType': 'String',
                  'type': 'array',
                  'translatable': true
               },
               'notTranslatableProperty': {
                  'arrayElementType': 'String',
                  'type': 'array',
                  'translatable': false
               }
            }
         }
      }
   }
};

const JS_DOC_PROCESSOR = createJSDocProcessor(JSDoc);

describe('Compiler/i18n/JSDoc', () => {
   it('Unknown component', () => {
      const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/UnknownComponent');
      assert.isFalse(description.isPropertyTranslatable('property'));
   });
   describe('Special components', () => {
      it('optional!UIModule/Component', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('optional!UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('translatableStringOption'));
      });
      it('js!UIModule/Component', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('js!UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('translatableStringOption'));
      });
      it('optional!js!UIModule/Component', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('optional!js!UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('translatableStringOption'));
      });
   });
   describe('Primitive types', () => {
      it('Boolean', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('booleanOption'));
      });
      it('function', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('functionOption'));
      });
      it('Number', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('numberOption'));
      });
      it('String (not translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('stringOption'));
      });
      it('String (translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('translatableStringOption'));
      });
   });
   describe('Complex types', () => {
      it('Array (not translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('arrayOption'));
      });
      it('Array (translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('fullyTranslatableArrayOption'));
      });
      it('Object (not translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('objectOption'));
      });
      it('Object (translatable)', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('fullyTranslatableObjectOption'));
      });
   });
   describe('Types with definition', () => {
      it('Translatable object property in array', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('translatableArrayOption/translatableOption'));
      });
      it('Not translatable object property in array', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('translatableArrayOption/notTranslatableOption'));
      });
      it('Translatable object property', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isTrue(description.isPropertyTranslatable('specialObjectOption/translatableProperty'));
      });
      it('Not translatable object property', () => {
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
         assert.isFalse(description.isPropertyTranslatable('specialObjectOption/notTranslatableProperty'));
      });
   });
});
