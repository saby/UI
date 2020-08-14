export interface IContext {
   scope: unknown;
   get(field: string): Record<string, unknown>;
   set(): void;
   has(): boolean;
}