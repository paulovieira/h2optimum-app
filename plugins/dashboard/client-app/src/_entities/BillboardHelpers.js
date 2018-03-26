var DateFns = require('date-fns');

module.exports.processData = function (dataCY, dataLY) {

    var CY = dataCY.map(obj => obj.Value);
    var LY = dataLY.map(obj => obj.Value);
    var ts = dataCY.map(obj => obj.HotelDate);
    var tsGrid = module.exports.filterTimestampsForGrid(ts);

    CY.unshift('CY');
    LY.unshift('LY');
    ts.unshift('ts');

    return {
        CY: CY,
        LY: LY,
        ts: ts,
        tsGrid: tsGrid
    };

};

module.exports.filterTimestampsForGrid = function(ts){

    var numDays = DateFns.differenceInDays(ts[ts.length - 1], ts[0]);
    var tsFiltered = [];

    if (numDays > 0 && numDays <= 10) {
        tsFiltered = ts.filter(date => true);
    }
    else if (numDays > 10 && numDays <= 20) {
        tsFiltered = ts.filter((date, i) => i % 2 === 0);
    }
    else if (numDays > 20 && numDays <= 60) {
        tsFiltered = ts.filter(date => DateFns.isSunday(date));
    }
    else if (numDays > 60 && numDays <= 90) {
        tsFiltered = ts.filter(date => DateFns.isFirstDayOfMonth(date) || DateFns.getDate(date) === 15);
    }
    else {
        tsFiltered = ts.filter(date => DateFns.isFirstDayOfMonth(date))
    }

    return tsFiltered;

};
