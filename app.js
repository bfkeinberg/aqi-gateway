// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

'use strict';

// [START gae_node_request_example]
const express = require('express');
const fetch = require('node-fetch');
const {calcBoundingBox, aqanduAQIFromPM} = require('./purpleSupport');
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end();
});

app.get('/iqair', (req, res) => {
  const lat = req.query.lat;
  if (lat === undefined) {
    res.status(400).json("{'status': 'Missing latitude'}");
    return;
  }

  const lon = req.query.lon;
  if (lon === undefined) {
    res.status(400).json("{'status': 'Missing longitude'}");
    return;
  }

  const iqAirkey = process.env.IQAIR_KEY;
  const iqAirurl = `https://api.airvisual.com/v2/nearest_city?lat=${lat}&lon=${lon}&key=${iqAirkey}`;

  fetch(iqAirurl).then(fetchResult => {
      if (!fetchResult.ok) {
        throw Error(fetchResult.status)
      }
      return fetchResult.json()})
      .then(body => {
        if (body.status === 'success') {
          const aqi = body.data.current.pollution.aqius;
          const conditions = {'PM2.5':aqi, 'O3':null};
          console.info(`conditions : ${JSON.stringify(conditions)}`);
          res.status(200).json(conditions);
        } else {
          console.error(`Error, status : ${body.status}`);
          throw Error(400);
        }
      })
      .catch(err => {res.status(400).send("No AQI results")});
});

app.get('/aqi', (req, res) => {
  const lat = req.query.lat;
  if (lat === undefined) {
    res.status(400).json("{'status': 'Missing latitude'}");
    return;
  }

  const lon = req.query.lon;
  if (lon === undefined) {
    res.status(400).json("{'status': 'Missing longitude'}");
    return;
  }

  const airNOWkey = process.env.AIRNOW_KEY;
  const airNOWurl = `http://www.airnowapi.org/aq/observation/latLong/current/?format=application/json&latitude=${lat}&longitude=${lon}&distance=25&API_KEY=${airNOWkey}`;

  fetch(airNOWurl).then(fetchResult => {
      if (!fetchResult.ok) {
        throw Error(fetchResult.status)
      }
      return fetchResult.json()})
      .then(body => {
        const conditions = body.reduce( (results, current) => {results[current.ParameterName]=current["AQI"]; return results}, {});
        if (conditions !== undefined) {
          console.info(`conditions : ${JSON.stringify(conditions)}`);
          res.status(200).json(conditions);
        } else {
          console.error('No conditions returned');
          throw Error(400);
        }
      })
      .catch(err => {res.status(400).send("No AQI results")});
});

app.get('/purpleair',(req, res) => {
  const lat = req.query.lat;
  if (lat === undefined) {
    res.status(400).json("{'status': 'Missing latitude'}");
    return;
  }

  const lon = req.query.lon;
  if (lon === undefined) {
    res.status(400).json("{'status': 'Missing longitude'}");
    return;
  }

  let boundingBox = calcBoundingBox(parseFloat(lat), parseFloat(lon), 5);

  const purpleAirKey = process.env.PURPLE_AIR_KEY;
  const purpleAirUrl =
      `https://api.purpleair.com/v1/sensors?fields=pm2.5,ozone1&location_type=0&nwlng=${boundingBox[0]}&nwlat=${boundingBox[2]}&selng=${boundingBox[1]}&selat=${boundingBox[3]}&api_key=${purpleAirKey}`;

  console.log(purpleAirUrl);

  fetch(purpleAirUrl).then(fetchResult => {
    if (!fetchResult.ok) {
      throw Error(fetchResult.status)
    }
    return fetchResult.json()})
    .then(body => {
        let pm25index = body.fields.indexOf('pm2.5');
        let ozoneIndex = body.fields.indexOf('ozone1');
        const data = body.data[0];
        if (data !== undefined) {
          // average
          const avgPm25 = body.data.reduce((a, b) => a + b[pm25index], 0) / body.data.length;
          let aqi = aqanduAQIFromPM(avgPm25);
          let conditions = {'PM2.5':aqi, 'O3':data[ozoneIndex]};
          console.info(`conditions : ${JSON.stringify(conditions)}`);
          res.status(200).json(conditions);
        } else {
          console.error('No conditions returned');
          throw Error(400);
        }
    })
    .catch(err => {res.status(400).send("No Purple Air results")});
});

//
// Start the server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');
});
// [END gae_node_request_example]

module.exports = app;
