import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Wallet, LogOut, User, LayoutDashboard } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="glass-card" style={{ margin: '1rem', padding: '0.8rem 2rem', position: 'sticky', top: '1rem', zIndex: 100, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))', padding: '8px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet color="white" size={24} />
        </div>
        <span style={{ fontSize: '1.2rem', fontWeight: 'bold', letterSpacing: '-0.5px' }}>
          Udhaar<span className="gradient-text">Katha</span>
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        {user ? (
          <>
            <Link to="/dashboard" className="btn btn-outline" style={{ border: 'none' }}>
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '4px 12px', background: 'var(--surface)', borderRadius: '20px' }}>
              <User size={16} className="gradient-text" />
              <span style={{ fontSize: '0.9rem', fontWeight: '500' }}>{user.name}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-outline" style={{ color: 'var(--error)' }}>
              <LogOut size={18} />
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn btn-outline">Login</Link>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
