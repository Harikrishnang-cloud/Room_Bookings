import React from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Dashboard from './pages/Dashboard';
import { ErrorBoundary } from './components/ErrorBoundary';

export default function App() {
  return (
    <ErrorBoundary>
      <ToastContainer position="top-right"autoClose={3000}hideProgressBar={false}newestOnTop closeOnClickrtl={false}pauseOnFocusLoss draggable pauseOnHover theme="light"limit={3}/>
      <Dashboard />
    </ErrorBoundary>
  );
}
