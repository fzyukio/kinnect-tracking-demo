from django import forms
from django.forms.utils import ErrorList
from django.utils.encoding import force_text
from django.utils.html import format_html_join


class ErrorMixin(forms.Form):
    """
    Primarily used to override error rendering
    """

    class SpanErrorList(ErrorList):
        def __unicode__(self):
            return self.as_spans()

        def as_spans(self):
            if not self:
                return u''
            return format_html_join('', '<span class="error-label">{}</span>',
                                    ((force_text(e),) for e in self))

    def __init__(self, *args, **kwargs):
        kwargs['error_class'] = ErrorMixin.SpanErrorList
        super(ErrorMixin, self).__init__(*args, **kwargs)
