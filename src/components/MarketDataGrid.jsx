import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { throttle } from 'lodash';
import { MultiSelect } from 'react-multi-select-component';
import StatusBar from './StatusBar';
import startIcon from '../assets/start.svg';
import stopIcon from '../assets/stop.svg';
import resetIcon from '../assets/reset.svg';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import '../styles.css';


const MarketDataGrid = () => {
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
  const [rowData, setRowData] = useState([]);
  const [columnDefs, setColumnDefs] = useState([]);  
  const [options, setOptions] = useState([]);
  const [selected, setSelected] = useState([]);
  const [throttleValue, setThrottleValue] = useState(`${process.env.REACT_APP_THROTTLE_INTERVAL_DEFAULT}`);
  const gridApiRef = useRef(null);
  const socketRef = useRef(null);
  const setupCompleteRef = useRef(false);
  const initialDataReceivedRef = useRef(false);
  const columnsSetRef = useRef(false);  
  const [statusInfo, setStatusInfo] = useState({
    totalCount: 0,
    filteredCount: 0,
    totalTickers: 0,
    selectedTickers: 0,
    subscribedTickers: 0,
    lastUpdate: new Date().toLocaleTimeString(),
    updatedCount: 0,
    deletedCount: 0,
    connectionStatus: 'OFF',
    subscriptionStatus: 'OFF'
  });
  
  // function to merge websocket data updates
  const mergeUpdates = useCallback((currentData, updates) => {
    const dataMap = new Map(currentData.map(item => [item.Id, { ...item }]));
    let updatedCount = 0;
    let deletedCount = 0;
    const updateTransactions = [];
  
    updates.forEach(update => {
      if (update?.Id !== undefined) {
        const existingItem = dataMap.get(update.Id);
        const updateColumns = [];
        
        // Check if the update should mark the item as deleted and if yes mark for deletion by setting isActive to false
        if (update.Name === null || update.Name === '') {
          if (existingItem) {
            dataMap.set(update.Id, { ...existingItem, isActive: false });
            updateTransactions.push({ ...existingItem, isActive: false });
            deletedCount++;
          }
        } else {
          
          // Add or update item
          if (existingItem) {            
            Object.keys(update).forEach(key => {
              if (existingItem[key] !== update[key]) {
                updateColumns.push(key);
                dataMap.set(update.Id, { ...existingItem, ...update, isActive: true });                
              }
            });            
            
            if (gridApiRef.current) {
              gridApiRef.current.flashCells({ rowNodes: [gridApiRef.current.getRowNode(update.Id)], columns: updateColumns });
            }
            updateTransactions.push({ ...existingItem, ...update, isActive: true });
          } else {            
            dataMap.set(update.Id, { ...update, isActive: true });
            updateTransactions.push({ ...update, isActive: true });
          }
          updatedCount++;
        }
      }
    });
  
    const newData = Array.from(dataMap.values());

    setStatusInfo(prevState => ({
      ...prevState,
      totalCount: newData.length,
      lastUpdate: new Date().toLocaleTimeString(),
      updatedCount: updatedCount,
      deletedCount: deletedCount
    }));

    // Apply the transactions asynchronously
    if (gridApiRef.current) {
      gridApiRef.current.applyTransactionAsync({update: updateTransactions });
    }

    return newData;
  }, []);

  // function to throttle websocket updates
  const throttledSetRowData = useRef(null);
  useEffect(() => {
    throttledSetRowData.current = throttle((data) => {
      setRowData((prevData) => mergeUpdates(prevData, data));
    }, throttleValue);

    return () => {
      if (throttledSetRowData.current) {
        throttledSetRowData.current.cancel();
      }
    };
  }, [throttleValue, mergeUpdates]);

  const handleThrottleChange = (event) => {
    const newThrottleValue = parseInt(event.target.value, 10);
    console.log('Throttle value changed to: ', newThrottleValue);
    setThrottleValue(newThrottleValue);
  };
  
  // websocket setup function
  const setupWebSocket = () => {
    console.log('Setting up WebSocket');
    const socket = new WebSocket(`${process.env.REACT_APP_WS_API_URL}`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log('WebSocket connection established successfully');
      setStatusInfo(prevState => ({
        ...prevState,
        connectionStatus: 'ON'
      }));
    };

    socket.onmessage = (event) => {
      console.log('WebSocket onmessage...');
      try {
        const data = JSON.parse(event.data);
        if (!initialDataReceivedRef.current && Array.isArray(data)) {
          const options = data.map(item => ({ label: item.Name, value: item.Id }));
          setOptions(options);
          initialDataReceivedRef.current = true;

          // Set the total count of options
          setStatusInfo(prevState => ({
            ...prevState,
            totalTickers: options.length,
            totalCount: 0,
            selectedTickers: 0,
            subscribedTickers: 0
          }));
          console.log('Received INITIAL data:', data.length);
        } else {
          if (!columnsSetRef.current && data.length) {
            const keys = Object.keys(data[0]);
            const columns = keys.map(key => ({
              headerName: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
              field: key,
              sortable: true,
              filter: true,
              cellClassRules: {
                'inactive-row': (params) => !params.data.isActive
              }
            }));

            const rowNumberColumn = {
              headerName: "#",
              width: 70,
              valueGetter: "node.rowIndex + 1",
              sortable: false,
              filter: false
            };

            const isActiveColumn = {
              headerName: "Is Active",
              field: "isActive",
              sortable: true,
              filter: true,
            };

            setColumnDefs([rowNumberColumn, ...columns, isActiveColumn]);
            columnsSetRef.current = true;
            console.log('Received INITIAL Subscribed data:', data.length);
          }                  
          throttledSetRowData.current(data);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    };

    socket.onclose = (event) => {
      console.log('WebSocket connection closed:', event);
      setStatusInfo(prevState => ({
        ...prevState,
        connectionStatus: 'OFF',
        subscriptionStatus: 'OFF'
      }));
    };

    socket.onerror = (error) => {
      console.error('WebSocket error:', error);
      setStatusInfo(prevState => ({
        ...prevState,
        connectionStatus: 'OFF',
        subscriptionStatus: 'OFF'
      }));
    };
  };

  useEffect(() => {
    if (!setupCompleteRef.current) {
      setupWebSocket();
      setupCompleteRef.current = true;
    }

    const currentThrottledSetRowData = throttledSetRowData.current;

    return () => {
      if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
        console.log('Cleaning up WebSocket connection.');
        socketRef.current.close();
        currentThrottledSetRowData.cancel();
      }
    };
  }, [throttledSetRowData]);

  const getRowId = (params) => params.data.Id;  

  const onGridReady = (params) => {
    gridApiRef.current = params.api;
    updateFilteredCount(params.api); // Update the filtered count when the grid is ready
  };

  const updateFilteredCount = (api) => {
    const filteredCount = api.getDisplayedRowCount();
    const filterModel = api.getFilterModel();
    const hasFilters = Object.keys(filterModel).length > 0;
  
    setStatusInfo(prevState => ({
      ...prevState,
      filteredCount: hasFilters ? filteredCount : 0
    }));
  };

  const autoSizeStrategy = {
    type: 'fitCellContents'
  };

  // start button logic (send subscribe request to the server for the currently selected items)
  const handleStart = () => {
    if (socketRef.current && selected.length > 0) {
      const productIds = selected.map(option => option.value);      
      const message = JSON.stringify({ type: 'subscribe', product_ids: productIds });
      console.log('Sending subscribe request for product_ids: ' + productIds.length);
      
      socketRef.current.send(message);
      setStatusInfo(prevState => ({
        ...prevState,        
        subscriptionStatus:'ON',
        subscribedTickers: productIds.length
      }));
    }
  };

  // stop button logic (send un-subscribe request to the server for the currently selected items)
  const handleStop = () => {
    if (socketRef.current) {
      const productIds = selected.map(option => option.value);      
      const message = JSON.stringify({ type: 'unsubscribe', product_ids: productIds });
      console.log('Sending un-subscribe request for product_ids: ' + productIds.length);
      
      socketRef.current.send(message);
      setStatusInfo(prevState => ({
        ...prevState,        
        subscriptionStatus:'OFF',
        subscribedTickers: 0
      }));
    }
  };

  // reset button logic (close current websocket connection, clear the data grid and dropdown, re-establish websocket connection with latest product_ids populated in the dropdown)
  const handleReset = async () => {    
      if (socketRef.current) {
        console.log('Resetting WebSocket connection.');
        socketRef.current.close();
        
        // Adding a delay to ensure the previous connection is closed before reconnecting
        await delay(1000);
        setRowData([]); // Clear the data grid
        setSelected([]); // Clear the multi-select dropdown
        setOptions([]); // Clear the options for multi-select
        columnsSetRef.current = false; // Reset the columns setup flag
        initialDataReceivedRef.current = false; // Reset the initial data flag
        
        // re-establish websocket connection
        setupWebSocket();
      }
  };
  
  // Update the count of selected items upon selected event
  const handleSelectChange = (selectedOptions) => {    
    setSelected(selectedOptions);
    setStatusInfo(prevState => ({
      ...prevState,
      selectedTickers: selectedOptions.length
    }));
  };  

  return (
    <div className="ag-theme-alpine">
      <h1>Market Data Simulator</h1>
      <div className="controls multi-select-container">
        <MultiSelect
          options={options}
          value={selected}
          onChange={handleSelectChange}
          labelledBy="Select items"
          className="multi-select"
          overrideStrings={{ "selectSomeItems": "Select items to subscribe/unsubscribe for real-time updates" }}
        />        
        <button onClick={handleStart} className="control-button start-button" title='Start Subscription'>
          <img src={startIcon} alt="Start" />
        </button>
        <button onClick={handleStop} className="control-button stop-button" title='Stop Subscription'>
          <img src={stopIcon} alt="Stop" />
        </button>
        <button onClick={handleReset} className="control-button reset-button" title='Reset Connection'>
          <img src={resetIcon} alt="Reset" />
        </button>
      </div>
      <div className="grid-container">
        <AgGridReact
          autoSizeStrategy={autoSizeStrategy}
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          onFilterChanged={() => updateFilteredCount(gridApiRef.current)}
          animateRows={true}
          immutableData={true} // Enable immutable data mode
          domLayout="normal" // domLayout='normal' pins the column headers during scrolling
          getRowId={getRowId}          
          suppressRowVirtualisation={false}
          debounceVerticalScrollbar={true}          
          rowBuffer={100}
        />
      </div>
      <div>
        <StatusBar
          throttleValue={throttleValue}
          handleThrottleChange={handleThrottleChange}
          totalCount={statusInfo.totalCount}
          filteredCount={statusInfo.filteredCount}
          totalTickers={statusInfo.totalTickers}
          selectedTickers={statusInfo.selectedTickers}
          subscribedTickers={statusInfo.subscribedTickers}
          lastUpdate={statusInfo.lastUpdate}
          updatedCount={statusInfo.updatedCount}
          deletedCount={statusInfo.deletedCount}
          connectionStatus={statusInfo.connectionStatus}
          subscriptionStatus={statusInfo.subscriptionStatus}
        />
      </div>
    </div>
  );
};

export default MarketDataGrid;