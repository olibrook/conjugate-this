import django.conf.urls as urls
import django.contrib.admin as admin

admin.autodiscover()

urlpatterns = urls.patterns(
    '',
    urls.url(r'^', urls.include('conjthis.public.urls')),
    # urls.url(r'^admin/', urls.include(admin.site.urls)),
)
