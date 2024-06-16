// StatusBar.jsx
import React from 'react';

const StatusBar = ({ throttleValue, handleThrottleChange, totalCount, filteredCount, totalTickers, selectedTickers, subscribedTickers, lastUpdate, updatedCount, deletedCount, connectionStatus, subscriptionStatus }) => {
  const getStatusStyle = (status) => ({
    color: status === 'ON' ? 'green' : 'red',
    fontWeight: 'bold'
  });

  return (
    <div className="status-bar">      
      <div className="status-item">
        <span className="status-label">
          <label className='status-label' htmlFor="throttle-dropdown">Throttle Rate (ms): </label>
        </span>
        <select id="throttle-dropdown" value={throttleValue} onChange={handleThrottleChange}>          
          <option value="100">100</option>
          <option value="500">500</option>
          <option value="1000">1000</option>
          <option value="2000">2000</option>
          <option value="5000">5000</option>
        </select>
      </div>
      <div className="status-item"><span className="status-label">Total Rows:</span>{totalCount}</div>
      <div className="status-item"><span className="status-label">Filtered Rows:</span>{filteredCount}</div>
      <div className="status-item"><span className="status-label">Total Tickers:</span>{totalTickers}</div>
      <div className="status-item"><span className="status-label">Selected Tickers:</span>{selectedTickers}</div>
      <div className="status-item"><span className="status-label">Subscribed Tickers:</span>{subscribedTickers}</div>
      <div className="status-item"><span className="status-label">Last Update:</span>{lastUpdate}</div>
      <div className="status-item"><span className="status-label">Updated Records:</span>{updatedCount}</div>
      <div className="status-item"><span className="status-label">Deleted Records:</span>{deletedCount}</div>            
      <div className="status-item"><span className="status-label">Connection: <span style={getStatusStyle(connectionStatus)}>{connectionStatus}</span></span></div>
      <div className="status-item"><span className="status-label">Subscription: <span style={getStatusStyle(subscriptionStatus)}>{subscriptionStatus}</span></span></div>
    </div>
  );
};

export default StatusBar;