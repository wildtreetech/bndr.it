# bndr.it - Binder links for humans

This project is a small URL shortener specialised for BinderHub links.

It takes long URLs like https://mybinder.org/v2/gh/binder-examples/r/master?urlpath=rstudio and lets you
create a short link for it: https://bndr.it/b/6vyv6

## Architecture

There are two main parts to this project:

* `app.py` - a [tornado](http://www.tornadoweb.org/en/stable/) backend
* `frontend/` - a [nextjs](https://nextjs.org/) frontend

To run the service you also need a mongodb database.


## Deploying

The app is currently deployed on a VM and uses nginx as a reverse proxy.
Unfortunately deploying is a manual process right now ☹️.
