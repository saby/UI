/// <amd-module name="UICore/_utils/Function/Merge" />

interface IConfig {
   clone?: boolean; // Клонировать элементы
   create?: boolean; // Создавать элементы, отсутствующие в исходном объекте
   preferSource?: boolean; // Cохранять исходное значение
   rec?: boolean; // Рекурсивное объединение
   noOverrideByNull?: boolean; // Запретить заменять исходные значения на null
   noOverrideByUndefined?: boolean; // Запретить заменять исходные значения на undefined
   ignoreRegExp?: RegExp; // Регулярное вырежения для игнорирования части свойств
}

const defaultConfig: IConfig = {
   preferSource: false,
   rec: true,
   clone: false,
   create: true,
   noOverrideByNull: false,
   noOverrideByUndefined: false
};

interface IPath {
   keys: string[];
   objects: object[];
}

function isMergeableObject(o: object): boolean {
   return o && ((o.constructor === Object && !('$constructor' in o)) || o.constructor === Array);
}

function canBeRepalcedWith(value: any, config: IConfig): boolean {
   switch (value) {
      case null:
         return !config.noOverrideByNull;
      case undefined:
         return !config.noOverrideByUndefined;
      default:
         return true;
   }
}

function cloneOrCopy(hash: object, hashExtender: object, key: string, config: IConfig, path: IPath): void {
   if (config.ignoreRegExp && config.ignoreRegExp.test(key)) {
      return;
   }
   if ((typeof (hashExtender[key]) === 'object' && hashExtender[key] !== null) && config.clone) {
      /**
       * Если к нам пришел объект и можно клонировать
       * Запускаем мерж того, что пришло с пустым объектом (клонируем ссылочные типы).
       */
      if (isMergeableObject(hashExtender[key])) {
         hash[key] = mergeInner(hashExtender[key] instanceof Array ? [] : {}, hashExtender[key], config, key, path);
      } else {
         hash[key] = hashExtender[key];
      }
   } else {
      /**
       * Иначе (т.е. это
       *  ... не объект (простой тип) или
       *  ... запрещено клонирование)
       */
      if (canBeRepalcedWith(hashExtender[key], config)) {
         hash[key] = hashExtender[key];
      }
   }
}

/**
 * Объединяет два объекта в один.
 *
 * <h2>Параметры функции</h2>
 * <ul>
 *     <li><b>hash</b> {Object} Исходный хэш.</li>
 *     <li><b>hashExtender</b> {Object} Хэш-расширение.</li>
 *     <li><b>config</b> {Object} Параметры.
 *        <ul>
 *           <li><b>preferSource</b> {Boolean=false} Сохранять или нет исходное значение.</li>
 *           <li><b>rec</b> {Boolean=true} Рекурсивное объединение.</li>
 *           <li><b>clone</b> {Boolean=false} Клонировать элементы или передавать по ссылке.</li>
 *           <li><b>create</b> {Boolean=true} Создавать элементы, отсутствующие в исходном объекте.</li>
 *           <li><b>noOverrideByNull</b> {Boolean=false} Запретить заменять исходные значения на null.</li>
 *           <li><b>noOverrideByUndefined</b> {Boolean=false} Запретить заменять исходные значения на undefined.</li>
 *           <li><b>ignoreRegExp</b> {String=''} Регулярное вырежения для игнорирования части свойств.</li>
 *        </ul>
 *     </li>
 * </ul>
 * <h2>Возвращает</h2>
 * {Object} Результат объединения (ссылку на hash).
 *
 * <h2>Пример использования</h2>
 * <pre>
 *    require(['UICommon/Utils'], function(Utils) {
 *       var merge = Utils.FunctionUtils.merge;
 *       var original = {one: 1, two: 2};
 *       var extender = {two: 'dos', three: 'tres'};
 *       var allTogether = merge(original, extender);
 *       console.log(allTogether.one);//1
 *       console.log(allTogether.two);//'dos'
 *       console.log(allTogether.three);//'tres'
 *       //Исходный объект также модифицируется!
 *       console.log(original.two);//'dos'
 *    });
 * </pre>
 * @class UICore/_utils/Function/Merge
 * @public
 * @author Мальцев А.А.
 */
function merge(hash: any, hashExtender: any, config?: IConfig): any {
   const fullConfig: IConfig = {...defaultConfig, ...config || {}};
   return mergeInner(hash, hashExtender, fullConfig, null, {keys: [], objects: []});
}

function mergeInner(hash: any, hashExtender: any, config: IConfig, currentKey: string, path: IPath): any {
   if (hashExtender instanceof Date) {
      if (config.clone) {
         return new Date(hashExtender);
      }
      return hashExtender;
   }

   if (hash !== null && typeof (hash) === 'object' && hashExtender !== null && typeof (hashExtender) === 'object') {
      path.keys.push(currentKey === null ? '.' : currentKey);
      if (path.objects.indexOf(hashExtender) > -1) {
         throw new Error(`Recursive traversal detected for path "${path.keys.join(' -> ')}" with ${hashExtender}`);
      }
      path.objects.push(hashExtender);

      for (const i in hashExtender) {
         if (!hashExtender.hasOwnProperty(i)) {
            continue;
         }

         if (config.ignoreRegExp && config.ignoreRegExp.test(i)) {
            continue;
         }

         if (hash[i] === undefined) {
            // Если индекса в исходном хэше нет и можно создавать
            if (config.create) {
               if (hashExtender[i] === null) {
                  hash[i] = null;
               } else {
                  cloneOrCopy(hash, hashExtender, i, config, path);
               }
            }
         } else if (!config.preferSource) {
            // Индекс есть, исходное значение можно перебивать
            if (hash[i] && typeof hash[i] === 'object' && typeof hashExtender[i] === 'object') {
               // Объект в объект
               if (hash[i] instanceof Date) {
                  if (hashExtender[i] instanceof Date) {
                     if (config.clone) {
                        hash[i] = new Date(+hashExtender[i]);
                     } else {
                        hash[i] = hashExtender[i];
                     }
                     continue;
                  } else {
                     // Исходный - дата, расщирение - нет. Сделаем пустышку в которую потом замержим новые данные
                     hash[i] = hashExtender[i] instanceof Array ? [] : {};
                  }
               } else if (hashExtender[i] instanceof Date) {
                  if (config.clone) {
                     hash[i] = new Date(+hashExtender[i]);
                  } else {
                     hash[i] = hashExtender[i];
                  }
                  continue;
               }

               if (config.rec &&
                  (isMergeableObject(hashExtender[i]) || hashExtender[i] === null) &&
                  Object.keys(hash[i]).length > 0
               ) {
                  hash[i] = mergeInner(hash[i], hashExtender[i], config, i, path);
               } else {
                  hash[i] = hashExtender[i];
               }
            } else { // Перебиваем что-то в что-то другое...
               cloneOrCopy(hash, hashExtender, i, config, path);
            }
         } else if (typeof hash[i] === 'object' && typeof hashExtender[i] === 'object' && config.rec) {
            /**
             * Исходное значение и замена - объекты.
             * Исходное значение имеет приоритет, но разрешена рекурсия, поэтому объединяем
             */
            if (isMergeableObject(hashExtender[i]) || hashExtender[i] === null) {
               hash[i] = mergeInner(hash[i], hashExtender[i], config, i, path);
            }
         }
      }

      path.keys.pop();
      path.objects.pop();
   } else if (canBeRepalcedWith(hashExtender, config) && !config.preferSource) {
      hash = hashExtender;
   }

   return hash;
}

export default merge;
