# -*- coding: utf-8 -*-
from atf.run import RunTests
from atf.config import Config
from atf.helper import get_path_dir_artifact
import os
import shutil
import zipfile
import sqlite3

run_tests = RunTests()
run_tests.run_tests()

report_dir = os.path.join(get_path_dir_artifact(), Config().REGRESSION['REPORT_DIR'])

diff_ext = '~diff'
cur_ext = '~cur'

zip_src = os.path.join(get_path_dir_artifact(), 'report.zip')
if os.path.exists(zip_src):
    os.remove(zip_src)
archive = zipfile.ZipFile(zip_src, 'w', zipfile.ZIP_DEFLATED)
for root, _, files in os.walk(report_dir):
    for file in files:
        if diff_ext in file:
            file_name = os.path.join(root, file).replace(diff_ext, cur_ext)
            archive_file_name = file_name.replace(cur_ext, '')
            shutil.copy(file_name, archive_file_name)
            archive_name = archive_file_name.replace(report_dir, '')
            archive.write(archive_file_name, archive_name)
            os.remove(archive_file_name)
archive.close()

# используется в тестах по веткам
description_file = os.path.join(get_path_dir_artifact(), 'build_description.txt')
if os.path.exists(description_file):
    os.remove(description_file)
result_db = os.path.join(get_path_dir_artifact(), 'result.db')
print(result_db)
failed_tests = []

cursor = sqlite3.connect(result_db).cursor()
cursor.execute('''SELECT name FROM sqlite_master WHERE type='table' AND name='FailTest' ''')
if cursor.fetchone():
    cursor.execute('SELECT test FROM FailTest')
    fail = cursor.fetchall()
    if fail:
        failed_tests.extend([name[0] for name in fail])

with open(description_file, mode='a', encoding='utf-8') as f:
    f.write(' '.join(failed_tests))
