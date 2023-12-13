import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { fetchTransactionById } from '../utilities/transactionService';

const TransactionDetail = () => {
    const [transaction, setTransaction] = useState(null);
    const { id } = useParams();

    useEffect(() => {
        const fetchedTransaction = fetchTransactionById(id);
        setTransaction(fetchedTransaction);
    }, [id]);

    if (!transaction) {
        return <div>Loading...</div>;
    }

    return (
        <div className="page-container">
            <h1 className="page-heading">Transaction Detail</h1>
            <div className="transaction-detail">
                <p><strong>Transaction ID:</strong> {transaction.id}</p>
                <p><strong>Date:</strong> {transaction.date}</p>
                <p><strong>Amount:</strong> {transaction.amount} BTC</p>
                <p><strong>Status:</strong> {transaction.status}</p>
            </div>
        </div>
    );
};

export default TransactionDetail;
