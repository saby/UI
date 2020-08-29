/// <amd-module name="View/Builder/Tmpl/core/KeysGenerator" />

/**
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/core/KeysGenerator.ts
 */

// tslint:disable:no-empty

/**
 * Interface for key generator.
 */
export interface IKeysGenerator {

   /**
    * Call this method before visiting children nodes.
    */
   openChildren(): void;

   /**
    * Call this method after visiting children nodes.
    */
   closeChildren(): void;

   /**
    * Generate unique key for a concrete node.
    */
   generate(): string;
}

/**
 * Key separator for hierarchical keys generator.
 */
const KEY_SEPARATOR = '_';

/**
 * Hierarchical keys generator.
 */
class HierarchicalKeysGenerator implements IKeysGenerator {

   /**
    * Stack of all "opened" nodes.
    */
   private readonly keys: number[];

   /**
    * Initialize new instance of hierarchical keys generator.
    */
   constructor() {
      this.keys = [];
   }

   /**
    * Call this method before visiting children nodes.
    */
   openChildren(): void {
      this.keys.push(0);
   }

   /**
    * Call this method after visiting children nodes.
    */
   closeChildren(): void {
      this.keys.pop();
   }

   /**
    * Generate unique key for a concrete node.
    */
   generate(): string {
      const key = this.keys.join(KEY_SEPARATOR) + KEY_SEPARATOR;
      this.increment();
      return key;
   }

   /**
    * Increment top node key.
    * @private
    */
   private increment(): void {
      const index = this.keys.length - 1;
      const lastValue = this.keys[index];
      this.keys[index] = lastValue + 1;
   }
}

/**
 * Flat keys generator.
 */
class FlatKeysGenerator implements IKeysGenerator {

   /**
    * Nodes counter.
    */
   private key: number;

   /**
    * Initialize new instance of flat keys generator.
    */
   constructor() {
      this.key = 0;
   }

   /**
    * Call this method before visiting children nodes.
    */
   openChildren(): void { }

   /**
    * Call this method after visiting children nodes.
    */
   closeChildren(): void { }

   /**
    * Generate unique key for a concrete node.
    */
   generate(): string {
      return (this.key++).toString() + KEY_SEPARATOR;
   }
}

/**
 * Create keys generator.
 * @param hierarchical {boolean} Use hierarchical keys generator or not.
 * @returns {IKeysGenerator} Returns new instance of concrete keys generator that implements ITextProcessor interface.
 */
export function createKeysGenerator(hierarchical: boolean): IKeysGenerator {
   if (hierarchical) {
      return new HierarchicalKeysGenerator();
   }
   return new FlatKeysGenerator();
}
