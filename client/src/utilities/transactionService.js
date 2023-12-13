import { mockTransactions } from '../data/mockData';

export const fetchTransactionById = (id) => {
    const numericId = Number(id);
    console.log("Searching for transaction with ID: ", numericId);

    const transaction = mockTransactions.find(transaction => transaction.id === numericId);
    console.log("Found transaction: ", transaction);

    return transaction;
};
