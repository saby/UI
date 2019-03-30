export function isWasabyTag(name:string):boolean {
   return name.indexOf('ws:') === 0;
}

export function isAttr(name:string):boolean {
   return name.indexOf('attr:') === 0;
}
