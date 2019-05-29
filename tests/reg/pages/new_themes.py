from atf.ui import *
# from selenium.webdriver.common.by import By


class UIDemoPage(Page):
    """Страница тестов UIDemo"""

    first_btn   = Button(By.CSS_SELECTOR, ".demo-UIDemo__switchFirst",  "switchFirst")
    second_btn  = Button(By.CSS_SELECTOR, ".demo-UIDemo__switchSecond", "switchSecond")

    theme1_cslst = CustomList(By.CSS_SELECTOR, ".theme_theme1", "theme1")
    theme2_cslst = CustomList(By.CSS_SELECTOR, ".theme_theme2", "theme2")
