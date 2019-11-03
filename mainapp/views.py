from django.shortcuts import redirect
from django.views.generic import TemplateView

from root.views import can_have_exception


def get_home_page(request):
    return redirect('jun')


extra_context = {

}


def get_view(name):
    """
    Get a generic TemplateBased view that uses only common context
    :param name: name of the view. A `name`.html must exist in the template folder
    :return:
    """
    class View(TemplateView):
        page_name = name
        template_name = name + '.html'

        def get_context_data(self, **kwargs):
            context = super(View, self).get_context_data(**kwargs)

            extra_context_func = extra_context.get(self.__class__.page_name, None)
            if extra_context_func:
                extra_context_func(self.request, context)

            return context

        @can_have_exception
        def get(self, request, *args, **kwargs):
            return super(View, self).get(request, *args, **kwargs)

    return View.as_view()
