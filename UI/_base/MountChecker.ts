import {constants} from 'Env/Env';

// tslint:disable-next-line:no-magic-numbers
const PAGE_CHECK_INTERVAL = 2 * 1000;
// tslint:disable-next-line:no-magic-numbers
const MAX_PAGE_MOUNT_TIME = 2 * 60 * 1000;
let reloadPageInterval;
let pageDontMounted;

const visibilityChangeHandler = () => {
   // Вкладку перезагружаем только после того, как пользователь на нее вернется, иначе вкалдка будет
   // бесконечно перезагружаться в фоновом режиме.
   if (!document.hidden && pageDontMounted) {
      window.location.reload();
   }
};

export default {
   start: () => {
      if (constants.isBrowserPlatform) {
         // Интервал запускаем только на новых страницах,
         // т.к. этот файл может прилететь в пакете на старые страницы и запустить интервал.
         // Но т.к. файл грузится просто как зависимость, то интервал никто не удалит и страница обновится.
         const isNewEnvironment = !!document.getElementsByClassName('ui-HTML').length;

         if (isNewEnvironment) {
            const startPageLoadTime = Date.now();

            // Запускаем именно интервал, а не таймаут на максимально допустимое время, т.к. если компьютер перейдет
            // в режим сна, то оставшееся время таймаута сохранится. И если пользователь вернется на такую вкладку,
            // она будет мертвой и перезагрузится только после окончания максимально допустимого времени, отведенного
            // для построения страницы.
            reloadPageInterval = setInterval(() => {
               if (Date.now() - startPageLoadTime > MAX_PAGE_MOUNT_TIME) {
                  pageDontMounted = true;
               }
            }, PAGE_CHECK_INTERVAL);

            document.addEventListener('visibilitychange', visibilityChangeHandler, false);
         }
      }
   },
   stop: () => {
      clearInterval(reloadPageInterval);
      document.removeEventListener('visibilitychange', visibilityChangeHandler);
   }
};
