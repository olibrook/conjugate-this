from setuptools import setup, find_packages

setup(
    name="conjthis",
    version="0.0.1",
    packages=find_packages(
        exclude=["conjthis_tests"]
    ),
    install_requires=[
        "pytest",
        "pytest-bdd",
        "django==1.5",
        "django-extensions",
        "psycopg2",
        "factory_boy",
        "beautifulsoup4",
    ]
)
