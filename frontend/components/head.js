import React from 'react'
import NextHead from 'next/head'
import { string } from 'prop-types'

const defaultDescription = ''

const Head = props => (
  <NextHead>
    <meta charSet="UTF-8" />
    <title key='title'>{props.title || 'Bndr.it - Binder links for humans'}</title>
    <meta
      name="description"
      content={props.description || defaultDescription}
    />
    <meta name="viewport" content="width=device-width, initial-scale=1" />

    <link
      rel="stylesheet"
      href="https://stackpath.bootstrapcdn.com/bootstrap/4.1.3/css/bootstrap.min.css"
      integrity="sha384-MCw98/SFnGE8fJT3GXwEOngsV7Zt27NXFoaoApmYm81iuXoPkFOJwJ8ERdknLPMO"
      crossOrigin="anonymous"
    />
  </NextHead>
)

Head.propTypes = {
  title: string,
  description: string,
}

export default Head
