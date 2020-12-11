import { cookie, constants } from 'Env/Env';

let fixScopeMergingInContent;
export function getFixScopeMergingInContent() {
   let result;
   try {
      result = process.domain.req.fixScopeMergingInContent;
   } catch (e) {
      result = fixScopeMergingInContent;
   }
   if (result === undefined) {
      const value = cookie.get('fixScopeMergingInContent') === 'true';
      setFixScopeMergingInContent(value);
      return value;
   }
   return result && !constants.isProduction && constants.browser.chrome;
}
export function setFixScopeMergingInContent(value) {
   try {
      process.domain.req.fixScopeMergingInContent = value;
   } catch (e) {
      fixScopeMergingInContent = value;
   }
}