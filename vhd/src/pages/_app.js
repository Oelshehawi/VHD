import "../style/dashboard.css";
import "../style/database.css";
import "../style/layout.css";
import "../style/modal.css";
import "../style/sidebar.css";
import "../style/topbar.css";
import "../style/table.css";

function MyApp({ Component, pageProps }) {
  return (
    <>
      {/* Add your layout here */}
      <Component {...pageProps} />
    </>
  );
}

export default MyApp;
