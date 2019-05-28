# -*- coding: utf-8 -*-
"""Добавление модуля в s3srv"""
import codecs

sourceText = '<items>'
module_txt = '<ui_module id="85db6f66-683e-4ab1-9531-cfa9a718f696" name="UIDemo"           url="./../../../../ui/UIDemo/UIDemo.s3mod"/>'
filename = 'InTestUI.s3srv'

with codecs.open(filename, 'r', 'utf-8') as f:
    old_txt = f.readlines()

new_txt = old_txt.replace(sourceText, sourceText+'\n    '+module_txt+'\n')

with codecs.open(filename, 'w', 'utf-8') as f:
    f.writelines(new_txt)
