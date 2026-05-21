import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import API from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await API.post('/auth/forgotpassword', { email });
      setSuccess(true);
      toast.success('Password reset email sent!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send reset email');
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
          <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Reset Password</h2>
          <p style={{ color: 'var(--text-muted)' }}>Enter your email to receive a reset link</p>
        </div>

        {success ? (
          <div style={{ textAlign: 'center', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--success)' }}>
            <p>An email with password reset instructions has been sent to <strong>{email}</strong>.</p>
            <p style={{ marginTop: '1rem', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Check your inbox and spam folder.</p>
            <Link to="/login" className="btn btn-outline" style={{ marginTop: '1.5rem', display: 'inline-flex', padding: '10px 20px' }}>
              Return to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label>Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="email"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
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
              {loading ? 'Sending...' : (
                <>
                  <span>Send Reset Link</span>
                  <ArrowRight size={18} />
                </>
              )}
            </motion.button>
          </form>
        )}

        <div style={{ textAlign: 'center', marginTop: '2rem' }}>
          <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textDecoration: 'none' }}>
            ← Back to Login
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
