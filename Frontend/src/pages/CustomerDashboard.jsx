import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wallet, CreditCard, ShieldCheck, Clock, ArrowRight, Sparkles, CheckCircle, IndianRupee, Store, FileDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../api/axios';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Confetti particle component
const ConfettiParticle = ({ delay, color }) => {
  const randomX = Math.random() * 100;
  const randomRotate = Math.random() * 360;
  const randomSize = 6 + Math.random() * 8;
  const duration = 2 + Math.random() * 2;

  return (
    <motion.div
      initial={{ y: -20, x: `${randomX}vw`, opacity: 1, rotate: 0, scale: 1 }}
      animate={{
        y: '100vh',
        rotate: randomRotate + 360,
        opacity: [1, 1, 0],
        scale: [1, 1, 0.5],
      }}
      transition={{ duration, delay, ease: 'linear' }}
      style={{
        position: 'fixed',
        top: 0,
        width: `${randomSize}px`,
        height: `${randomSize}px`,
        backgroundColor: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '2px',
        zIndex: 3000,
        pointerEvents: 'none',
      }}
    />
  );
};

const Confetti = () => {
  const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'];
  const particles = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1.5,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 3000 }}>
      {particles.map((p) => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} />
      ))}
    </div>
  );
};

const CheckoutForm = ({ amount, ledgerId, publishableKey, onSuccess, onCancel }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError('');

    try {
      const { data } = await API.post('/payment/create-intent', { amount, ledgerId });
      const { clientSecret } = data;

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
        },
      });

      if (result.error) {
        setError(result.error.message);
        toast.error(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          const response = await API.post('/payment/success', { amount, ledgerId });
          onSuccess(response.data);
        }
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Payment failed. Please try again.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        padding: '1.2rem',
        background: 'var(--surface)',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid var(--glass-border)',
      }}>
        <CardElement options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#f8fafc',
              fontFamily: "'Outfit', sans-serif",
              '::placeholder': { color: '#94a3b8' },
            },
          }
        }} />
      </div>

      {error && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          marginBottom: '1rem',
          color: 'var(--error)',
          fontSize: '0.85rem'
        }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          style={{ flex: 1, padding: '14px' }}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!stripe || loading}
          className="btn btn-primary"
          style={{ flex: 2, padding: '14px' }}
        >
          {loading ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ width: '16px', height: '16px', border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%' }}
              />
              Processing...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} />
              Pay ₹{Number(amount).toLocaleString('en-IN')}
            </span>
          )}
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginTop: '1.5rem' }}>
        <ShieldCheck size={14} style={{ color: 'var(--text-muted)' }} />
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Secured by Stripe. We never store your card details.
        </span>
      </div>
    </form>
  );
};

