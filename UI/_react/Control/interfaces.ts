import { FunctionComponent } from 'react';
import { Control } from './Compatible';

export interface IControlOptions<C = Control> {
  // Ссылка на инстанс для корректной работы шаблонов
  _$wasabyInstance?: C;
}

export interface ITemplateFunction<P = IControlOptions, S = {}> extends FunctionComponent<IControlOptions> {
  reactiveProps?: string[];
}