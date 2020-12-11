import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/QuickClickTabs');

interface ITabsBlockOptions {
   asyncTab?: string;
}

class QuickClickTabs extends Control {
   _template: TemplateFunction = template;

   private _tabCount: number = 4;
   private _tabTemplates: string[] = [
       'UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab0',
       'UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab1',
       'UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab2',
       'UIDemo/AsyncDemo/_tabsDemo/QuickClickTabs/Tab3'
   ];
   protected _asyncTabId: number = 0;
   protected _asyncTabTemplate: string;

   _beforeMount(cfg: ITabsBlockOptions): void {
      this._setAsyncTab(Number.parseInt(cfg.asyncTab, 10));
   }

   _beforeUpdate(cfg: ITabsBlockOptions): void {
      this._setAsyncTab(Number.parseInt(cfg.asyncTab, 10));
   }

   private _setAsyncTab(asyncTab: number): void {
      if (asyncTab >= 0 && asyncTab < this._tabCount) {
         this._asyncTabId = asyncTab;
      } else {
         this._asyncTabId = 0;
      }
      this._asyncTabTemplate = this._tabTemplates[this._asyncTabId];
   }

   static _styles: string[] = ['UIDemo/AsyncDemo/_tabsDemo/TabsDemo'];
}

export = QuickClickTabs;
