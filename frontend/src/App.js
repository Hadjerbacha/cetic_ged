import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Container } from 'react-bootstrap'; // On garde la mise en page
import Login from './components/Login';
import 'bootstrap/dist/css/bootstrap.min.css';
import Workflowss from './components/Workflowss';
import Register from './components/Register';

function App() {
  return (
    <Router>
      <Container className="mt-4">
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/workflowss" element={<Workflowss />} />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;
