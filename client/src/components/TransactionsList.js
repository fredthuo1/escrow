import React from 'react';
import { Link } from 'react-router-dom';

const TransactionsList = ({ transactions }) => {
    if (transactions.length === 0) {
        return <div className="transactions-list">No transactions available.</div>;
    }

    return (
        <div className="transactions-list">
            {transactions.map(transaction => (
                <div key={transaction.id} className="transaction-item">
                    <span>{transaction.date}</span>
                    <span>{transaction.amount} BTC</span>
                    <span>{transaction.status}</span>
                    <Link to={`/transaction/${transaction.id}`}>View Details</Link>
                </div>
            ))}
        </div>
    );
};

export default TransactionsList;