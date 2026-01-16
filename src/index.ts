import { createDirigeraClient } from "dirigera";
import { Hono } from "hono/tiny";
import { pino } from "pino";
import { Gauge, Registry, collectDefaultMetrics } from "prom-client";

const config = {
  accessToken: process.env.ACCESS_TOKEN,
  gatewayIP: process.env.GATEWAY_IP,
  acceptUnauthorized: Boolean(process.env.ACCEPT_UNAUTHORIZED),
  loggingLevel: process.env.LOGGING_LEVEL || "error",
  port: Number(process.env.PORT) || 9001,
  collectDefault: Boolean(process.env.COLLECT_DEFAULT),
};

const log = pino({ level: config.loggingLevel });
log.debug({ ...config, accessToken: "*******" });

if (!config.accessToken) {
  log.fatal("ACCESS_TOKEN environment variable is required");
  process.exit(1);
}

// IKEA Dirigera

const client = await createDirigeraClient({
  accessToken: config.accessToken,
  gatewayIP: config.gatewayIP,
  rejectUnauthorized: !config.acceptUnauthorized,
});

async function getAlpstugaSensors() {
  const environmentSensors = await client.environmentSensors.list();
  return environmentSensors.filter(
    (sensor) => sensor.attributes.productCode === "E2495",
  );
}

// Prometheus

const register = new Registry();

const labelNames = ["sensor_id", "room"] as const;

const co2Gauge = new Gauge({
  name: "alpstuga_co2_ppm",
  help: "CO2 concentration in ppm",
  labelNames,
});
register.registerMetric(co2Gauge);

const temperatureGauge = new Gauge({
  name: "alpstuga_temperature_celsius",
  help: "Temperature in Celsius",
  labelNames,
});
register.registerMetric(temperatureGauge);

const pm25Gauge = new Gauge({
  name: "alpstuga_pm25_micrograms_per_cubic_meter",
  help: "PM2.5 concentration in micrograms per cubic meter",
  labelNames,
});
register.registerMetric(pm25Gauge);

const rhGauge = new Gauge({
  name: "alpstuga_relative_humidity_percent",
  help: "Relative humidity in percent",
  labelNames,
});
register.registerMetric(rhGauge);

if (config.collectDefault) {
  collectDefaultMetrics({ register });
}

// Hono

const app = new Hono().get("/metrics", async (c) => {
  const sensors = await getAlpstugaSensors();
  log.debug({ sensorCount: sensors.length }, "ALPSTUGA sensors found");

  for (const sensor of sensors) {
    const labels = {
      sensor_id: sensor.id,
      room: sensor.room?.name ?? "unknown",
    };

    const { currentCO2, currentTemperature, currentPM25, currentRH } =
      sensor.attributes;

    log.debug(
      {
        labels,
        currentCO2,
        currentTemperature,
        currentPM25,
        currentRH,
      },
      "sensor data",
    );

    co2Gauge.set(labels, currentCO2 ?? NaN);
    temperatureGauge.set(labels, currentTemperature ?? NaN);
    pm25Gauge.set(labels, currentPM25 ?? NaN);
    rhGauge.set(labels, currentRH ?? NaN);
  }

  const metrics = await register.metrics();

  return c.text(metrics, 200, { "Content-Type": register.contentType });
});

Bun.serve({
  port: config.port,
  fetch: app.fetch,
});
