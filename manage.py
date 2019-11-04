#!/usr/bin/env python

import os
import sys


PY3 = sys.version_info[0] == 3
if PY3:
    import builtins
else:
    import __builtin__ as builtins

try:
    builtins.profile
    builtins.profile = lambda x: x
except AttributeError:
    pass

if __name__ == "__main__":
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", 'mainapp.settings')

    from django.core.management import execute_from_command_line

    if sys.argv[1] != 'runserver':
        os.environ['RUN_COMMAND'] = 'true'

    execute_from_command_line(sys.argv)
