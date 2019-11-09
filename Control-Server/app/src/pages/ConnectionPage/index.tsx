import React, {createRef, useState} from 'react';
import {
  Card,
  CardActions,
  CardContent,
  Container,
  Fab,
  IconButton,
  makeStyles,
  Modal,
  Theme,
  Typography,
  CircularProgress,
} from "@material-ui/core";
import {WifiOff, Wifi, Refresh} from "@material-ui/icons";

import wifi, {Connection, ConnectionStatus} from '../../models/wifi';
import useStyles from "../../styles";

interface ConnectionProps {
  connection: Connection;
  loading: boolean;
  disconnectWifi: (connection:Connection) => void;
  connectWifi: (connection:Connection) => void;
}

interface PasswordPromptInfo {
  open: boolean,
  callback: ((password:string) => void)|null,
}

export const ConnectionCard = (props: ConnectionProps) => {
  const classes = useStyles();

  const wifiOffButton = (
    <IconButton
      disabled={props.loading}
      onClick={() => props.disconnectWifi(props.connection)}
    >
      <WifiOff/>
    </IconButton>
  );
  const wifiOnButton =  (
    <IconButton
      disabled={props.loading}
      onClick={() => props.connectWifi(props.connection)}
    >
      <Wifi/>
    </IconButton>
  );

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography className={classes.title} gutterBottom>
          { props.connection.statusName() }
        </Typography>
        <Typography className={classes.ssid} gutterBottom>
          SSID: {props.connection.ssid}
        </Typography>
      </CardContent>
      <CardActions>
        { props.connection.status === ConnectionStatus.CURRENT ? wifiOffButton : wifiOnButton }
      </CardActions>
    </Card>
  );
};

export const NoConnectionCard = () => {
  const classes = useStyles();

  return (
    <Card className={classes.card}>
      <CardContent>
        <Typography className={classes.ssid} gutterBottom>
          No Connection
        </Typography>
      </CardContent>
    </Card>
  );
};

const ConnectionPage = () => {
  const classes = useStyles();

  const passwordPromptRef = createRef<HTMLInputElement>();

  const [currentConnection, setCurrentConnection] = useState<Connection|null>(null);
  const [availableConnections, setAvailableConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(false);
  const [passwordPrompt, setPasswordPrompt] = useState<PasswordPromptInfo>({open: false, callback: null});
  const [noConnectionPromptOpen, setNoConnectionPromptOpen] = useState<boolean>(false);

  const connectToNetwork = (connection:Connection): void => {
    setLoading(true);
    Promise.resolve()
      .then(async () => {
        if (connection.info.encrypt !== 'none') {
          return new Promise<string>((resolve) => {
            promptForPassword(resolve)
          });
        }
        return '';
      })
      .then(async (password) => {
        const newConnection = await wifi.connect(connection, password);

        const connected = await wifi.checkConnection();

        if (!connected) {
          setNoConnectionPromptOpen(true);
        }

        setCurrentConnection(newConnection);
      })
      .then(() => setLoading(false));
  };

  const disconnectFromNetwork = (connection:Connection): void => {
    setLoading(true);
    Promise.resolve()
      .then(async () => {
        await wifi.disconnect(connection);
        setCurrentConnection(null);
      })
      .then(() => setLoading(false));
  };

  const refreshNetworks = () => {
    setLoading(true);
    Promise.resolve()
      .then(async () => {
        const current = await wifi.current();
        setCurrentConnection(current);

        const results = await wifi.list();
        setAvailableConnections(results.networks);

        setLoading(false);
      })
  };

  const promptForPassword = (callback:(password:string) => void) => {
    setPasswordPrompt({
      open: true,
      callback,
    })
  };

  const submitPassword = () => {
    if (passwordPrompt.callback && passwordPromptRef.current) {
      const password = passwordPromptRef.current.value;
      passwordPrompt.callback(password);
    }

    setPasswordPrompt({
      open: false,
      callback: null,
    })
  };

  const openCaptivePortal = () => {
    setNoConnectionPromptOpen(false);
    const newWin = window.open('http://neverssl.com', '_blank');
    if (newWin) newWin.focus();
  };

  const commonProps = {
    loading: loading,
    connectWifi: connectToNetwork,
    disconnectWifi: disconnectFromNetwork,
  };

  return (
    <div>
      <Fab className={classes.fab} onClick={refreshNetworks}>
        { loading === true ? <CircularProgress/> : <Refresh/> }
      </Fab>

      <Modal open={passwordPrompt.open}>
        <div className={classes.paper}>
          <h2 id="simple-modal-title">Enter Network Password</h2>
          <input type="text" ref={passwordPromptRef}/>
          <button onClick={submitPassword}>Submit</button>
        </div>
      </Modal>

      <Modal open={noConnectionPromptOpen}>
        <div className={classes.paper}>
          <h2 id="simple-modal-title">No Connection Detected</h2>
          <p>You may need to log into the WiFi network, click here to open the captive portal.</p>
          <button onClick={openCaptivePortal}>Open</button>
        </div>
      </Modal>

      <Container maxWidth="sm">
        {
          currentConnection !== null
            ? <ConnectionCard connection={currentConnection as Connection} {...commonProps}/>
            : <NoConnectionCard/>
        }
        {
          availableConnections.map(c =>
            <ConnectionCard key={c.ssid} connection={c} {...commonProps}/>
          )
        }
      </Container>
    </div>
  );
};

export default ConnectionPage;
