/// <amd-module name="UI/_builder/Tmpl/expressions/_private/EventNode" />

/**
 * @description Represents class for event node.
 * @author Крылов М.А.
 * @file UI/_builder/Tmpl/expressions/_private/EventNode.ts
 */

interface IEventNodeCfg {
   args?: string;
   value: string;
   viewController: string;
   data?: string;
   handler: string;
   isControl: boolean;
   toPartial: boolean;
   context?: string;
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
   toPartial: boolean;
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
      this.toPartial = cfg.toPartial;
      this.context = cfg.context;
   }
}
