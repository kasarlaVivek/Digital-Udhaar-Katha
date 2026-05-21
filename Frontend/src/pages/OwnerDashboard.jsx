import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Users, CreditCard, ArrowUpRight, ArrowDownLeft, DollarSign, Trash2, Mail, Phone, Lock, User, IndianRupee, Settings, Eye, EyeOff, Clock } from 'lucide-react';
import API from '../api/axios';
import toast from 'react-hot-toast';

const OwnerDashboard = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isStripeModalOpen, setIsStripeModalOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', password: '', phone: '', payableAmount: 0, description: '' });
  const [stripeKeys, setStripeKeys] = useState({ stripePublishableKey: '', stripeSecretKey: '' });
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [selectedHistoryCustomer, setSelectedHistoryCustomer] = useState(null);
  const [customerTransactions, setCustomerTransactions] = useState([]);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState('customers'); // 'customers' or 'transactions'
  const [allTransactions, setAllTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const fetchAllTransactions = async () => {
    setLoadingTransactions(true);
    try {
      const { data } = await API.get('/transactions');
      setAllTransactions(data.data);
    } catch (error) {
      toast.error('Failed to fetch transactions');
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'transactions') {
      fetchAllTransactions();
    }
  }, [activeTab]);

  const handleViewHistory = async (customer) => {
    setSelectedHistoryCustomer(customer);
    try {
      const { data } = await API.get(`/transactions?customerId=${customer._id}`);
      setCustomerTransactions(data.data);
      setIsHistoryModalOpen(true);
    } catch (error) {
      toast.error('Failed to fetch transaction history');
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const { data } = await API.get('/owner/customers');
      setCustomers(data.data);
    } catch (error) {
      toast.error('Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    setAddingCustomer(true);
    try {
      await API.post('/owner/customers', newCustomer);
      toast.success('Customer added & notification email sent!');
      setIsAddModalOpen(false);
      setNewCustomer({ name: '', email: '', password: '', phone: '', payableAmount: 0, description: '' });
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add customer');
    } finally {
      setAddingCustomer(false);
    }
  };

  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [debtModalMode, setDebtModalMode] = useState('add'); // 'add' or 'repay'
  const [selectedDebtCustomer, setSelectedDebtCustomer] = useState(null);
  const [debtAmount, setDebtAmount] = useState('');
  const [debtDescription, setDebtDescription] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteCustomer, setSelectedDeleteCustomer] = useState(null);

  const openDebtModal = (customer, mode) => {
    setSelectedDebtCustomer(customer);
    setDebtModalMode(mode);
    setDebtAmount('');
    setDebtDescription('');
    setIsDebtModalOpen(true);
  };

  const openDeleteModal = (customer) => {
    setSelectedDeleteCustomer(customer);
    setIsDeleteModalOpen(true);
  };

  const submitDebtUpdate = async (e) => {
    e.preventDefault();
    if (!debtAmount || isNaN(debtAmount) || parseFloat(debtAmount) <= 0) {
      toast.error('Please enter a valid positive amount');
      return;
    }
    const finalAmount = debtModalMode === 'add' ? parseFloat(debtAmount) : -parseFloat(debtAmount);
    
    try {
      const response = await API.put(`/owner/customers/${selectedDebtCustomer._id}/debt`, { 
        amount: finalAmount,
        description: debtDescription 
      });
      if (response.data.accountDeleted) {
        toast.success('Customer balance fully cleared — ledger entry removed!');
      } else {
        toast.success('Balance updated & customer notified!');
      }
      setIsDebtModalOpen(false);
      setDebtAmount('');
      setDebtDescription('');
      fetchCustomers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  };

  const submitDeleteCustomer = async () => {
    try {
      await API.delete(`/owner/customers/${selectedDeleteCustomer._id}`);
      toast.success('Customer deleted');
      setIsDeleteModalOpen(false);
      fetchCustomers();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const handleUpdateStripeKeys = async (e) => {
    e.preventDefault();
    try {
      await API.put('/owner/stripe-keys', stripeKeys);
      toast.success('Stripe keys updated!');
      setIsStripeModalOpen(false);
    } catch (error) {
      toast.error('Failed to update Stripe keys');
    }
  };

  const generatePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 10; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCustomer({ ...newCustomer, password: pwd });
  };

  const filteredCustomers = customers.filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.phone && c.phone.includes(searchTerm))
  );

  const totalUdhaar = customers.reduce((acc, curr) => acc + (curr.payableAmount || 0), 0);

  return (
    <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
      {/* Stats Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem', marginBottom: '3rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ padding: '12px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '12px', color: 'var(--primary)' }}>
            <IndianRupee size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Udhaar</p>
            <h3 style={{ fontSize: '1.5rem' }}>₹{totalUdhaar.toLocaleString('en-IN')}</h3>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ padding: '12px', background: 'rgba(236, 72, 153, 0.1)', borderRadius: '12px', color: 'var(--secondary)' }}>
            <Users size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Active Customers</p>
            <h3 style={{ fontSize: '1.5rem' }}>{customers.length}</h3>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card" style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer' }}
          onClick={() => setIsStripeModalOpen(true)}
        >
          <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderRadius: '12px', color: 'var(--accent)' }}>
            <CreditCard size={24} />
          </div>
          <div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Payment Settings</p>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent)' }}>Configure Stripe →</h3>
          </div>
        </motion.div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.75rem' }}>
        <button
          className={`btn ${activeTab === 'customers' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('customers')}
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem' }}
          id="customers-tab"
        >
          <Users size={16} style={{ marginRight: '6px' }} />
          <span>Active Customers</span>
        </button>
        <button
          className={`btn ${activeTab === 'transactions' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() => setActiveTab('transactions')}
          style={{ padding: '10px 20px', borderRadius: '8px', fontSize: '0.95rem' }}
          id="global-transactions-tab"
        >
          <Clock size={16} style={{ marginRight: '6px' }} />
          <span>Global Activity Log</span>
        </button>
      </div>

      {activeTab === 'customers' ? (
        <>
          {/* Actions & Search */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem' }}>
              <span className="gradient-text">Customers</span>
            </h2>
            <div style={{ display: 'flex', gap: '1rem', flex: 1, maxWidth: '600px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)} id="add-customer-btn">
                <Plus size={18} />
                <span>New Customer</span>
              </button>
            </div>
          </div>

          {/* Customer List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card" style={{ overflow: 'hidden' }}
          >
            {loading ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '1.2rem' }}>Loading customers...</div>
              </div>
            ) : filteredCustomers.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Users size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No customers found. Add your first customer to get started!</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--glass-border)' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Phone</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Balance</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.map((customer, index) => (
                      <motion.tr
                        key={customer._id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s', cursor: 'pointer' }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => handleViewHistory(customer)}
                      >
                        <td style={{ padding: '1.2rem 1.5rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{
                              width: '40px', height: '40px', borderRadius: '12px',
                              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: '700', fontSize: '1rem', color: 'white', flexShrink: 0
                            }}>
                              {customer.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <div style={{ fontWeight: '600' }}>{customer.name}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customer.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)' }}>{customer.phone || '—'}</td>
                        <td style={{ padding: '1.2rem 1.5rem' }}>
                          <span style={{
                            color: customer.payableAmount > 0 ? 'var(--error)' : 'var(--success)',
                            fontWeight: '700',
                            fontSize: '1.1rem',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            background: customer.payableAmount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          }}>
                            ₹{(customer.payableAmount || 0).toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td style={{ padding: '1.2rem 1.5rem' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                              onClick={(e) => { e.stopPropagation(); openDebtModal(customer, 'add'); }}
                            >
                              <ArrowUpRight size={14} /> Add
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--success)' }}
                              onClick={(e) => { e.stopPropagation(); openDebtModal(customer, 'repay'); }}
                            >
                              <ArrowDownLeft size={14} /> Repaid
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--primary)' }}
                              onClick={(e) => { e.stopPropagation(); handleViewHistory(customer); }}
                            >
                              <Clock size={14} /> History
                            </button>
                            <button
                              className="btn btn-outline"
                              style={{ padding: '6px 12px', fontSize: '0.8rem', color: 'var(--error)' }}
                              onClick={(e) => { e.stopPropagation(); openDeleteModal(customer); }}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      ) : (
        <>
          {/* Global Activity Log */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 style={{ fontSize: '1.8rem' }}>
              <span className="gradient-text">Global Activity Log</span>
            </h2>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card" style={{ overflow: 'hidden' }}
            id="global-activity-card"
          >
            {loadingTransactions ? (
              <div style={{ padding: '4rem', textAlign: 'center' }}>
                <div className="gradient-text" style={{ fontSize: '1.2rem' }}>Loading transactions...</div>
              </div>
            ) : allTransactions.length === 0 ? (
              <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Clock size={48} style={{ opacity: 0.2, marginBottom: '1rem' }} />
                <p>No transactions recorded yet.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                  <thead style={{ background: 'var(--surface)', borderBottom: '1px solid var(--glass-border)' }}>
                    <tr>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Customer</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Action/Description</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Amount</th>
                      <th style={{ padding: '1rem 1.5rem', fontWeight: '600', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Date & Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allTransactions.map((t, index) => {
                      const isCredit = t.type === 'credit';
                      const custName = t.customerName || (t.customerId ? t.customerId.name : 'Deleted Customer');
                      const custEmail = t.customerEmail || (t.customerId ? t.customerId.email : '');
                      
                      return (
                        <motion.tr
                          key={t._id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.03 }}
                          style={{ borderBottom: '1px solid var(--glass-border)', transition: 'background 0.2s' }}
                          onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                          onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        >
                          <td style={{ padding: '1.2rem 1.5rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <div style={{
                                width: '36px', height: '36px', borderRadius: '10px',
                                background: 'var(--surface)',
                                border: '1px solid var(--glass-border)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontWeight: '700', fontSize: '0.9rem', color: 'var(--text-muted)', flexShrink: 0
                              }}>
                                {custName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{custName}</div>
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{custEmail || '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '1.2rem 1.5rem' }}>
                            <div style={{ fontWeight: '500', fontSize: '0.95rem' }}>{t.description || (isCredit ? 'Credit Added' : 'Repayment')}</div>
                          </td>
                          <td style={{ padding: '1.2rem 1.5rem' }}>
                            <span style={{
                              color: isCredit ? 'var(--error)' : 'var(--success)',
                              fontWeight: '700',
                              fontSize: '1rem',
                            }}>
                              {isCredit ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                            </span>
                          </td>
                          <td style={{ padding: '1.2rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}

      {/* Add Customer Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsAddModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}
            >
              <h3 style={{ marginBottom: '0.5rem', fontSize: '1.5rem' }}>Add New Customer</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                The customer will receive login credentials via email.
              </p>
              <form onSubmit={handleAddCustomer}>
                <div className="input-group">
                  <label>Full Name</label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      name="customerName"
                      autoComplete="name"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      placeholder="Customer name"
                      value={newCustomer.name}
                      onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      placeholder="customer@email.com"
                      value={newCustomer.email}
                      onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>Password</span>
                    <button type="button" onClick={generatePassword} style={{ background: 'none', color: 'var(--primary)', fontSize: '0.8rem', fontWeight: '600', cursor: 'pointer', padding: 0 }}>
                      Auto-generate
                    </button>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field"
                      style={{ paddingLeft: '40px', paddingRight: '40px' }}
                      placeholder="Min 6 characters"
                      value={newCustomer.password}
                      onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 0, border: 'none' }}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="input-group">
                  <label>Phone Number</label>
                  <div style={{ position: 'relative' }}>
                    <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      placeholder="+91 XXXXX XXXXX"
                      value={newCustomer.phone}
                      onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    />
                  </div>
                </div>
                <div className="input-group">
                  <label>Initial Debt (₹)</label>
                  <div style={{ position: 'relative' }}>
                    <IndianRupee size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="number"
                      className="input-field"
                      style={{ paddingLeft: '40px' }}
                      placeholder="0"
                      value={newCustomer.payableAmount}
                      onChange={(e) => setNewCustomer({ ...newCustomer, payableAmount: e.target.value })}
                      min="0"
                    />
                  </div>
                </div>
                {newCustomer.payableAmount > 0 && (
                  <div className="input-group">
                    <label>Initial Note / Description</label>
                    <input
                      type="text"
                      className="input-field"
                      placeholder="e.g. Rice, Dal, Tea box"
                      value={newCustomer.description}
                      onChange={(e) => setNewCustomer({ ...newCustomer, description: e.target.value })}
                    />
                  </div>
                )}
                <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }} disabled={addingCustomer}>
                    {addingCustomer ? (
                      <span>Sending Email...</span>
                    ) : (
                      <>
                        <Mail size={16} />
                        <span>Save & Notify</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Stripe Keys Modal */}
      <AnimatePresence>
        {isStripeModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsStripeModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '480px', padding: '2.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                <Settings size={24} className="gradient-text" />
                <h3 style={{ fontSize: '1.5rem' }}>Stripe Payment Settings</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Configure your Stripe keys so customers can pay you online.
              </p>
              <form onSubmit={handleUpdateStripeKeys}>
                <div className="input-group">
                  <label>Publishable Key</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="pk_test_..."
                    value={stripeKeys.stripePublishableKey}
                    onChange={(e) => setStripeKeys({ ...stripeKeys, stripePublishableKey: e.target.value })}
                    required
                  />
                </div>
                <div className="input-group">
                  <label>Secret Key</label>
                  <input
                    type="password"
                    className="input-field"
                    placeholder="sk_test_..."
                    value={stripeKeys.stripeSecretKey}
                    onChange={(e) => setStripeKeys({ ...stripeKeys, stripeSecretKey: e.target.value })}
                    required
                  />
                </div>
                <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px', marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.8rem', color: 'var(--warning)', margin: 0 }}>
                    ⚠️ Keep your secret key safe. Never share it with anyone.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsStripeModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                    <CreditCard size={16} />
                    <span>Save Keys</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Customer History Modal */}
        {isHistoryModalOpen && selectedHistoryCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsHistoryModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', maxHeight: '80vh', overflowY: 'auto' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                <Clock size={24} className="gradient-text" />
                <h3 style={{ fontSize: '1.5rem' }}>Ledger History</h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Chronological list of credits and payments for <strong>{selectedHistoryCustomer.name}</strong>.
              </p>

              <div style={{ display: 'grid', gap: '0.8rem', marginBottom: '1.5rem' }}>
                {customerTransactions.map((t) => {
                  const isCredit = t.type === 'credit';
                  return (
                    <div
                      key={t._id}
                      style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        background: 'var(--surface)',
                        border: '1px solid var(--glass-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '8px',
                          background: isCredit ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: isCredit ? 'var(--error)' : 'var(--success)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                        }}>
                          {isCredit ? '↑' : '↓'}
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', fontSize: '0.9rem', margin: 0 }}>
                            {t.description || (isCredit ? 'Credit Added' : 'Repayment')}
                          </p>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                      <div>
                        <p style={{
                          fontWeight: '800',
                          fontSize: '1.1rem',
                          color: isCredit ? 'var(--error)' : 'var(--success)',
                          margin: 0,
                        }}>
                          {isCredit ? '+' : '-'} ₹{t.amount.toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {customerTransactions.length === 0 && (
                  <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    No transaction entries recorded yet for this customer.
                  </div>
                )}
              </div>

              <button className="btn btn-outline" style={{ width: '100%' }} onClick={() => setIsHistoryModalOpen(false)}>
                Close History
              </button>
            </motion.div>
          </div>
        )}

        {/* Debt Update Modal */}
        {isDebtModalOpen && selectedDebtCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsDebtModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0.5rem' }}>
                {debtModalMode === 'add' ? (
                  <ArrowUpRight size={24} style={{ color: 'var(--error)' }} />
                ) : (
                  <ArrowDownLeft size={24} style={{ color: 'var(--success)' }} />
                )}
                <h3 style={{ fontSize: '1.5rem' }}>
                  {debtModalMode === 'add' ? 'Add Credit / Debt' : 'Record Repayment'}
                </h3>
              </div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                Update balance for <strong>{selectedDebtCustomer.name}</strong>.
              </p>

              <form onSubmit={submitDebtUpdate}>
                <div className="input-group">
                  <label>Amount (₹)</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="Enter amount"
                    value={debtAmount}
                    onChange={(e) => setDebtAmount(e.target.value)}
                    required
                    min="1"
                  />
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                  {[100, 500, 1000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '0.8rem', flex: 1 }}
                      onClick={() => setDebtAmount(val.toString())}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>

                {/* Note / Description */}
                <div className="input-group" style={{ marginBottom: '1.5rem' }}>
                  <label>Note / Description</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder={debtModalMode === 'add' ? "e.g. Rice, Dal, Tea packets" : "e.g. Cash, GPay, PhonePe"}
                    value={debtDescription}
                    onChange={(e) => setDebtDescription(e.target.value)}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsDebtModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" style={{ flex: 1, background: debtModalMode === 'add' ? 'var(--error)' : 'var(--success)' }}>
                    <span>Submit</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Delete Customer Modal */}
        {isDeleteModalOpen && selectedDeleteCustomer && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}
            onClick={(e) => { if (e.target === e.currentTarget) setIsDeleteModalOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card"
              style={{ width: '100%', maxWidth: '400px', padding: '2.5rem', textAlign: 'center' }}
            >
              <div style={{
                width: '56px', height: '56px', borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.1)',
                color: 'var(--error)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 1.5rem',
              }}>
                <Trash2 size={28} />
              </div>
              <h3 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Delete Customer?</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                Are you sure you want to remove <strong>{selectedDeleteCustomer.name}</strong> from your ledger? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setIsDeleteModalOpen(false)}>
                  Cancel
                </button>
                <button type="button" className="btn btn-primary" style={{ flex: 1, background: 'var(--error)' }} onClick={submitDeleteCustomer}>
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default OwnerDashboard;
