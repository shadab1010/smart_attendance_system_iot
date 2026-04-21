import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Home from './pages/Home';
import AdminDashboard from './pages/AdminDashboard';
import Header from './components/Header';
import Footer from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useState } from 'react';

function App() {
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col font-sans">
        <Header
          isAdminLoggedIn={isAdminLoggedIn}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
        />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <ErrorBoundary>
            <Routes>
              <Route path="/" element={<Home isAdminLoggedIn={isAdminLoggedIn} />} />
              <Route
                path="/admin"
                element={isAdminLoggedIn ? <AdminDashboard /> : <Navigate to="/" replace />}
              />
            </Routes>
          </ErrorBoundary>
        </main>
        <Footer />
      </div>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
