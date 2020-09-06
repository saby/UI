import createJSDocProcessor from 'UI/_builder/Tmpl/i18n/JSDoc';
import { assert } from 'chai';

// TODO: UI/_builder/Tmpl/* -> Compiler/*

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
               'standardObject': {
                  'itemType': 'Items.typedef',
                  'type': 'object'
               },
               'fullyTranslatable': {
                  'type': 'object',
                  'translatable': true
               },
               'myCaption': {
                  'type': 'string',
                  'translatable': true
               },
               'inlineOption': {
                  'translatable': true
               },
               'standardObject2': {
                  'itemType': 'StandardObject.Typedef',
                  'type': 'object'
               },
               'fullyTranslatableObject': {
                  'type': 'object',
                  'translatable': true
               },
               'hiddenObject': {
                  'itemType': 'HiddenObject.Typedef',
                  'type': 'object'
               }
            }
         }
      }
   },
   'StandardObject.Typedef': {
      'properties': {
         'ws-config': {
            'options': {
               'translatableString': {
                  'translatable': true
               }
            }
         }
      }
   },
   'HiddenObject.Typedef': {
      'properties': {
         'ws-config': {
            'options': {
               'translateMe': {
                  'translatable': true
               }
            }
         }
      }
   },
   'Items.typedef': {
      'properties': {
         'ws-config': {
            'options': {
               'translatableArrayField': {
                  'arrayElementType': 'String',
                  'type': 'array',
                  'translatable': true
               },
               'untranslatableArray': {
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
      it('todo', () => {
         // @ts-ignore TODO: !!!
         const description = JS_DOC_PROCESSOR.getComponentDescription('UIModule/Component');
      });
   });
});
