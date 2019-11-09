export class Event {
  filename: string;
  timestamp: Date;
  image: string;

  constructor(filename:string, timestamp:string, image:string) {
    this.filename = filename;
    this.timestamp = new Date(timestamp);
    this.image = image;
  }
}

async function events():Promise<Event[]> {
  return [];
}

async function alertsStatus():Promise<boolean> {
  const result = await fetch(`/security/settings`);
  const json = await result.json();
  console.dir(json);
  return json.alertsEnabled;
}

async function enableAlerts(value:boolean = true) {
  const result = await fetch(`/security/settings`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify({ alertsEnabled: value }),
  });
}

async function disableAlerts() {
  await enableAlerts(false);
}

const security = { Event, alertsStatus, enableAlerts, disableAlerts };
export default security;
