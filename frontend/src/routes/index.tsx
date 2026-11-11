import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Dashboard } from '../pages/Dashboard';
import { Sessions } from '../pages/Sessions';
import { Groups } from '../pages/Groups'; 
import { Payments } from '../pages/Payments';
import { Reports } from '../pages/Reports';
import { Packages } from '../pages/Packages';
import { Settings } from '../pages/Settings';

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="sessions" element={<Sessions />} />
        <Route path="groups" element={<Groups />} />
        <Route path="payments" element={<Payments />} />
        <Route path="reports" element={<Reports />} />
        <Route path="packages" element={<Packages />} />
        <Route path="settings" element={<Settings />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};

