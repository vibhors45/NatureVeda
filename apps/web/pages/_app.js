import "../styles/globals.css";
import Head from "next/head";

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        {/* Required for responsive scaling to actually work on mobile browsers */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5"
        />
        <title>NatureVeda</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
