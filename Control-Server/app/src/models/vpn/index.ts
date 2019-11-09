export enum VpnStatus {
  CURRENT,
  AVAILABLE,
}

export interface VpnInfo {
  id:string
  description:string
  username:string
  password:string
  defaultserver:string
}

export class VpnConnection{
  info: VpnInfo;
  status: VpnStatus;

  constructor(info: VpnInfo, status: VpnStatus) {
    this.info = info;
    this.status = status;
  };

  statusName(): string {
    if (this.status === VpnStatus.CURRENT) return 'Current Connection';
    if (this.status === VpnStatus.AVAILABLE) return 'Available Connection';

    throw new Error(`invalid connection type: ${this.status}`);
  }
}

export async function list(): Promise<VpnConnection[]> {
  const result = await fetch('/router/cgi-bin/api/ovpn/client/list');
  const resultObj = await result.json();
  const vpns = (resultObj.clients || []).map((client:VpnInfo) =>
    new VpnConnection(
      client as VpnInfo,
      client.description === resultObj.current_server ? VpnStatus.CURRENT : VpnStatus.AVAILABLE
    )
  );
  return vpns;
}

export async function connected(): Promise<boolean> {
  const result = await fetch('/router/cgi-bin/api/ovpn/client/status');
  const resultObj = await result.json();
  return resultObj.enable;
}

export async function connect(connection:VpnConnection, enable: boolean = true): Promise<VpnConnection | null> {
  const form = new URLSearchParams();

  form.append('enableovpn', enable ? 'true' : 'false');
  form.append('ovpnclientid', connection.info.id);
  form.append('force_client', 'false');

  const result = await fetch(`/router/cgi-bin/api/ovpn/client/set`, {
    method: 'POST',
    body: form,
  });

  console.dir(result);

  return new VpnConnection(connection.info, VpnStatus.CURRENT);
}

export async function disconnect(connection: VpnConnection) {
  return connect(connection, false);
}

const vpn = { connected, connect, disconnect, list };
export default vpn;
