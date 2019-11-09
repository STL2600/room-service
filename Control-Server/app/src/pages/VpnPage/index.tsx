import React, {useState} from 'react';
import {FormControlLabel, FormGroup, makeStyles, Radio, RadioGroup, Switch, Theme} from "@material-ui/core";
import vpn, {VpnConnection, VpnStatus} from "../../models/vpn";
import useStyles from "../../styles";

const VpnPage = () => {
  const classes = useStyles();

  const [vpnSelected, setVpnSelected] = useState<string | null>(null);
  const [vpnsAvailable, setVpnsAvailable] = useState<VpnConnection[]>([]);
  const [vpnActive, setVpnActive] = useState<boolean>(false);
  const [initialStateLoaded, setInitialStateLoaded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const getSelectedVpn = () => vpnsAvailable.find(vpn => vpn.status === VpnStatus.CURRENT);

  const handleVpnSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVpnSelected((event.target as HTMLInputElement).value);
  };

  const handleActivateSwitch = (event: any, checked: boolean) => {
    const selectedVpn = getSelectedVpn();
    Promise.resolve()
    .then(async () => {
      setLoading(true);
      if (selectedVpn) {
        if (checked) await vpn.connect(selectedVpn);
        else await vpn.disconnect(selectedVpn);
      }
    })
    .then(() => updateStatus());
  };

  const updateStatus = () => {
    Promise.all([
      vpn.list(),
      vpn.connected(),
    ])
    .then(([vpns, connected]) => {
      setVpnsAvailable(vpns);
      const selected = vpns.find(vpn => vpn.status === VpnStatus.CURRENT);
      setVpnSelected(selected ? selected.info.id : null);
      console.dir(connected);
      setVpnActive(connected);
    }).then(() => {
      setInitialStateLoaded(true);
      setLoading(false);
    });
  };

  if (!initialStateLoaded) updateStatus();

  return (
    <div>
        {
          vpnsAvailable.length > 0
            ? (
              <FormGroup>
                <RadioGroup name="vpn-selection" value={vpnSelected} onChange={handleVpnSelect}>
                  {
                    vpnsAvailable.map(vpn =>
                      <FormControlLabel
                        control={<Radio/>}
                        disabled={loading}
                        checked={vpn.info.id === vpnSelected}
                        key={vpn.info.id}
                        value={vpn.info.id}
                        label={vpn.info.description}
                      />
                    )
                  }
                </RadioGroup>
                <FormControlLabel
                  control={<Switch/>}
                  label="Activate VPN"
                  checked={vpnActive}
                  onChange={handleActivateSwitch}
                />
              </FormGroup>
            ) : (
              <h2>No VPNs Available</h2>
            )
        }
    </div>
  )
};

export default VpnPage;
