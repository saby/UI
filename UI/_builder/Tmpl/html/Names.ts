/// <amd-module name="UI/_builder/Tmpl/html/Names" />

/**
 * @author Крылов М.А.
 */

/**
 *
 * @param char {string}
 */
export function isValidNameCharacter(char: string): boolean {
   return /[$@а-яёa-z0-9:\-_\.]/gi.test(char);
}

/**
 *
 * @param name {string}
 */
export function isValidName(name: string): boolean {
   return /^[$@а-яёa-z0-9:\-_\.]+$/gi.test(name);
}
