import React from 'react'

import Cookies from 'next-cookies';
import jsCookie from 'js-cookie';

import {withRouter} from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import Layout from "../components/layout";


class Page extends React.Component {
  static async getInitialProps (ctx) {
    const { binderUrl } = Cookies(ctx);
    return { binderUrl };
  }

  constructor(props) {
    super(props);
    this.state = {
      binderUrl: props.binderUrl || '',
      buttonText: 'Save settings'
    };

    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUrlChange (event) {
    this.setState({ buttonText: 'Save settings'})
    this.setState(
      {
        binderUrl: event.target.value,
      }
    );
  }

  handleSubmit(event) {
    event.preventDefault();
    jsCookie.set('binderUrl', this.state.binderUrl);
    this.setState({ buttonText: 'Settings saved'})
  }

  render () {
    return (
      <div>
      <Layout>
        <Head>
          <title key='title'>Bndr.it - Your settings</title>
        </Head>
        <h1>Settings</h1>
        <p className="mt-4 mt-md-5">
          This page lets you customise <Link href="/" prefetch>
          <a>bndr.it</a></Link> to your liking.
        </p>
        <form
         onSubmit={this.handleSubmit}
         >
          <div className="form-group">
            <label htmlFor="binderUrl">Your preferred BinderHub</label>
            <input
              type="url"
              pattern="https?://.+"
              className="form-control"
              id="binderUrl"
              name="binderUrl"
              aria-describedby="binderUrlHelp"
              placeholder="https://mybinder.org/"
              value={this.state.binderUrl}
              onChange={this.handleUrlChange}
            />
            <small id="binderUrlHelp" className="form-text text-muted">
              Insert your preferred BinderHub‘s URL.
            </small>
          </div>
          <button type="submit" className="btn btn-primary">
            {this.state.buttonText}
          </button>
        </form>
        <p className="mt-4 mt-md-5">
          Back to <Link href="/" prefetch><a>bndr.it</a></Link>.
        </p>
     </Layout>
     <style jsx>{`
       .btn-primary {
         background-color: #579ACA;
         border-color: #579ACA;
       }
       .btn-primary:hover {
         background-color: #337ab7;
         border-color: #337ab7;
       }
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
