# -*- coding: utf-8 -*-
from atf import *
from atf.ui import *
from pages.vdom_common import VDOMStartPage
from pages.new_themes import UIDemoPage


@mark('online')
class RegressionDemo4(TestCasePlatform):
    """Demo4"""

    def test_01_change_themes(self):
        """Проверка смены цвета элемента после клика по кнопка swith theme
        Демка:
        http://имя стенда:777/UIDemo/page/UIDemo/Demo4

        - делаем скрин
        - кликаем по верхней кнопке switch theme, делаем скрин
        - еще раз кликаем по верхней кнопке switch theme, делаем скрин
        - кликаем по второй кнопке switch theme, делаем скрин
        - еще раз кликаем по второй кнопке switch theme, делаем скрин

        Автор: Митин А.

        Задача в разработку 04.02.19 № 1176578770
        https://online.sbis.ru/opendoc.html?guid=ea9d4352-5047-436c-9bfc-8c61af9978f8
        """

        VDOMStartPage(self).open_vdom_page('UIDemo/Demo4')
        self.browser.set_window_position(0, 0)
        self.browser.maximize_window()

        test_page = UIDemoPage(self)
        test_page.first_btn.should_be(Visible, msg='Страница не построена', wait_time=Wait.Page)
        test_page.theme1_cslst.should_be(CountElements(2))
        test_page.theme2_cslst.should_be(CountElements(0))

        self.capture('plain', height=100, width=200)

        test_page.first_btn.click()
        test_page.theme1_cslst.should_be(CountElements(1))
        test_page.theme2_cslst.should_be(CountElements(1))
        self.capture('switchFirst_theme2', height=100, width=200)

        test_page.first_btn.click()
        test_page.theme1_cslst.should_be(CountElements(2))
        test_page.theme2_cslst.should_be(CountElements(0))
        self.capture('switchFirst_theme1', height=100, width=200)

        test_page.second_btn.click()
        test_page.theme1_cslst.should_be(CountElements(1))
        test_page.theme2_cslst.should_be(CountElements(1))
        self.capture('switchSecond_theme2', height=100, width=200)

        test_page.second_btn.click()
        test_page.theme1_cslst.should_be(CountElements(2))
        test_page.theme2_cslst.should_be(CountElements(0))
        self.capture('switchSecond_theme1', height=100, width=200)


if __name__ == '__main__':
    run_tests()
