/// <amd-module name="View/Builder/Tmpl/core/KeysGenerator" />

/**
 * @author Крылов М.А.
 */

// tslint:disable:no-empty

export interface IKeysGenerator {
   openChildren(): void;
   incrementChild(): void;
   closeChildren(): void;
   getKey(): string;
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

   incrementChild(): void {
      const index = this.keys.length - 1;
      const lastValue = this.keys[index];
      this.keys[index] = lastValue + 1;
   }

   closeChildren(): void {
      this.keys.pop();
   }

   getKey(): string {
      return this.keys.join(KEY_SEPARATOR) + KEY_SEPARATOR;
   }
}

class FlatKeysGenerator implements IKeysGenerator {
   private key: number;

   constructor() {
      this.key = 0;
   }

   openChildren(): void { }

   incrementChild(): void {
      ++this.key;
   }

   closeChildren(): void { }

   getKey(): string {
      return this.key.toString() + KEY_SEPARATOR;
   }
}

export function createKeysGenerator(hierarchical: boolean): IKeysGenerator {
   if (hierarchical) {
      return new HierarchicalKeysGenerator();
   }
   return new FlatKeysGenerator();
}
