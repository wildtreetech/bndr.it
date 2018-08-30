import React from 'react'

import {CopyToClipboard} from 'react-copy-to-clipboard';

import moment from 'moment';

import fetch from 'isomorphic-unfetch';

import {withRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from "../components/layout";

import env from '../lib/env';
const { BACKEND } = env;


const ShortUrl = (props) => (
  props.shortUrl.length > 0 ?
    <p className="d-flex mt-4 mt-md-5 align-items-baseline flex-wrap">
      <a
       className="h4 mr-sm-2"
       href={props.shortUrl}
       >
       {props.shortUrl}
      </a>
      <style jsx>{`
        a {
          color: #579ACA;
        }
        a:hover {
          color: #337ab7;
        }
      `}</style>
      <CopyToClipboard text={props.shortUrl}>
          <button
           type="button"
           className="btn btn-light btn-sm d-flex align-items-center">
            <img src='/static/clippy.svg' />
          </button>
      </CopyToClipboard>
    </p>
    :
    ""
)

class Page extends React.Component {
  static async getInitialProps ({ query }) {
    const res = await fetch(`${BACKEND}/api/info/${query.bndr}`)
    const json = await res.json()
    return { ...json.data }
  }

  render () {
    const bndr = this.props.router.query.bndr;
    const createdOn = moment.parseZone(this.props.created);
    return (
      <div>
      <Layout>
        <Head>
          <title key='title'>Bndr.it - Information for {`https://bndr.it/${bndr}`}</title>
        </Head>
        <h1>{bndr}</h1>
        <ShortUrl shortUrl={`https://bndr.it/${bndr}`} />
        <ul>
          <li>Total clicks: {this.props.count}.</li>
          <li>Created {createdOn.fromNow()}.</li>
        </ul>
        <p className="mt-4 mt-md-5">
          Create a new <Link href="/" prefetch><a>Binder short link</a></Link>
          {' '}for your favourite Binder.
        </p>
     </Layout>
     <style jsx>{`
       a {
         color: #337ab7;
       }
       a:hover {
         color: #23527c;
       }
     `}</style>
     </div>
   )
  }
}

export default withRouter(Page);
