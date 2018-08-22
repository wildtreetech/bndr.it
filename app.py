#!/usr/bin/env python

import os
import random
import logging
from datetime import datetime
from urllib.parse import urljoin
from urllib.parse import urlparse

import motor

from pymongo import ReturnDocument

import tornado.httpserver
import tornado.ioloop
import tornado.options
import tornado.web
from tornado.web import RequestHandler, HTTPError
from tornado.options import define, options

from utils import IntEncoder, normalise_uri


define("domain", type=str, default="bndr.it", help="Domain for short URLs")
define("port", default="8000", help="Server port", type=int)


class RedirectHandler(RequestHandler):
    async def get(self, short):
        db = self.settings['db']
        short_collection = db.short_urls
        url_info = await short_collection.find_one({'short': short})

        if url_info is None:
            self.write("The short URL %s doesn't exist." % short)
            self.finish()
        prefix = random.choice(url_info['prefixes'])
        self.redirect(urljoin(prefix, url_info['uri']))


class ListAPIHandler(RequestHandler):
    async def get(self):
        db = self.settings['db']
        self.write('Short URLs:<br>')
        async for l in db.short_urls.find():
            self.write("%s<br>" % l)
        self.write("<br>Counter: ")
        async for c in db.counters.find():
            self.write("%s" % c)


class CreateAPIHandler(RequestHandler):
    def set_default_headers(self):
        self.set_header("Access-Control-Allow-Origin", "*")
        self.set_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.set_header('Access-Control-Allow-Headers', 'accept, content-type, x-requested-with')

    async def post(self):
        db = self.settings['db']
        short_collection = db.short_urls

        prefix = self.get_argument('prefix', None)
        #if prefix is None:
        #    raise HTTPError(422)
        #if prefix not in self.settings['prefixes']:
        #    raise HTTPError(422)
        # support only mybinder.org for the moment
        prefix = 'mybinder'

        uri = self.get_argument('uri', None)
        if uri is None:
            raise HTTPError(422)
        # check if they submitted a full URL or just a URI
        parsed = urlparse(uri)
        if parsed.netloc:
            # full URL
            uri = parsed.path

        uri = normalise_uri(uri)

        # doesn't look right
        if not uri.startswith("/v2/"):
            raise HTTPError(500)

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
                'created': datetime.now(),
                'short': short,
                }
            await short_collection.insert_one(url_info)

        data = {
            'short_url': "https://{}/{}".format(self.settings['domain'],
                                                short)
            }
        self.finish({'status_code': 200, 'status_txt': 'OK', 'data': data})

    def options(self):
        self.set_status(204)
        self.finish()


class MainHandler(RequestHandler):
    def get(self):
        self.render('index.html')


class AfterHandler(RequestHandler):
    def get(self):
        self.render('after.html')


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r'/api/shorten/?', CreateAPIHandler),
            (r'/api/list/?', ListAPIHandler),
            (r'/after', AfterHandler),
            (r'/([a-zA-Z0-9]+)/?$', RedirectHandler),
            (r'/', MainHandler),
        ]

        mongodb_url = os.getenv("MONGODB_URL")
        db = motor.motor_tornado.MotorClient(mongodb_url)['bndrit']

        settings = dict(
            domain=options.domain,
            template_path=os.path.join(os.path.dirname(__file__), "build"),
            static_path=os.path.join(os.path.dirname(__file__), "static"),
            db=db,
            prefixes={'mybinder': ['https://mybinder.org/'],
                      'gesis': ['https://notebooks.gesis.org/binder/'],
                      'auto': ['https://notebooks.gesis.org/binder/',
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
