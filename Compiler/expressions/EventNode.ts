/**
 * @description Represents class for event node.
 * @author Крылов М.А.
 * @file Compiler/expressions/EventNode.ts
 */

interface IEventNodeCfg {
   args?: string,
   value: string,
   viewController: string,
   data?: string,
   handler: string,
   isControl: boolean,
   context?: string
}

/**
 * Данный класс представляет узел обработчика события.
 */
export class EventNode {
   /**
    * Аргументы, переданные функции-обработчику события.
    */
   args: string;
   /**
    * Имя функции-обработчика события.
    */
   value: string;

   viewController: string;
   data: string;
   handler: string;
   isControl: boolean;
   context: string;

   bindValue: string;

   /**
    * Инициализировать новый узел.
    * @param cfg {IEventNodeCfg}
    */
   constructor(cfg: IEventNodeCfg) {
      this.args = cfg.args;
      this.value = cfg.value;
      this.viewController = cfg.viewController;
      this.data = cfg.data;
      this.handler = cfg.handler;
      this.isControl = cfg.isControl;
      this.context = cfg.context;
   }
}
