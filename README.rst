Roomies
-------

Roomies is a website for finding houseshares in London. It is like any one of these,
only way more badass

- http://www.easyroommate.com/
- http://www.spareroom.co.uk

Setup
-----

  python2.7 -S bootstrap.py
  ./bin/buildout

Running tests
-------------

  ./bin/py.test src/roomies/roomies


Misc.
-----

Generate a Graphviz model diagram for the 'common' app:

  ./bin/django-admin.py graph_models common --settings=roomies.settings

The Wiki
-------

https://bitbucket.org/bryan_picsolve/roomies/wiki/Home


Postgres / Geodjango Setup
--------------------------

Install postgres

    sudo apt-get install postgresql postgresql-contrib postgresql-server-dev-9.1

Install postgis 2.0 (ubuntu repositories out of date):

    sudo add-apt-repository ppa:ubuntugis/ubuntugis-unstable
    sudo apt-get install postgresql-9.1-postgis-2.1-scripts postgresql-9.1-postgis-2.1


Create a DB and enable the Postgis extension:

    createdb roomies
    psql roomies
    CREATE EXTENSION postgis;
    \q
