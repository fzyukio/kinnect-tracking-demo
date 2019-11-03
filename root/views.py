import importlib
import json

from django.conf import settings
from django.db import IntegrityError
from django.db.models.base import ModelBase
from django.http import HttpResponse, HttpResponseNotFound, HttpResponseBadRequest
from django.http import HttpResponseServerError
from django.views.decorators.csrf import csrf_exempt
from django.views.generic import TemplateView

from root.exceptions import CustomAssertionError

error_tracker = settings.ERROR_TRACKER


def exception_handler(function, request, *args, **kwargs):
    try:
        return function(request, *args, **kwargs)
    except Exception as e:
        error_id = error_tracker.captureException()
        if isinstance(e, IntegrityError):
            message = e.args[1]
        else:
            message = str(e)

        if isinstance(e, CustomAssertionError):
            return HttpResponseBadRequest(json.dumps(dict(errid=error_id, message=message)))
        return HttpResponseServerError(json.dumps(dict(errid=error_id, message=message)))


def can_have_exception(function):
    def wrap(request, *args, **kwargs):
        return exception_handler(function, request, *args, **kwargs)

    wrap.__doc__ = function.__doc__
    wrap.__name__ = function.__name__
    return wrap


@csrf_exempt
def send_request(request, *args, **kwargs):
    """
    All fetch requests end up here and then delegated to the appropriate function, based on the POST key `type`
    :param request: must specify a valid `type` in POST data, otherwise 404. The type must be in form of
                    get_xxx_yyy and a function named set-xxx-yyy(request) must be available and registered
                    using register_app_modules
    :return: AJAX content
    """
    fetch_type = kwargs['type']
    module = kwargs.get('module', None)
    func_name = fetch_type.replace('-', '_')
    if isinstance(fetch_type, str):
        if module is not None:
            func_name = module + '.' + func_name
        function = globals().get(func_name, None)

        if function:
            response = exception_handler(function, request)
            if isinstance(response, HttpResponse):
                return response
            return HttpResponse(json.dumps(dict(message=response)))

    return HttpResponseNotFound()


def get_view(name):
    """
    Get a generic TemplateBased view that uses only common context
    :param name: name of the view. A `name`.html must exist in the template folder
    :return:
    """
    class View(TemplateView):
        template_name = name + '.html'

        def get_context_data(self, **kwargs):
            context = super(View, self).get_context_data(**kwargs)
            context['page'] = name
            return context

    return View.as_view()


def register_app_modules(package, filename):
    """
    Make views and modules known to this workspace
    :param package: name of the package (app)
    :param filename: e.g. mainapp.views, mainapp.models, ...
    :return: None
    """
    package_modules = importlib.import_module('{}.{}'.format(package, filename)).__dict__
    globals_dict = globals()

    # First import all the modules made available in __all__
    exposed_modules = package_modules.get('__all__', [])
    for old_name in exposed_modules:
        new_name = '{}.{}'.format(package, old_name)
        globals_dict[new_name] = package_modules[old_name]

    # Then import all Models
    for old_name, module in package_modules.items():
        if old_name not in exposed_modules and isinstance(module, ModelBase):
            new_name = '{}.{}'.format(package, old_name)
            globals_dict[new_name] = module
