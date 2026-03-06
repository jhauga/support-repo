import { Link, Outlet } from 'react-router-dom';
import '../styles/layout.css';

function Layout() {
  return (
    <div className="app-container">
      <header className="header">
        <nav className="nav">
          <h1 className="logo">Type-Safe Parts & Support</h1>
          <ul className="nav-links">
            <li>
              <Link to="/">Order Parts</Link>
            </li>
            <li>
              <Link to="/contact">Contact Support</Link>
            </li>
          </ul>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
      <footer className="footer">
        <p>&copy; 2026 Type-Safe Parts & Support. Built with React + TypeScript.</p>
      </footer>
    </div>
  );
}

export default Layout;
