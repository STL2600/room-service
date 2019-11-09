import React, {useState} from 'react';
import {createStyles, FormControlLabel, Grid, makeStyles, Switch, Theme} from "@material-ui/core";

import security from "../../models/security";
import useStyles from "../../styles";

const SecurityPage = () => {
  const classes = useStyles();

  const [alertsEnabled, setAlertsEnabled] = useState<boolean|null>(null);

  const updateAlertsStatus = () => {
    security.alertsStatus().then(enabled => setAlertsEnabled(enabled));
  };

  if (alertsEnabled === null) updateAlertsStatus();

  const handleAlertsChange = (event:React.ChangeEvent<HTMLInputElement>) => {
    setAlertsEnabled(event.target.checked);

    if (event.target.checked) security.enableAlerts();
    else security.disableAlerts();
  };

  return (
    <div className={classes.root}>
      <Grid container spacing={1}>
        <Grid item xs={6}>
          <h3>Live View</h3>
          <iframe height="400px" width="100%" src="/security/camera-feed"/>
        </Grid>
        <Grid item xs={6}>
          <h3>Settings</h3>
          <FormControlLabel
            control={
              <Switch checked={alertsEnabled || false} onChange={handleAlertsChange} value="alerts" />
            }
            label="Alerts Enabled"
          />
        </Grid>
      </Grid>
    </div>
  )
};

export default SecurityPage;
