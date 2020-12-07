import { Control, TemplateFunction } from 'UI/Base';
import template = require('wml!UIDemo/AsyncDemo/_tabsDemo/NetworkRestoreTabs/NetworkRestoreTabs');

interface ITabsBlockOptions {
   selectedTab?: string;
}

class NetworkRestoreTabs extends Control {
   _template: TemplateFunction = template;

   private _tabCount: number = 3;
   protected _selectedTabId: number = 0;

   _beforeMount(cfg: ITabsBlockOptions): void {
      this._setSelectedTab(Number.parseInt(cfg.selectedTab, 10));
   }

   _beforeUpdate(cfg: ITabsBlockOptions): void {
      this._setSelectedTab(Number.parseInt(cfg.selectedTab, 10));
   }

   private _setSelectedTab(selectedTab: number): void {
      if (selectedTab >= 0 && selectedTab < this._tabCount) {
         this._selectedTabId = selectedTab;
      } else {
         this._selectedTabId = 0;
      }
   }

   static _styles: string[] = ['UIDemo/AsyncDemo/_tabsDemo/TabsDemo'];
}

export = NetworkRestoreTabs;
