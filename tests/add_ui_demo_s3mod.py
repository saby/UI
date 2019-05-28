# -*- coding: utf-8 -*-
"""Добавление модуля в s3srv"""
import codecs

sourceText = '<items>'
module_txt = '<ui_module id="85db6f66-683e-4ab1-9531-cfa9a718f696" name="UIDemo"                  url="./../../../../ui/UIDemo/UIDemo.s3mod"/>'
filename = 'InTestUI.s3srv'

with codecs.open(filename, 'r', 'utf-8') as f:
    txt = f.readlines()

count = -1
for tmp_line in txt:
    count += 1
    if sourceText in tmp_line:
        # замена для теста автодополнения связанного с двумя браузерами
        txt[count] = '    {0}\n        {1}\n'.format(sourceText, module_txt)
        break

with codecs.open(filename, 'w', 'utf-8') as f:
    f.writelines(txt)
