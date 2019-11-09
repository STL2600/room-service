import React, {useState} from 'react';
import {CircularProgress, createStyles, Fab, Grid, makeStyles, Modal, Theme} from "@material-ui/core";
import {Refresh} from "@material-ui/icons";

import useStyles from "../../styles";
import wifi, {Connection, ConnectionInfo} from "../../models/wifi";
import vpn, {VpnConnection, VpnStatus} from "../../models/vpn";

const Status = () => {
  const classes = useStyles();

  const [initialFetchDone, setInitialFetchDone] = useState(false);
  const [confirmShutdownOpen, setConfirmShutdownOpen] = useState(false);
  const [shutdownOpen, setShutdownOpen] = useState(false);
  const [currentConnection, setCurrentConnection] = useState<Connection|null>(null);
  const [loading, setLoading] = useState(false);
  const [vpnConnection, setVpnConnection] = useState<VpnConnection|null>(null);
  const [internetConnected, setInternetConnected] = useState(false);
  const [externalIp, setExternalIp] = useState<string|null>(null);

  const openShutdownModal = () => setConfirmShutdownOpen(true);

  const doShutdown = () => {
    Promise.resolve()
    .then(async () => {
      setConfirmShutdownOpen(false);

      await fetch('/system/shutdown', { method: 'POST' });

      setShutdownOpen(true);
    });
  };

  const refreshInfo = () => {
    Promise.resolve()
    .then(async () => {
      setLoading(true);

      try {
        const wifiConnection = await wifi.current();
        setCurrentConnection(wifiConnection);
      } catch (err) {
        console.error('error fetching current wifi info');
        console.error(err);
      }

      try {
        const vpnConnected = await vpn.connected();
        const vpnList = await vpn.list();
        const currentVpn = vpnList.find(v => v.status === VpnStatus.CURRENT) || null;
        setVpnConnection(vpnConnected ? currentVpn : null);
      } catch (err) {
        console.error('error fetching current vpn info');
        console.error(err);
      }

      try {
        const connected = await wifi.checkConnection();
        const ip = await wifi.getExternalIp();
        setInternetConnected(connected);
        setExternalIp(ip);
      } catch (err) {
        console.error('error fetching internet status');
        console.error(err);
      }

      setLoading(false);
    });
  };

  if (!initialFetchDone) {
    setInitialFetchDone(true);
    refreshInfo();
  }

  return (
    <div className={classes.root}>
      <Fab className={classes.fab} onClick={refreshInfo}>
        { loading ? <CircularProgress/> : <Refresh/> }
      </Fab>

      <Modal open={confirmShutdownOpen}>
        <div className={classes.paper}>
          <h2 id="simple-modal-title">Really Shutdown System?</h2>
          <button onClick={doShutdown}>Submit</button>
        </div>
      </Modal>

      <Modal open={shutdownOpen}>
        <div className={classes.paper}>
          <h2 id="simple-modal-title">System Will Shut Down in One Minute</h2>
        </div>
      </Modal>

      <Grid container spacing={1}>
        <Grid item xs={6}>
          <h3>Connection</h3>
          {
            currentConnection
              ? <p>Connected to {(currentConnection as Connection).info.ssid}</p>
              : <p>No Current Connection</p>
          }
          <h3>Internet</h3>
          {
            internetConnected
              ? <p>Internet Connected.<br/>External IP: {externalIp}</p>
              : <p>No Internet Connection</p>
          }
          <h3>VPN</h3>
          {
            vpnConnection
              ? <p>Connected to {(vpnConnection as VpnConnection).info.description}</p>
              : <p>No Current VPN</p>
          }
        </Grid>
        <Grid item xs={6}>
          <h3>System</h3>
          <button onClick={openShutdownModal}>Shutdown</button>
        </Grid>
      </Grid>
    </div>
  )
};

export default Status;
