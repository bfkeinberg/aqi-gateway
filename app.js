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

const app = express();

app.get('/', (req, res) => {
  res.status(200).send('Hello, world!').end();
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
        const conditions = body.filter(condition => condition.ParameterName==='PM2.5')[0];
        if (conditions !== undefined) {
          console.info(`AQI : ${conditions.AQI}`);
          res.status(200).send(conditions.AQI.toString())
        } else {
          console.error('No conditions returned');
          throw Error(400);
        }
      })
      .catch(err => {res.status(400).send("No AQI results")});
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
