import { useState } from 'react'
import './App.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import InvoiceList from './components/InvoiceList'
import ComplaintList from './components/ComplaintList'

function App() {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });
  const [currentView, setCurrentView] = useState('dashboard');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setCurrentView('dashboard');
  };

  if (!user) {
    return <Login onLoginSuccess={(userData) => {
      setUser(userData);
      setCurrentView('dashboard');
    }} />;
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="navbar-brand">
          <h1>PropTech Management</h1>
        </div>
        <div className="navbar-menu">
          <button 
            className={currentView === 'dashboard' ? 'active' : ''} 
            onClick={() => setCurrentView('dashboard')}
          >
            Trang Chủ
          </button>
          <button 
            className={currentView === 'invoices' ? 'active' : ''} 
            onClick={() => setCurrentView('invoices')}
          >
            Hóa Đơn
          </button>
          <button 
            className={currentView === 'complaints' ? 'active' : ''} 
            onClick={() => setCurrentView('complaints')}
          >
            Khiếu Nại
          </button>
        </div>
        <div className="navbar-user">
          <span>{user.phoneNumber}</span>
          <button onClick={handleLogout} className="btn-logout">Đăng Xuất</button>
        </div>
      </nav>

      <main className="main-content">
        {currentView === 'dashboard' && (
          <Dashboard user={user} />
        )}
        {currentView === 'invoices' && (
          <InvoiceList userRole={user.role} />
        )}
        {currentView === 'complaints' && (
          <ComplaintList userRole={user.role} />
        )}
      </main>
    </div>
  )
}

export default App
