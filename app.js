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

const toDegrees = (radians) => (radians * 180) / Math.PI;
const toRadians = (degrees) => (degrees * Math.PI) / 180;

const calcBoundingBox = (lat,lon,distInKm) => {
  const R = 6371;   // radius of Earth in km

  let widthInDegrees = toDegrees(distInKm/R/Math.cos(toRadians(lat)));
  let x1 = lon - widthInDegrees;
  let x2 = lon + widthInDegrees;
  let heightInDegrees = toDegrees(distInKm/R);
  let y1 = lat + heightInDegrees;
  let y2 = lat - heightInDegrees;
  return [x1, x2, y1, y2];
}

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

function aqanduAQIFromPM(pm) {
  return aqiFromPM(0.778 * pm + 2.65);
}

function aqiFromPM(pm) {

  if (isNaN(pm)) return "-";
  if (pm == undefined) return "-";
  if (pm < 0) return pm;
  if (pm > 1000) return "-";
  /*
        Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
  Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
  Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
  Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
  Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
  Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
  Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
  */
  if (pm > 350.5) {
    return calcAQI(pm, 500, 401, 500, 350.5);
  } else if (pm > 250.5) {
    return calcAQI(pm, 400, 301, 350.4, 250.5);
  } else if (pm > 150.5) {
    return calcAQI(pm, 300, 201, 250.4, 150.5);
  } else if (pm > 55.5) {
    return calcAQI(pm, 200, 151, 150.4, 55.5);
  } else if (pm > 35.5) {
    return calcAQI(pm, 150, 101, 55.4, 35.5);
  } else if (pm > 12.1) {
    return calcAQI(pm, 100, 51, 35.4, 12.1);
  } else if (pm >= 0) {
    return calcAQI(pm, 50, 0, 12, 0);
  } else {
    return undefined;
  }

}
function bplFromPM(pm) {
  if (isNaN(pm)) return 0;
  if (pm == undefined) return 0;
  if (pm < 0) return 0;
  /*
        Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
  Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
  Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
  Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
  Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
  Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
  Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
  */
  if (pm > 350.5) {
    return 401;
  } else if (pm > 250.5) {
    return 301;
  } else if (pm > 150.5) {
    return 201;
  } else if (pm > 55.5) {
    return 151;
  } else if (pm > 35.5) {
    return 101;
  } else if (pm > 12.1) {
    return 51;
  } else if (pm >= 0) {
    return 0;
  } else {
    return 0;
  }

}
function bphFromPM(pm) {
  //return 0;
  if (isNaN(pm)) return 0;
  if (pm == undefined) return 0;
  if (pm < 0) return 0;
  /*
        Good                              0 - 50         0.0 - 15.0         0.0 – 12.0
  Moderate                        51 - 100           >15.0 - 40        12.1 – 35.4
  Unhealthy for Sensitive Groups   101 – 150     >40 – 65          35.5 – 55.4
  Unhealthy                                 151 – 200         > 65 – 150       55.5 – 150.4
  Very Unhealthy                    201 – 300 > 150 – 250     150.5 – 250.4
  Hazardous                                 301 – 400         > 250 – 350     250.5 – 350.4
  Hazardous                                 401 – 500         > 350 – 500     350.5 – 500
  */
  if (pm > 350.5) {
    return 500;
  } else if (pm > 250.5) {
    return 500;
  } else if (pm > 150.5) {
    return 300;
  } else if (pm > 55.5) {
    return 200;
  } else if (pm > 35.5) {
    return 150;
  } else if (pm > 12.1) {
    return 100;
  } else if (pm >= 0) {
    return 50;
  } else {
    return 0;
  }

}

function calcAQI(Cp, Ih, Il, BPh, BPl) {

  var a = (Ih - Il);
  var b = (BPh - BPl);
  var c = (Cp - BPl);
  return Math.round((a/b) * c + Il);

}

module.exports = app;
