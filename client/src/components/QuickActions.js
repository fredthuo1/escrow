import React from 'react';
import { Link } from 'react-router-dom';

const QuickActions = () => {
    return (
        <div className="quick-actions">
            <Link to="/new-transaction">Start New Transaction</Link>
            <Link to="/profile">Edit Profile</Link>
        </div>
    );
};

export default QuickActions;