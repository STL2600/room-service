import {isBoolean} from "util";

export enum ConnectionStatus {
  CURRENT,
  AVAILABLE,
}

export interface ConnectionInfo {
  mac: string,
  ssid: string,
  channel: number,
  type: string,
  signal: string,
  encrypt: string,
  device: string,
  caps: string,
}

export class Connection {
  ssid: string;
  info: ConnectionInfo;
  status: ConnectionStatus;

  constructor(info: ConnectionInfo, status: ConnectionStatus) {
    this.info = info;
    this.ssid = info.ssid;
    this.status = status;
  };

  statusName(): string {
    if (this.status === ConnectionStatus.CURRENT) return 'Current Connection';
    if (this.status === ConnectionStatus.AVAILABLE) return 'Available Connection';

    throw new Error(`invalid connection type: ${this.status}`);
  }
}

export interface ListNetworksResponse {
  networks: Connection[],
}

export async function current(): Promise<Connection | null> {
  const result = await fetch('/router/cgi-bin/api/repeater/info');
  const network = await result.json();

  if (network.enabled) return new Connection(network, ConnectionStatus.CURRENT)
  return null;
}

export async function list(): Promise<ListNetworksResponse> {
  const result = await fetch('/router/cgi-bin/api/repeater/scan');
  const resultObj = await result.json();

  const networksObj = resultObj.wifis.reduce(
    (acc: any, wifi:any) => {
      const conn = new Connection(wifi, ConnectionStatus.AVAILABLE);
      return Object.assign(acc, { [wifi.ssid]: conn });
    },
    {},
  );

  const networks = Object.values(networksObj) as Connection[];

  return { networks };
}

export async function connect(connection:Connection, password: string | null): Promise<Connection | null> {
  const form = new URLSearchParams();

  form.append('ssid', connection.info.ssid);
  form.append('mac', connection.info.mac);
  form.append('channel', `${connection.info.channel}`);
  form.append('device', `${connection.info.device}`);
  form.append('encrypt', `${connection.info.encrypt}`);
  form.append('save2uci', 'true');
  form.append('identity', '');
  form.append('ipaddr', '');
  form.append('mode', '');
  form.append('caps', 'HT20+');

  if (password) form.append("key", password);

  const result = await fetch(`/router/cgi-bin/api/repeater/join`, {
    method: 'POST',
    body: form,
  });

  console.dir(result);

  return new Connection(connection.info, ConnectionStatus.CURRENT);
}

export async function checkConnection():Promise<boolean> {
  const result = await fetch('/check-connection');
  const status = await result.text();
  return status === 'ok';
}

export async function getExternalIp():Promise<string> {
  const result = await fetch('/external-ip');
  return result.text();
}

export async function disconnect(connection: Connection) {
  const form = new URLSearchParams();

  form.append('ssid', connection.info.ssid);
  form.append('enable', 'false');

  const result = await fetch('/router/cgi-bin/api/repeater/enable', {
    method: 'POST',
    body: form,
  });

  console.dir(result);

  return result;
}

const wifi = { current, connect, checkConnection, getExternalIp, disconnect, list };
export default wifi;
