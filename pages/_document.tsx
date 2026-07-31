import { Html, Head, Main, NextScript } from 'next/document';

// Custom Document for Next.js with SSR support
export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <meta charSet="UTF-8" />
        <meta httpEquiv="X-UA-Compatible" content="ie=edge" />
        <meta 
          httpEquiv="Content-Security-Policy" 
          content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';" 
        />
      </Head>
      <body>
        {/* Next.js will inject server-rendered content here */}
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
