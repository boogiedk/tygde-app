import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import CreateMeetingPage from './pages/CreateMeetingPage';
import ViewMeetingPage from './pages/ViewMeetingPage';
import TermsPage from './pages/TermsPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<CreateMeetingPage />} />
          <Route path="/meeting/:id" element={<ViewMeetingPage />} />
          <Route path="/terms" element={<TermsPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
