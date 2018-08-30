import React from 'react'

import {CopyToClipboard} from 'react-copy-to-clipboard';

import fetch from 'isomorphic-unfetch';

import {withRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from "../components/layout";

const BACKEND = "http://localhost:8000"

const ShortUrl = (props) => (
  props.shortUrl.length > 0 ?
    <p className="d-flex mt-4 mt-md-5 align-items-baseline flex-wrap">
      <a
       className="h4 mr-sm-2 text-primary"
       href={props.shortUrl}
       >
       {props.shortUrl}
      </a>
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
    const createdOn = new Date(this.props.created);
    return (
      <Layout>
        <Head>
          <title key='title'>Bndr.it - Information for {`https://bndr.it/${bndr}`}</title>
        </Head>
        <h1>{bndr}</h1>
        <ShortUrl shortUrl={`https://bndr.it/${bndr}`} />
        <ul>
          <li>Total clicks: {this.props.count}.</li>
          <li>Created on {createdOn.toString()}.</li>
        </ul>
        <p>
          Create a new <Link href="/" prefetch>Binder short URL</Link>.
        </p>
     </Layout>
   )
  }
}

export default withRouter(Page);
