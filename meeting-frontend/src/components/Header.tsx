import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="header-logo">
          Tygde
        </Link>
        {!isHomePage && (
          <a href="/" target="_blank" rel="noopener noreferrer" className="header-new-meeting">
            + Новая встреча
          </a>
        )}
      </div>
    </header>
  );
};

export default Header;
