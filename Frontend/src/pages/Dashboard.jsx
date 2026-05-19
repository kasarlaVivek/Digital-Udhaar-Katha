import React from 'react';
import { useAuth } from '../context/AuthContext';
import OwnerDashboard from './OwnerDashboard';
import CustomerDashboard from './CustomerDashboard';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) return null;

  return user.role === 'owner' ? <OwnerDashboard /> : <CustomerDashboard />;
};

export default Dashboard;
