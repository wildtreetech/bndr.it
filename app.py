#!/usr/bin/env python

import os
import json
import random
import logging
from datetime import datetime, timezone, timedelta
from urllib.parse import urljoin
from urllib.parse import urlparse

import motor
from motor.motor_tornado import MotorCollection

from pymongo import ReturnDocument
from pymongo.write_concern import WriteConcern

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
from tornado.web import RequestHandler, HTTPError, StaticFileHandler
from tornado.options import define, options
from tornado.log import app_log

from utils import IntEncoder, normalise_uri, JSONEncoder, anonymise_ip

# Add our own encoder to the JSON module, handles datetime objects for us
json._default_encoder = JSONEncoder()

UTC = timezone(timedelta(0))

define("domain", type=str, default="https://bndr.it",
       help="Domain for short URLs")
define("port", default="8000", help="Server port", type=int)


REDIRECT_TEMPLATE ="""
<html>
    <head>
        <meta http-equiv="refresh" content="3;url={preferred_binder}" />
        <link
          rel="stylesheet"
          href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
          integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
          crossOrigin="anonymous"
        />
        <style>
        a {{
           color: #337ab7;
         }}
         a:hover {{
           color: #23527c;
         }}
         </style>
    </head>
    <body>
        <div class="d-flex container align-content-center justify-content-center">
            <div class="mt-md-5 col-md-8">
                <h1>Redirecting</h1>
                <p class="mt-4 mt-md-5">
                  You have a preferred BinderHub set, in 3 seconds you will be
                  redirected to:
                </p>
                <p>
                  <a href="{preferred_binder}">{preferred_binder}</a>.
                </p>
                <p  class="mt-md-5">
                  The original short link pointed to:
                </p>
                <p>
                  <a href="{original_binder}">{original_binder}</a>.
                </p>
                <p class="mt-4 mt-md-5">
                  <small class="text-muted">
                  <a href="/b/settings">Click here to change your preferred BinderHub.</a>
                  </small>
                </p>
            </div>
        </div>
    </body>
</html>
"""

class RedirectHandler(RequestHandler):
    async def get(self, short):
        db = self.settings['db']
        events = MotorCollection(db, 'events',
                                 write_concern=WriteConcern(w=0))
        short_collection = db.short_urls

        url_info = await short_collection.find_one({'short': short})

        if url_info is None:
            self.write("The short URL %s doesn't exist." % short)
            self.finish()
            status = 404
            prefix = ''
            uri = ''

        else:
            prefix = random.choice(url_info['prefixes'])
            uri = url_info['uri']
            if uri.startswith('/'):
                uri = uri[1:]

            original_binder = urljoin(prefix, uri)

            preferred_prefix = self.get_cookie('binderUrl', '')
            if preferred_prefix:
                if not preferred_prefix.endswith('/'):
                    preferred_prefix += '/'
                preferred_binder = urljoin(preferred_prefix, uri)
                self.finish(REDIRECT_TEMPLATE.format(
                    preferred_binder=preferred_binder,
                    original_binder=original_binder
                    )
                )
            else:
                self.redirect(original_binder)

            status = 200

        event = {'ip': anonymise_ip(self.request.remote_ip),
                 'user-agent': self.request.headers['user-agent'],
                 'referer': self.request.headers.get('referer', ''),
                 'datetime': datetime.now(UTC),
                 'prefix': prefix,
                 'preferred_prefix': preferred_prefix,
                 'uri': uri,
                 'short': short,
                 'status': status,
                 }

        x = await events.insert_one(event)


class BaseAPIHandler(RequestHandler):
    def get_json_body(self):
        """Return the body of the request as JSON data."""
        if not self.request.body:
            return None
        body = self.request.body.strip().decode('utf-8')
        try:
            model = json.loads(body)
        except Exception:
            app_log.debug("Bad JSON: %r", body)
            app_log.error("Couldn't parse JSON", exc_info=True)
            raise HTTPError(400, 'Invalid JSON in body of request')
        return model

    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'accept, content-type, x-requested-with')

    def options(self):
        self.set_status(204)
        self.finish()