const CustomerDashboard = () => {
  const { user, logout } = useAuth();
  const [selectedLedger, setSelectedLedger] = useState(null);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isAccountDeleted, setIsAccountDeleted] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [stripePromise, setStripePromise] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [activeTab, setActiveTab] = useState('ledgers'); // 'ledgers' or 'history'

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data } = await API.get('/transactions');
      setTransactions(data.data);
    } catch (error) {
      console.log('Failed to fetch transactions');
    }
  };

  const handleDownloadMyPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(248, 250, 252);
      doc.setFontSize(20);
      doc.text('Digital Udhaar Katha', 14, 18);
      doc.setFontSize(11);
      doc.text(`Statement for: ${user?.name || 'Customer'}`, 14, 28);
      doc.text(`Email: ${user?.email || ''}`, 14, 35);
      doc.setFontSize(9);
      doc.text(`Generated: ${new Date().toLocaleString('en-IN')}`, 140, 28);

      const tableData = transactions.map(t => ([
        new Date(t.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        t.ownerName || 'Shop',
        t.description || (t.type === 'credit' ? 'Credit Added' : 'Repayment'),
        t.type === 'credit' ? `+Rs.${t.amount.toLocaleString('en-IN')}` : `-Rs.${t.amount.toLocaleString('en-IN')}`,
      ]));

      autoTable(doc, {
        startY: 48,
        head: [['Date', 'Shop', 'Description', 'Amount']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [241, 245, 249] },
        styles: { fontSize: 9, cellPadding: 4, overflow: 'linebreak' },
        columnStyles: {
          0: { cellWidth: 35 }, // Date
          1: { cellWidth: 35 }, // Shop
          2: { cellWidth: 'auto' }, // Description (takes remaining space and wraps)
          3: { cellWidth: 30 }, // Amount
        }
      });

      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text(`Page ${i} of ${pageCount} | Digital Udhaar Katha`, 14, doc.internal.pageSize.height - 10);
      }

      doc.save(`${(user?.name || 'Customer').replace(/\s+/g, '_')}_statement.pdf`);
      toast.success('PDF downloaded!');
    } catch (error) {
      console.error('PDF generation error:', error);
      toast.error('Failed to generate PDF. Please try again.');
    }
  };

  // Initialize with customer's active ledgers
  useEffect(() => {
    if (user?.ledgers && user.ledgers.length > 0) {
      setSelectedLedger(user.ledgers[0]);
    }
  }, [user]);

  // Load custom stripe key if set by the specific shop owner
  useEffect(() => {
    if (selectedLedger) {
      const activeKey = selectedLedger.stripePublishableKey || import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      if (activeKey) {
        setStripePromise(loadStripe(activeKey));
      } else {
        setStripePromise(null);
      }
    }
  }, [selectedLedger]);

  if (!user) return null;

  const activeLedgers = user.ledgers || [];
  const totalOutstanding = activeLedgers.reduce((acc, curr) => acc + curr.payableAmount, 0);

  const handlePaymentSuccess = (response) => {
    if (response.accountDeleted) {
      setIsAccountDeleted(true);
      setShowSuccessModal(true);
      setShowConfetti(true);
      setShowPayment(false);

      // Stop confetti after 4 seconds
      setTimeout(() => setShowConfetti(false), 4000);

      // Logout after 6 seconds if completely cleared
      setTimeout(() => {
        logout();
      }, 6000);
    } else {
      toast.success(`Payment of ₹${paymentAmount} successful!`);
      setShowPayment(false);
      // Reload to get updated balances
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handlePayFull = () => {
    if (!selectedLedger) return;
    setPaymentAmount(selectedLedger.payableAmount);
    setShowPayment(true);
  };

  const handlePayCustom = () => {
    if (!selectedLedger) return;
    if (!paymentAmount || Number(paymentAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (Number(paymentAmount) > selectedLedger.payableAmount) {
      toast.error(`Amount cannot exceed ₹${selectedLedger.payableAmount.toLocaleString('en-IN')}`);
      return;
    }
    setShowPayment(true);
  };

  return (
    <div className="container" style={{ paddingTop: '3rem', paddingBottom: '4rem' }}>
      {showConfetti && <Confetti />}

      {/* Account Cleared Success Modal */}
      <AnimatePresence>
        {showSuccessModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000, backdropFilter: 'blur(12px)' }}>
            <motion.div
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="glass-card"
              style={{ padding: '3rem', textAlign: 'center', maxWidth: '500px', border: '1px solid rgba(16, 185, 129, 0.3)' }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
                style={{ fontSize: '5rem', marginBottom: '1.5rem' }}
              >
                🎉
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                style={{ fontSize: '2.2rem', marginBottom: '1rem' }}
              >
                <span className="gradient-text">All Cleared!</span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                style={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: '1.6', marginBottom: '1.5rem' }}
              >
                Congratulations! You have fully cleared your outstanding credit balances!
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                style={{
                  margin: '2rem 0',
                  padding: '1.5rem',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '16px',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                  <CheckCircle size={20} style={{ color: 'var(--success)' }} />
                  <p style={{ color: 'var(--success)', fontWeight: '600', margin: 0 }}>All Dues Fully Settled</p>
                </div>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
                  You will be logged out automatically in a few seconds.
                </p>
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}
              >
                Thank you for using Digital Udhaar Katha 🙏
              </motion.p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Dashboard */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button
          className={`btn ${activeTab === 'ledgers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('ledgers')}
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem' }}
        >
          <Store size={16} style={{ marginRight: '6px' }} />
          <span>Active Shop Accounts</span>
        </button>
        <button
          className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('history')}
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem' }}
        >
          <Clock size={16} style={{ marginRight: '6px' }} />
          <span>Global Activity Log</span>
        </button>
      </div>

      {activeTab === 'ledgers' ? (
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '3rem', alignItems: 'start' }}>

        {/* Left Column - Info & Ledger Lists */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>
            Welcome, <span className="gradient-text">{user.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2.5rem', fontSize: '1.05rem' }}>
            Track and settle your credit accounts across different shopkeepers.
          </p>

          {/* Multiple Ledgers Card List */}
          <h3 style={{ marginBottom: '1rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Store size={20} style={{ color: 'var(--primary)' }} />
            Active Shop Accounts ({activeLedgers.length})
          </h3>

          <div style={{ display: 'grid', gap: '1rem', marginBottom: '3rem' }}>
            {activeLedgers.map((l) => {
              const isSelected = selectedLedger?.id === l.id;
              return (
                <motion.div
                  key={l.id}
                  whileHover={{ scale: 1.01 }}
                  onClick={() => {
                    setSelectedLedger(l);
                    setShowPayment(false);
                    setPaymentAmount('');
                  }}
                  style={{
                    padding: '1.5rem',
                    borderRadius: '16px',
                    background: isSelected ? 'rgba(99, 102, 241, 0.08)' : 'var(--glass)',
                    border: isSelected ? '2px solid var(--primary)' : '1px solid var(--glass-border)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <div>
                    <h4 style={{ fontSize: '1.15rem', fontWeight: '700', marginBottom: '4px', color: isSelected ? 'var(--text)' : 'var(--text-muted)' }}>
                      {l.ownerName}
                    </h4>
                    <span style={{ fontSize: '0.8rem', padding: '4px 10px', background: 'var(--surface)', borderRadius: '20px', color: 'var(--text-muted)' }}>
                      Shop Ledger
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '1.4rem', fontWeight: '800', color: l.payableAmount > 0 ? 'var(--error)' : 'var(--success)' }}>
                      ₹{l.payableAmount.toLocaleString('en-IN')}
                    </p>
                    {isSelected && <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>Active Selection</span>}
                  </div>
                </motion.div>
              );
            })}

            {activeLedgers.length === 0 && (
              <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <CheckCircle size={36} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                <p style={{ fontWeight: '600' }}>All clean! You do not owe any money to any shops.</p>
              </div>
            )}
          </div>

          {/* Benefits Section */}
          <div>
            <h3 style={{ marginBottom: '1.5rem', fontWeight: '600' }}>Why Pay Online?</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              {[
                { icon: <ShieldCheck size={20} />, title: 'Safe & Secure', desc: 'Powered by Stripe encryption' },
                { icon: <Clock size={20} />, title: 'Instant Updates', desc: 'Balance reflects immediately' },
                { icon: <Sparkles size={20} />, title: 'Auto Clear', desc: 'Account automatically deletes once all dues are fully paid' }
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                  }}
                >
                  <div style={{ color: 'var(--primary)', flexShrink: 0 }}>{item.icon}</div>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.95rem', marginBottom: '2px' }}>{item.title}</p>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Transaction Ledger History Section */}
          {selectedLedger && (
            <div style={{ marginTop: '3rem' }}>
              <h3 style={{ marginBottom: '1.5rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={20} style={{ color: 'var(--primary)' }} />
                Transaction Ledger History
              </h3>
              
              <div style={{ display: 'grid', gap: '0.8rem' }}>
                {transactions.filter(t => t.ownerId?._id === selectedLedger.ownerId).map((t) => {
                  const isCredit = t.type === 'credit';
                  return (
                    <motion.div
                      key={t._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        padding: '1rem 1.25rem',
                        borderRadius: '12px',
                        background: 'var(--glass)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '8px',
                          background: isCredit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isCredit ? 'var(--error)' : 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '1rem',
                        }}>
                          {isCredit ? '↑' : '↓'}
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.95rem', margin: 0 }}>
                            {t.description || (isCredit ? 'Credit Added' : 'Repayment')}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{
                          fontWeight: '800',
                          fontSize: '1.15rem',
                          color: isCredit ? 'var(--error)' : 'var(--success)',
                          margin: 0,
                        }}>
                          {isCredit ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </motion.div>
                  );
                })}

                {transactions.filter(t => t.ownerId?._id === selectedLedger.ownerId).length === 0 && (
                  <div className="glass-card" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transactions recorded yet for this shop.
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>

        {/* Right Column - Payment Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-card"
          style={{ padding: '2.5rem', position: 'sticky', top: '100px' }}
        >
          {selectedLedger ? (
            !showPayment ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                  <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    margin: '0 auto 1.5rem',
                  }}>
                    <CreditCard size={28} color="white" />
                  </div>
                  <h3 style={{ fontSize: '1.3rem', marginBottom: '0.5rem' }}>Pay {selectedLedger.ownerName}</h3>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Settle outstanding balance securely.
                  </p>
                </div>

                {/* Balance display */}
                <div style={{
                  padding: '1.5rem',
                  background: 'var(--surface)',
                  borderRadius: '16px',
                  marginBottom: '2rem',
                  border: '1px solid var(--glass-border)',
                  textAlign: 'center'
                }}>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Ledger Balance</span>
                  <h2 style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--error)', marginTop: '0.2rem' }}>
                    ₹{selectedLedger.payableAmount.toLocaleString('en-IN')}
                  </h2>
                </div>

                {selectedLedger.payableAmount > 0 ? (
                  <>
                    {/* Quick pay full */}
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handlePayFull}
                      className="btn btn-primary"
                      style={{
                        width: '100%',
                        padding: '16px',
                        marginBottom: '1.5rem',
                        fontSize: '1rem',
                      }}
                    >
                      <span>Clear Full: ₹{selectedLedger.payableAmount.toLocaleString('en-IN')}</span>
                      <ArrowRight size={18} />
                    </motion.button>

                    <div style={{
                      display: 'flex', alignItems: 'center', gap: '16px',
                      margin: '1.5rem 0', color: 'var(--text-muted)', fontSize: '0.85rem'
                    }}>
                      <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                      <span>or pay custom</span>
                      <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }} />
                    </div>

                    {/* Custom payment amount */}
                    <div style={{ display: 'flex', gap: '1rem' }}>
                      <div style={{ position: 'relative', flex: 1 }}>
                        <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input
                          type="number"
                          className="input-field"
                          style={{ paddingLeft: '36px' }}
                          placeholder="Enter amount"
                          value={paymentAmount}
                          onChange={(e) => setPaymentAmount(e.target.value)}
                          max={selectedLedger.payableAmount}
                          min={1}
                        />
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handlePayCustom}
                        className="btn btn-outline"
                        disabled={!paymentAmount || Number(paymentAmount) <= 0}
                        style={{ padding: '12px 24px' }}
                      >
                        Pay
                      </motion.button>
                    </div>

                    {/* Quick shortcuts */}
                    {selectedLedger.payableAmount > 500 && (
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        {[
                          Math.round(selectedLedger.payableAmount * 0.25),
                          Math.round(selectedLedger.payableAmount * 0.50),
                          Math.round(selectedLedger.payableAmount * 0.75),
                        ].filter(a => a > 0).map((amt) => (
                          <button
                            key={amt}
                            className="btn btn-outline"
                            style={{ padding: '6px 14px', fontSize: '0.8rem', borderRadius: '20px' }}
                            onClick={() => setPaymentAmount(amt)}
                          >
                            ₹{amt.toLocaleString('en-IN')}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                    <CheckCircle />
                    <span style={{ fontWeight: '600' }}>Balance completely cleared!</span>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                  <h3 style={{ fontSize: '1.3rem' }}>Complete Payment</h3>
                </div>

                <div style={{
                  padding: '1.2rem',
                  background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(139, 92, 246, 0.1))',
                  borderRadius: '12px',
                  marginBottom: '2rem',
                  border: '1px solid rgba(99, 102, 241, 0.2)',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Paying {selectedLedger.ownerName}</span>
                    <span style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--primary)' }}>
                      ₹{Number(paymentAmount).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {stripePromise ? (
                  <Elements stripe={stripePromise}>
                    <CheckoutForm
                      amount={paymentAmount}
                      ledgerId={selectedLedger.id}
                      publishableKey={selectedLedger.stripePublishableKey}
                      onSuccess={handlePaymentSuccess}
                      onCancel={() => setShowPayment(false)}
                    />
                  </Elements>
                ) : (
                  <div style={{
                    padding: '1.5rem',
                    background: 'rgba(239, 68, 68, 0.1)',
                    borderRadius: '12px',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                    textAlign: 'center',
                  }}>
                    <CreditCard size={32} style={{ marginBottom: '1rem', opacity: 0.5, color: 'var(--error)' }} />
                    <p style={{ color: 'var(--error)', fontWeight: '600', marginBottom: '0.5rem' }}>
                      Payments Unavailable
                    </p>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      This shopkeeper has not configured their payment keys. Please ask them to set up Stripe.
                    </p>
                  </div>
                )}
              </div>
            )
          ) : (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem 0' }}>
              <Store size={48} style={{ margin: '0 auto 1.5rem', opacity: 0.3 }} />
              <p>Select a shop account from the list to make a payment.</p>
            </div>
          )}
        </motion.div>
      </div>
      ) : (
        <div className="glass-card" style={{ padding: '2.5rem' }}>
          <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Clock size={28} style={{ color: 'var(--primary)' }} />
            <span className="gradient-text">Complete Transaction History</span>
            {transactions.length > 0 && (
              <button className="btn btn-outline" onClick={handleDownloadMyPDF} style={{ marginLeft: 'auto', padding: '8px 16px', fontSize: '0.85rem' }}>
                <FileDown size={16} style={{ marginRight: '6px' }} />
                <span>Download PDF</span>
              </button>
            )}
          </h2>
          
          <div style={{ display: 'grid', gap: '0.8rem' }}>
            {transactions.map((t) => {
              const isCredit = t.type === 'credit';
              return (
                <motion.div
                  key={t._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: '1rem 1.25rem',
                    borderRadius: '12px',
                    background: 'var(--glass)',
                    border: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '8px',
                      background: isCredit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: isCredit ? 'var(--error)' : 'var(--success)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: '700',
                      fontSize: '1.2rem',
                    }}>
                      {isCredit ? '↑' : '↓'}
                    </div>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '1rem', margin: 0 }}>
                        {t.description || (isCredit ? 'Credit Added' : 'Repayment')}
                      </p>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        Shop: <strong>{t.ownerName}</strong> &bull; {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{
                      fontWeight: '800',
                      fontSize: '1.2rem',
                      color: isCredit ? 'var(--error)' : 'var(--success)',
                      margin: 0,
                    }}>
                      {isCredit ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                    </p>
                  </div>
                </motion.div>
              );
            })}

            {transactions.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                No past transactions found.
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 992px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerDashboard;
