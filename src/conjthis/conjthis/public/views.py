import django.shortcuts as shortcuts


def index(request):
    return shortcuts.render_to_response(
        'public/index2.html', {}
    )
