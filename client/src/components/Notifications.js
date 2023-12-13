import React from 'react';

const Notifications = ({ notifications }) => {
    return (
        <div className="notifications">
            {notifications.map((notification, index) => (
                <div key={index} className="notification-item">
                    {notification.message}
                </div>
            ))}
        </div>
    );
};

export default Notifications;