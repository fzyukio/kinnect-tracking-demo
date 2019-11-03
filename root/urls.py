import django_js_reverse.views
from django.conf import settings
from django.conf.urls import url
from django.conf.urls.static import static
from django.urls import include

from root import views

urlpatterns = [
    url(r'^tz_detect/', include('tz_detect.urls')),
    url(r'^jsreverse/$', django_js_reverse.views.urls_js, name='js_reverse'),
    url(r'^send-request/(?P<type>[0-9a-z-]+)/$', views.send_request, name='send-request'),
    url(r'^send-request/(?P<module>[0-9a-z-]+)/(?P<type>[0-9a-z-]+)/$', views.send_request, name='send-request'),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
