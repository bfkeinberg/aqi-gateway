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

const aqanduAQIFromPM = (pm) => {
    return aqiFromPM(0.778 * pm + 2.65);
};

const usEPAfromPm = (pm,rh) => {
    return aqiFromPM(0.534 * pm - 0.0844 * rh + 5.604);
};

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

module.exports = {
    calcBoundingBox, aqanduAQIFromPM, usEPAfromPm
}
