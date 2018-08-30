import Document_, { Head, Main, NextScript } from 'next/document'
import htmlescape from 'htmlescape'

const { BACKEND } = process.env
const env = { BACKEND }

export default class Document extends Document_ {
  static async getInitialProps (ctx) {
    const props = await Document_.getInitialProps(ctx)
    return props
  }

  createGA () {
    return {
      __html: "(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){\n (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),\n m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)\n })(window,document,'script','//www.google-analytics.com/analytics.js','ga');\n ga('create', 'UA-75797246-3', 'auto', {'storage': 'none'});\n ga('set', 'anonymizeIp', true);\n ga('send', 'pageview');"};
  }

  render () {
    return (
      <html>
        <Head />
        <body>
          <Main />
          <script
            dangerouslySetInnerHTML={{ __html: '__ENV__ = ' + htmlescape(env) }}
          />
          <NextScript />
          <script dangerouslySetInnerHTML={this.createGA()} />
        </body>
      </html>
    )
  }
}
