/// <amd-module name="View/Builder/Tmpl/core/KeysGenerator" />

/**
 * @author Крылов М.А.
 */

// tslint:disable:no-empty

export interface IKeysGenerator {
   openChildren(): void;
   closeChildren(): void;
   generate(): string;
}

const KEY_SEPARATOR = '_';

class HierarchicalKeysGenerator implements IKeysGenerator {
   private keys: number[];

   constructor() {
      this.keys = [];
   }

   openChildren(): void {
      this.keys.push(0);
   }

   closeChildren(): void {
      this.keys.pop();
   }

   generate(): string {
      const key = this.keys.join(KEY_SEPARATOR) + KEY_SEPARATOR;
      this.increment();
      return key;
   }

   private increment(): void {
      const index = this.keys.length - 1;
      const lastValue = this.keys[index];
      this.keys[index] = lastValue + 1;
   }
}

class FlatKeysGenerator implements IKeysGenerator {
   private key: number;

   constructor() {
      this.key = 0;
   }

   openChildren(): void { }

   closeChildren(): void { }

   generate(): string {
      return (this.key++).toString() + KEY_SEPARATOR;
   }
}

export function createKeysGenerator(hierarchical: boolean): IKeysGenerator {
   if (hierarchical) {
      return new HierarchicalKeysGenerator();
   }
   return new FlatKeysGenerator();
}
