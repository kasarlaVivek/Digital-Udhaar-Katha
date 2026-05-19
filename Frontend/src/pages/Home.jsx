import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Shield, Zap, TrendingUp, Users } from 'lucide-react';

const Home = () => {
  return (
    <div className="container" style={{ paddingTop: '4rem', paddingBottom: '4rem' }}>
      <section style={{ textAlign: 'center', marginBottom: '6rem' }}>
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{ fontSize: '4rem', fontWeight: '800', lineHeight: '1.1', marginBottom: '1.5rem' }}
        >
          Manage Your <span className="gradient-text">Udhaar</span> <br /> 
          with Confidence
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          style={{ fontSize: '1.25rem', color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 2.5rem' }}
        >
          The digital ledger for modern shopkeepers. Track credits, manage customers, and get paid faster with integrated payments.
        </motion.p>
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}
        >
          <Link to="/register" className="btn btn-primary" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Start Free Trial
          </Link>
          <Link to="/login" className="btn btn-outline" style={{ padding: '16px 32px', fontSize: '1.1rem' }}>
            Live Demo
          </Link>
        </motion.div>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
        {[
          { icon: <Shield size={32} />, title: 'Secure Ledger', desc: 'Your data is encrypted and backed up in the cloud.' },
          { icon: <Zap size={32} />, title: 'Instant Updates', desc: 'Track payments and debts in real-time across devices.' },
          { icon: <Users size={32} />, title: 'Customer Portals', desc: 'Let customers view their own balance and pay online.' },
          { icon: <TrendingUp size={32} />, title: 'Insightful Analytics', desc: 'Get reports on your cash flow and outstanding credits.' }
        ].map((feature, i) => (
          <motion.div 
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="glass-card"
            style={{ padding: '2rem' }}
          >
            <div style={{ color: 'var(--primary)', marginBottom: '1.5rem' }}>{feature.icon}</div>
            <h3 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{feature.title}</h3>
            <p style={{ color: 'var(--text-muted)' }}>{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default Home;
