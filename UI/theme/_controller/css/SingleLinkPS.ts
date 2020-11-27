/// <amd-module name='UI/theme/_controller/css/SingleLinkPS' />
import SingleLink from './SingleLink';
/**
 * Немультитемная ссылка на СП
 */
export default class SingleLinkPS extends SingleLink {
   constructor(
      href: string,
      cssName: string,
      themeName: string
   ) {
      super(href, cssName, themeName);
   }
}
