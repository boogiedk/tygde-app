import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';

const CONTACT_EMAIL = process.env.REACT_APP_CONTACT_EMAIL || 'contact@tygde.ru';
const CONTACT_TELEGRAM = process.env.REACT_APP_CONTACT_TELEGRAM || '';

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-brand">
          <span className="footer-logo">Tygde</span>
          <span className="footer-tagline">Организуйте встречу за минуту</span>
        </div>

        <div className="footer-links">
          <Link to="/terms" className="footer-link">Правила использования</Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="footer-link">{CONTACT_EMAIL}</a>
          {CONTACT_TELEGRAM && (
            <a
              href={`https://t.me/${CONTACT_TELEGRAM.replace('@', '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Telegram: {CONTACT_TELEGRAM}
            </a>
          )}
        </div>

        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Tygde
        </div>
      </div>
    </footer>
  );
};

export default Footer;
