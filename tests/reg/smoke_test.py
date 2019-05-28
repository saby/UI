# -*- coding: utf-8 -*-
from atf import *
from atf.ui import *
from pages.vdom_common import VDOMStartPage
from pages.new_themes import UIDemoPage


class RegressionTestSmoke(TestCaseUI):
    """Для проверки доступности стенда"""

    def test_ready_page(self):

        log("Проверка на пустую страницу")
        VDOMStartPage(self).open_vdom_page('UIDemo/ThemesDemo/Page')
        UIDemoPage(self).first_btn.should_be(Visible, msg='Страница не построена', wait_time=60)


if __name__ == '__main__':
    run_tests()
