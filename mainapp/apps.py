import os

from django.apps import AppConfig
from django.conf import settings


class MainAppConfig(AppConfig):
    name = 'mainapp'

    def ready(self):
        """
        Register app specific's views, request handlers and classes to the root app

        Note
        ---
        The app should only load when it runs as a server, not when the fixtures are being loaded,
        otherwise we end up with database problem.
        If the fixtures are loaded by the migrate.sh script (which they should be)
        then that script will set an environment variable IMPORTING_FIXTURE to "true"
        before it runs and to "false" when it finishes

        :return: None
        """
        run_main = os.environ.get('RUN_MAIN', None) == 'true'
        run_command = os.environ.get('RUN_COMMAND', None) == 'true'

        in_production = not settings.DEBUG
        if in_production or run_main or run_command:
            is_importing_fixture = os.getenv('IMPORTING_FIXTURE', 'false') == 'true'

            if not is_importing_fixture:
                from root.models import User
                from root.views import register_app_modules

                is_database_empty = True

                try:
                    User.objects.all().count()
                    is_database_empty = False
                except:
                    pass

                if not is_database_empty:
                    register_app_modules(self.name, 'request_handlers.movements')
                    register_app_modules(self.name, 'models')
                    register_app_modules('root', 'models')
