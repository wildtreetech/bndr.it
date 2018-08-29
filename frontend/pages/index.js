import React from "react";

import fetch from "isomorphic-unfetch";
import URL from "url-parse";

import Link from "next/link";
import Head from "next/head";


class Home extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      test: false,
      prefix: 'https://mybinder.org/v2/',
      uri: '',
      usersUrl: ''
    };

    this.handleUriChange = this.handleUriChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleUriChange(event) {
    console.log('uri changed', event.target.value);
    const prefixUrl  = new URL(this.state.prefix);
    const prefixUri = prefixUrl.pathname;

    const url = new URL(event.target.value, 'https://mybinder.org/');
    const regex = new RegExp(`^${prefixUri}`, "g");
    var uri = url.pathname.replace(regex, "")
    prefixUrl.set('pathname', `${prefixUri}${uri}`);
    prefixUrl.set('query', url.query);
    if (url.query) {
      uri = `${uri}${url.query}`
    }
    console.log(prefixUrl);

    if (event.target.value === '') {
      this.setState({uri: ''});
    } else {
      if (uri.startsWith('/')) {
        this.setState({uri: uri.substring(1)});
      } else {
        this.setState({uri: uri});
      }
    }
    this.setState({usersUrl: prefixUrl});
  }

  handleSubmit(event) {
    event.preventDefault();
    console.log('submitting', this.state.uri);
  }

  static async getInitialProps () {
    console.log('getInitialProps');
    return { stars: 42 };
  }

  componentDidMount() {
    console.log('componentDidMount state1', this.state);
    this.setState({ test: true });
    console.log('componentDidMount state2', this.state);
  }

  render() {
    console.log('render state', this.state);
    return (
      <div>
        <Head>
          <link
            rel="stylesheet"
            href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
            integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
            crossorigin="anonymous"
          />
        </Head>
        <div className="d-flex container align-content-center justify-content-center">
          <div className="mt-md-5 col-md-8">
            <h1>Binder Short Links</h1>
            <form
              id="shorty"
              className="mt-4 mt-md-5 needs-validation was-validated"
              noValidate
              _lpchecked="1"
              action="//localhost:8000/api/shorten"
              onSubmit={this.handleSubmit}
            >
              <div className="form-group">
                <label htmlFor="uri">The Binder URL to shorten</label>
                <div className="input-group mb-3">
                  <div className="input-group-prepend">
                    <div className="input-group-text">
                      { this.state.prefix }
                    </div>
                  </div>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="uri"
                    name="uri"
                    aria-describedby="binderUrlHelp"
                    placeholder="gh/<org>/<repo>"
                    required
                    value={this.state.uri}
                    onChange={this.handleUriChange}
                  />
                </div>
                <small id="binderUrlHelp" className="form-text text-muted">
                  {!this.state.usersUrl ? "Insert your Binder‘s URL." : `Your URL is: ${this.state.usersUrl}`}
                </small>
              </div>
              <button type="submit" className="btn btn-primary">
                Create short link
              </button>
            </form>
            <p className="mt-4 mt-md-5">
              Create beautiful short links for your Binder. Enter the full
              launch URL for your Binder and get a short link like:{" "}
              <span className="text-monospace">https://bndr.it/xxxx</span> that
              you can easily share with anyone.
            </p>
            <p>
              Currently only links to{" "}
              <a href="https://mybinder.org">mybinder.org</a> are accepted.
            </p>
            <p>
              This service is operated by{" "}
              <a href="//www.wildtreetech.com">Wild Tree Tech</a>.
            </p>
          </div>
        </div>
      </div>
    );
  }
}

export default Home;
