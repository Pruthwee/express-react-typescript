import type { AppProps } from 'next/app';
import '../src/client/Less/app.less';

// Next.js App component with SSR support
function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}

export default MyApp;
