import React from "react";

import fetch from "isomorphic-unfetch";
import URL from "url-parse";
import normalizeUrl from "normalize-url";

import Link from "next/link";
import { withRouter } from 'next/router';
import Layout from "../components/layout";

import env from '../lib/env';
const { BACKEND } = env;


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      serverSide: true,
      prefixes: {
        mybinder: 'https://mybinder.org',
        gesis: 'https://notebooks.gesis.org/binder'
      },
      prefixName: '',
      binderUrl: '',
      invalidUrl: true,
      validated: false,
      shortUrl: ''
    };

    this.handleUrlChange = this.handleUrlChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUrlChange(event) {
    var userUrl = '';
    try {
      userUrl = normalizeUrl(event.target.value,
                             {stripFragment: false,
                              normalizeHttp: true,
                              stripWWW: false});
    }
    catch (err) {
      userUrl = event.target.value;
    }

    // we have attempted to validate this
    // XXX debounce me?
    this.setState({validated: event.target.value.length > 10});
    var invalid = true;
    var prefix = '';
    for (var prefixName in this.state.prefixes) {
      if (userUrl.startsWith(this.state.prefixes[prefixName])) {
        invalid = false;
        prefix = prefixName;
        break;
      }
    }
    this.setState(
      {
        invalidUrl: invalid,
        binderUrl: event.target.value,
        prefixName: prefix
      }
    );
  }

  handleSubmit(event) {
    event.preventDefault();
    var binderUrl = '';
    try {
      binderUrl = normalizeUrl(this.state.binderUrl,
                               {stripFragment: false,
                                normalizeHttp: true,
                                stripWWW: false});
    }
    catch (err) {
      binderUrl = this.state.binderUrl;
    }
    console.log('submit', binderUrl);
    fetch(`${BACKEND}/api/shorten`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        binderUrl: binderUrl,
        prefix: this.state.prefixName
       })
     }
    )
    .then( r => r.json() )
    .then( data => {
      this.props.router.push(
        `/stats?bndr=${data.data.short}`,
        `/b/${data.data.short}`
      );
    });
  }

  componentDidMount() {
    this.setState({ serverSide: false });
  }

  render() {
    return (
      <div>
      <Layout>

        <h1>Binder Short Links</h1>
        <form
          id="shorty"
          className="mt-4 mt-md-5"
          action={`${BACKEND}/api/shorten`}
          method="POST"
          onSubmit={this.handleSubmit}
          noValidate={!this.state.serverSide}
        >
          <div className="form-group">
            <label htmlFor="binderUrl">The Binder URL to shorten</label>
            <input
              type="url"
              pattern="https?://.+"
              required
              className={(this.state.validated && this.state.invalidUrl) ? "form-control form-control-lg is-invalid" : "form-control form-control-lg"}
              id="binderUrl"
              name="binderUrl"
              aria-describedby="binderUrlHelp"
              placeholder="https://mybinder.org/v2/gh/<org>/<repo>"
              value={this.state.binderUrl}
              onChange={this.handleUrlChange}
            />
            <small id="binderUrlHelp" className="form-text text-muted">
              Insert your Binder‘s URL.
            </small>
            <div className="invalid-feedback">
            {
              this.state.serverSide ?
              "This does not appear to be a valid Binder URL." :
              `${this.state.binderUrl} does not appear to be a complete Binder URL.`
            }
            </div>
          </div>
          {
            this.state.serverSide ?
            <input type="hidden" value="mybinder" name="prefix" />
            :
            ""
          }
          <button type="submit" className="btn btn-primary">
            Create short link
          </button>
        </form>
        <p className="mt-4 mt-md-5">
          Create beautiful short links for your Binder.
        </p>
        <p>
          Enter the full
          launch URL for your Binder and get a short link like:{" "}
          <span className="text-monospace">https://bndr.it/25t52</span> that
          you can easily share with others.
        </p>
        <p>
          You can see the statistics for a short link by prefixing
          (<span className="text-monospace">/b/</span>) to the
          short code (<span className="text-monospace">25t52</span>),
          to make:{' '}
          <span className="text-monospace">https://bndr.it/b/25t52</span>.
        </p>
        <p>
          Currently only links to{" "}
          <a href="https://mybinder.org">mybinder.org</a> and{' '}
          <a href="https://notebooks.gesis.org/binder/">GESIS</a> are accepted.
        </p>
        <p>
          Customise your <Link href="/settings" as="/b/settings" prefetch>
          <a>bndr.it settings</a></Link>.
        </p>
        <p>
          <small className="text-muted">
            This service is operated by{" "}
            <a href="https://www.wildtreetech.com">Wild Tree Tech</a>.
          </small>
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
    );
  }
}

export default withRouter(Home);