class InfoAPIHandler(BaseAPIHandler):
    async def get(self, short):
        db = self.settings['db']
        short_collection = db.short_urls
        events = db.events
        url_info = await short_collection.find_one({'short': short})

        if url_info is None:
            self.finish({'status_code': 404,
                         'status_txt': 'Short URL %s does not exist' % short})

        else:
            # remove internal information
            url_info.pop("_id")

            url_info['count'] = await events.count_documents({"short": short})
            self.finish({'status_code': 200, 'status_txt': 'OK', 'data': url_info})


class ListAPIHandler(BaseAPIHandler):
    async def get(self):
        db = self.settings['db']
        self.write('Short URLs:<br>')
        async for l in db.short_urls.find():
            self.write("%s<br>" % l)
        self.write("<br>Counter: ")
        async for c in db.counters.find():
            self.write("%s" % c)


class ShortenAPIHandler(BaseAPIHandler):
    async def post(self):
        db = self.settings['db']
        short_collection = db.short_urls

        json_request = (self.request.headers.get("Content-Type", "")
                        .startswith("application/json"))
        if json_request:
            data = self.get_json_body()
            binder_url = uri = data.get('binderUrl', None)
            prefix = data.get('prefix', None)
        else:
            binder_url = uri = self.get_argument('binderUrl', None)
            prefix = self.get_argument('prefix', None)

        if prefix is None:
            raise HTTPError(422, "Need a prefix")
        if prefix not in self.settings['prefixes']:
            raise HTTPError(422)

        if uri is None:
            raise HTTPError(422, "Need a binderUrl")
        # check if they submitted a full URL or just a URI
        parsed = urlparse(uri)
        if parsed.netloc:
            # full URL
            uri = parsed.path
            if parsed.query:
                uri += "?" + parsed.query
            if parsed.fragment:
                uri += "#" + parsed.fragment

        uri = normalise_uri(uri)
        # cut off any URI parts that belong to the prefix
        _, uri = uri.split("/v2/", maxsplit=1)
        uri = urljoin('/v2/', uri)

        app_log.debug("uri: %s", uri)

        url_key = (prefix, uri)
        url_info = await short_collection.find_one({'prefix': prefix,
                                                    'uri': uri})
        if url_info is not None:
            short = url_info['short']
        else:
            counter = await db.counters.find_one_and_update(
                {"_id": "shorturlid"},
                {'$inc': {'sequence_value': 1}},
                return_document=ReturnDocument.AFTER)

            enc = IntEncoder()
            short = enc.encode_url(counter['sequence_value'])

            url_info = {
                'prefixes': self.settings['prefixes'][prefix],
                'prefix': prefix,
                'uri': uri,
                'created': datetime.now(UTC),
                'short': short,
                }
            await short_collection.insert_one(url_info)

        data = {
            'short_url': "{}/{}".format(self.settings['domain'],
                                        short),
            'short': short
            }
        if json_request:
            self.finish({'status_code': 200, 'status_txt': 'OK', 'data': data})
        else:
            self.redirect('{}/b/{}'.format(self.settings['domain'],
                                           short))


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/api/shorten/?', ShortenAPIHandler),
            (r'/api/list/?', ListAPIHandler),
            (r'/api/info/([a-zA-Z0-9]+)/?$', InfoAPIHandler),
            (r'/([a-zA-Z0-9]+)/?$', RedirectHandler),
            (r'/(.*)', StaticFileHandler, {'default_filename': 'index.html',
                                           'path': 'static'})
        ]

        mongodb_url = os.getenv("MONGODB_URL")
        _, mongodb_name = mongodb_url.rsplit('/', maxsplit=1)
        db = motor.motor_tornado.MotorClient(mongodb_url)[mongodb_name]

        settings = dict(
            domain=options.domain,
            template_path=os.path.join(os.path.dirname(__file__), "build"),
            db=db,
            prefixes={'mybinder': ['https://mybinder.org/'],
                      'gesis': ['https://notebooks.gesis.org/binder/'],
                      'pangeo': ['https://binder.pangeo.io'],
                      'auto': ['https://binder.pangeo.io',
                               'https://notebooks.gesis.org/binder/',
                               'https://mybinder.org/'],
                      },
            debug=True,
        )
        tornado.web.Application.__init__(self, handlers, **settings)


def main():
    tornado.options.parse_command_line()
    logging.getLogger().setLevel(logging.DEBUG)
    http_server = tornado.httpserver.HTTPServer(Application(),
                                                xheaders=True)
    http_server.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
