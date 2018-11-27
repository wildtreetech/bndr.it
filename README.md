# bndr.it - Binder links for humans

This project is a small URL shortener specialised for BinderHub links.

It takes long URLs like https://mybinder.org/v2/gh/binder-examples/r/master?urlpath=rstudio and lets you
create a short link for it: https://bndr.it/6vyv6. You can get basic statistics
about a short link at: https://bndr.it/b/6vyv6.


## Architecture

There are two main parts to this project:

* `app.py` - a [tornado](http://www.tornadoweb.org/en/stable/) backend
* `frontend/` - a [nextjs](https://nextjs.org/) frontend

To run the service you also need a mongodb database.


## Contributing

Contributions to this project are welcome! Please make a PR, file an issue, or
do something else that helps the project along.


## Deploying

The app is currently deployed on a VM and uses nginx as a reverse proxy.
Unfortunately deploying is a manual process right now ☹️.

* connect to the VM with ssh
* update the checkout of this repository on the bndr.it host
* activate bndrit env: `source activate bndrit`
* rebuild the frontend: `cd frontned && npm run build`
* restart the systemd services: `sudo systemctl restart bndr-it-frontend.service` and `sudo systemctl restart bndr-it.service`
* check https://bndr.it` changed and still works
