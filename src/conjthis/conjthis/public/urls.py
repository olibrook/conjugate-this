import django.conf.urls as urls

import conjthis.public.views as views

urlpatterns = urls.patterns(
    '',
    urls.url(r'^$', views.index),
)
