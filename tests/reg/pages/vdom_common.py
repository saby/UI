# -*- coding: utf-8 -*-
from atf import *
from atf.ui import *
from urllib import parse
from atf.ui.browser import BrowserNames


class VDOMStartPage(Page):
    """Для проверки загрузки страниц с серверной версткой"""

    def check_load_page(self):
        """Проверка - построена страница или нет"""

        tmp_script = """return document.querySelector("html").controlNodes.length > 0"""
        assert_that(lambda: self.browser.execute_script(tmp_script), is_(True),
                    "Не построилась страница", and_wait(Wait.Page))

    def encoded_address(self, page_path):
        """Преобразование пути к демо-странице (замена '/' на '%2F') для платформенных роутингов

        :param page_path: путь к демо странице, например 'Controls-demo/Switch/DoubleSwitchPG'
        """

        return parse.quote_plus(page_path)

    def open_vdom_page(self, page_path, add_param=''):
        """Открытие демо-страниц VDOM

        :param page_path: путь к демо странице, например 'Controls-demo/Switch/DoubleSwitchPG'
        :param add_param: дополнительный параметр в строке URL, например '/#withoutLayout'
        """

        log("Открываем демо-страницу теста: '{0}{1}'".format(page_path, add_param))
        encoded_address = self.encoded_address(page_path)
        self.browser.open(self.config.SITE + '/UIDemo/page/' + encoded_address + add_param)
        self.check_load_page()
        self.browser.execute_script('document.cookie="s3debug=true"')
        self.browser.refresh()
        VDOMStartPage(self).check_load_page()