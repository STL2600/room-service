const Promise = require('bluebird');
const rp = require('request-promise');
const uuid = require('node-uuid');
const express = require('express');
const fs = require('fs');
const proxy = require('express-http-proxy');
const multer = require('multer');
const request = require('request');
const winston = require('winston');
const bodyparser = require('body-parser');
const nodemailer = require('nodemailer');
const exec = require('child_process').exec;

const settingsFile = 'settings.json';

const settings = JSON.parse(fs.readFileSync(settingsFile));

const log = winston.createLogger({
  level: settings.log.level,
  format: winston.format.simple(),
  transports: [new winston.transports.Console()],
});

const upload = multer({ storage: multer.memoryStorage() });

const mailer = nodemailer.createTransport({
  host: settings.mailer.host,
  port: settings.mailer.port,
  auth: settings.mailer.auth,
});

let token;
async function login() {
  if (token) return;

  const { host, password } = settings.router;

  log.info('logging in to router');
  jar = request.jar();

  const uri = `http://${host}/cgi-bin/api/router/login?_=${Math.floor(Date.now() / 1000)}`;
  const resp = await rp({method: 'POST', uri, jar, form: { pwd: password }});

  token = JSON.parse(resp).token;

  log.info('logged in to router', { resp, token });

  setTimeout(() => token = undefined, 5 * 60 * 1000);
}

const app = express();

app.use((req, res, next) => {
  const id = uuid.v4();
  res.locals.id = id;

  const method = req.method;
  const uri = req.path;

  log.info('Request Start', { id, method, uri })

  const writeFinalLog = () => {
    const status = res.status;
    log.info('Request End', { id, method, uri, status })
  };

  res.on('finish', writeFinalLog);
  res.on('close', writeFinalLog);

  next();
});

app.use('/router', proxy(settings.router.host, {
  proxyReqOptDecorator: async (proxyReqOpts) => {
    await login();

    if (token) proxyReqOpts.headers['Authorization'] = token;

    return proxyReqOpts;
  },
}));

app.get('/check-connection', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    try {
      const result = await Promise.resolve()
        .then(() => rp({
          uri: 'http://neverssl.com',
          resolveWithFullResponse: true,
        }))
        .timeout(2000);

      if (!/neverssl/i.test(result.body)) {
        throw new Error('invalid content from neverssl');
      }

      res.send('ok');
    } catch (err) {
      res.send('not ok');
    }
  })
  .catch(next);
});

app.get('/external-ip', (req, res, next) => {
  Promise.resolve()
    .then(async () => {
      try {
        const result = await Promise.resolve()
          .then(() => rp('https://icanhazip.com'))
          .timeout(5000);

        res.send(result);
      } catch (err) {
        res.status(404).send();
      }
    })
    .catch(next);
});

app.get('/security/settings', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    res.json({
      alertsEnabled: settings.alerts.enabled,
    });
  })
  .catch(next)
});

app.use('/security/settings', bodyparser.json());
app.post('/security/settings', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    settings.alerts.enabled = req.body.alertsEnabled;
    fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    res.send('ok');
  })
  .catch(next)
});

app.post('/security/alert', upload.fields([{ name: 'photo', maxCount: 1}]), (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    if (settings.alerts.enabled) {
      if (req.body.type === 'start') {
        log.warn('Alert Started!!');

        await mailer.sendMail({
          from: settings.mailer.from,
          to: settings.mailer.to,
          subject: 'Room Service Alert Started',
        });
      }

      if (req.body.type === 'photo') {
        log.warn('Alert Picture Saved');

        await mailer.sendMail({
          from: settings.mailer.from,
          to: settings.mailer.to,
          subject: 'Room Service Alert Photo',
          attachments: [{
            filename: 'alert-photo.jpg',
            content: req.files.photo[0].buffer,
          }],
        });
      }

      if (req.body.type === 'end') {
        log.warn('Alert Ended!!');

        await mailer.sendMail({
          from: settings.mailer.from,
          to: settings.mailer.to,
          subject: 'Room Service Alert Ended',
        });
      }
    }

    res.send('ok');
  })
  .catch(next);
});

app.use('/security/camera-feed', proxy('localhost:3002'));

app.post('/system/shutdown', (req, res, next) => {
  Promise.resolve()
  .then(async () => {
    const remoteResults = await Promise.map(Object.keys(settings.systems || {}), async (systemName) => {
      const system = settings.systems[systemName];

      const cmd = `ssh -i ${system.key} ${system.user}@${system.host} shutdown +1`;
      log.info('shutting down remote system', { systemName, system, cmd });

      try {
        const result = await Promise.fromCallback(cb => exec(cmd, cb));
        return { systemName, result };
      } catch (error) {
        return { systemName, error: error.message };
      }
    });

    const cmd = 'shutdown +1';
    log.info('shutting down local system', { cmd });
    const localResult = await Promise.fromCallback(cb => exec(cmd, cb));

    res.status(202).json({ systems: remoteResults, local: localResult });
  })
  .catch(next);
});

app.use(express.static('../app/build'));

app.listen(3001);

log.info('server started');
