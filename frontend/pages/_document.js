import Document_, { Head, Main, NextScript } from 'next/document'
import htmlescape from 'htmlescape'

const { BACKEND } = process.env
const env = { BACKEND }

export default class Document extends Document_ {
  static async getInitialProps (ctx) {
    const props = await Document_.getInitialProps(ctx)
    return props
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
        </body>
      </html>
    )
  }
}
