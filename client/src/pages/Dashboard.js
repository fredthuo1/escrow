import React from 'react';
import Notifications from '../components/Notifications';
import QuickActions from '../components/QuickActions';
import { mockTransactions, mockNotifications } from '../data/mockData';
import TransactionsList from '../components/TransactionsList';

const Dashboard = () => {
    const transactions = mockTransactions;
    const notifications = mockNotifications;

    return (
        <div className="page-container">
            <h1 className="page-heading">Dashboard</h1>

            <div className="dashboard-section recent-transactions">
                <h2>Recent Transactions</h2>
                <TransactionsList transactions={transactions} />
            </div>

            <div className="dashboard-section quick-actions">
                <QuickActions />
            </div>

            <div className="dashboard-section notifications">
                <Notifications notifications={notifications} />
            </div>
        </div>
    );
};

export default Dashboard;
