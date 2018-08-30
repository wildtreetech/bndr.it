import Link from 'next/link'
import Head from './head'

export default ({ children }) => (
  <div>
    <Head>
    </Head>

    <div className="d-flex container align-content-center justify-content-center">
      <div className="mt-md-5 col-md-8">
        { children }
      </div>
    </div>

  </div>
)
