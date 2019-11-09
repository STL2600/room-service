import React from 'react';
import { AppBar, Tabs, Tab } from '@material-ui/core';

import ConnectionPage from './pages/ConnectionPage'
import VpnPage from './pages/VpnPage'
import StatusPage from './pages/StatusPage'
import SecurityPage from './pages/SecurityPage'

import './App.css';

const App: React.FC = () => {
  const [tab, setTab] = React.useState("status");

  function handleChangeTab(event: object, newValue: any) {
    setTab(newValue);
  }

  return (
    <div className="App">
      <AppBar position="static">
        <Tabs value={tab} onChange={handleChangeTab}>
          <Tab label="Connection" id="connection" value="connection" />
          <Tab label="VPN" id="vpn" value="vpn" />
          <Tab label="Security" id="security" value="security" />
          <Tab label="Status" id="status" value="status" />
        </Tabs>
      </AppBar>
      <div hidden={ tab !== "connection" }>
        <ConnectionPage/>
      </div>
      <div hidden={ tab !== "vpn" }>
        <VpnPage/>
      </div>
      <div hidden={ tab !== "security" }>
        <SecurityPage/>
      </div>
      <div hidden={ tab !== "status" }>
        <StatusPage/>
      </div>
    </div>
  );
}

export default App;
