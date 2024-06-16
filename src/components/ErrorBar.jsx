import React from 'react';
import '../styles.css';

const ErrorBar = ({ message, onClose }) => {
  if (!message) return null;

  return (
    <div className="errorBar">
      <span className="message">{message}</span>
      <button onClick={onClose} className="closeButton">X</button>
    </div>
  );
};

export default ErrorBar;
