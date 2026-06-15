import React from 'react';

export default function NotificationContainer({ notifications, onClose }) {
  return (
    <div id="notification-container" className="notification-container">
      {notifications.map((note) => (
        <div key={note.id} className={`notification-toast ${note.type}`}>
          <span>{note.message}</span>
          <button 
            className="notification-close" 
            onClick={() => onClose(note.id)}
            aria-label="Close notification"
          >
            &times;
          </button>
        </div>
      ))}
    </div>
  );
}
