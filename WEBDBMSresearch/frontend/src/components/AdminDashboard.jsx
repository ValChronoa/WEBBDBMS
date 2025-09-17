import React from 'react';
import UserAdmin from './UserAdmin';

export default function AdminDashboard() {
  return (
    <div className="container mx-auto px-4">
      <h2 className="text-2xl font-semibold mb-6 text-yellow-400">User Accounts</h2>
      <UserAdmin />
    </div>
  );
}
