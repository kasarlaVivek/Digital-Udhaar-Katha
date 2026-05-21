import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, CheckCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { resettoken } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      return toast.error('Passwords do not match');
    }
    
    setLoading(true);
    try {
      await API.put(`/auth/resetpassword/${resettoken}`, { password });
      setSuccess(true);
      toast.success('Password updated successfully!');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="glass-card"
        style={{ width: '100%', maxWidth: '460px', padding: '3rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Set New Password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Create a new, strong password</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '2rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px' }}>
            <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Password Updated!</h3>
            <p style={{ color: 'var(--text-muted)' }}>Redirecting to login...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>New Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>

            <div className="input-group">
              <label>Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="password"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength="6"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', padding: '14px', marginTop: '1rem', fontSize: '1rem' }}
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Password'}
            </motion.button>
          </form>
        )}
      </motion.div>
    </div>
  );
};

export default ResetPassword;
