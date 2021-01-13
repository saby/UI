import { EventNode } from './EventNode';

/**
 * Класс цепочки обработчиков. Содержит коллекцию узлов EventNode для конкретного события.
 *
 * ВАЖНО: в начале идут bind-обработчики, а затем - события.
 */
export class EventChain extends Array<EventNode> {
   /**
    * Флаг, по которому различается EventChain от обычного массива.
    * @todo Избыточный флаг. Отрефакторить код и избавиться от него.
    */
   readonly events: boolean = true;

   /**
    * Подготовить цепочку обработчиков: создать массив или вернуть имеющийся.
    * @param originChain {EventChain} Исходная цепочка обработчиков для конкретного события либо undefined.
    */
   static prepareEventChain: (originChain?: EventChain) => EventChain;
}

EventChain.prepareEventChain = function prepareEventChain(originChain?: EventChain): EventChain {
   if (!originChain) {
      return new EventChain();
   }
   return originChain;
};
