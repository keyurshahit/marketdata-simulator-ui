# React client app for streaming/real-time data interface

## This app consists of a single screen with the following three parts

1. Ticker data dropdown with start/stop/reset subscription buttons
	- Auto populates the dropdown (upon successful websocket connection) with all the available id's (from server) that could be subscribed/un-subscribed to for real-time data updates
	- Provides ability to search/filter and select/unselect multiple items along with select-all option
    - Start button subscribes (by sending websocket request to the server) to real-time updates for all the selected id's in the dropdown
    - Stop button un-subscribes (by sending websocket request to the server) to all the selected id's in the dropdown
    - Reset button disconnects/reconnects connection with the server along with clearing the data grid and resetting the dropdown selections and populating the dropdown with the latest id's (ticker data) from the server
    [!NOTE] Current multiselect dropdown could be replaced with a similar dropdown like primereact multiselect with virtualization option for better UX/performance
    [!NOTE] In a more formal application the client will go through proper authentication/authorization and will have the ability to create custom pre-canned/persistent subscription profiles with selected tickers and subscribe by those profiles for ticking data instead of selecting/unselecting individual tickers each time for subscription

2. MarketData grid
	- Data grid (react ag-grid) to display real-time ticking data
	- Optimized for high frequency data updates with async transaction updates, row virtualization, immutable data, row buffer, debounced scrolling etc.
	- Provides ability to efficiently sort, filter, resize and move column headers (while updating live data)

3. Status bar
	- Updated in real-time with changing grid data and connection/subscription information. Additionally provides dropdown to control the throttle rate for the streaming data updates

## Code Structure

- src/components => App components (MarketDataGrid and StatusBar)
- src/assets => images/svg files
- styles.css => app wide styles
- .env => app wide configuration values

## External Libraries

- Data grid => ag-grid-react
- Data update throttling => lodash
- Multi select dropdown => react-multi-select-component



This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).