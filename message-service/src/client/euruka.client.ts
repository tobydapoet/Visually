import { Eureka } from 'eureka-js-client';
import { networkInterfaces } from 'os';
import 'dotenv/config';

const serviceName = process.env.EUREKA_FEED_SERVICE_NAME;

const serverPort = Number(process.env.SERVER_PORT);

const eurekaPort = Number(process.env.EUREKA_PORT);

const eurekaHost = process.env.EUREKA_HOST;

function getLocalIp(): string {
  const nets = networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]!) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '127.0.0.1';
}

export const eurekaClient = new Eureka({
  instance: {
    app: String(serviceName),
    hostName: String(serviceName),
    ipAddr: getLocalIp(),
    port: {
      $: serverPort,
      '@enabled': true,
    },
    statusPageUrl: `http://${serviceName}:${serverPort}/health`,
    vipAddress: String(serviceName),
    dataCenterInfo: {
      '@class': 'com.netflix.appinfo.InstanceInfo$DefaultDataCenterInfo',
      name: 'MyOwn',
    },
  },
  eureka: {
    host: eurekaHost,
    port: eurekaPort,
    servicePath: '/eureka/apps/',
  },
});
