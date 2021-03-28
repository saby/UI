/// <amd-module name="UICore/_utils/Number/RandomId" />
/**
 * @author Мальцев А.А.
 */
export default function randomId(prefix?: string): string {
   return (prefix || 'ws-') + Math.random().toString(36).substr(2) + (+new Date());
};
