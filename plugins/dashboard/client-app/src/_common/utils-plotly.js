let Radio = require('backbone.radio');
let DateFns = require('date-fns');
let $ = require('jquery');
//let Plotly = require('../../web_modules/plotly.js')
let Plotly = require('plotly.js/lib/index-cartesian')

let internals = {};

//internals.model = new Backbone.Model();

internals.traceBase = {
    type: 'scatter',
    mode: 'lines+markers',
    x: null,
    y: null,
    name: null,
    line: {
        color: null,
        width: 2
    },
    marker: {
        size: 4
    },
};

//internals.model.set('traceBase', internals.traceBase);

internals.computeLineWidth = function () {

    let currentDates = Radio.channel('dates').request('get');
    let numDays = DateFns.differenceInDays(currentDates[1], currentDates[0]);

    let lineWidth = 1.5;
    if (numDays > 30 && numDays <= 60) {
        lineWidth = 1.5
    }
    else if (numDays > 60 && numDays <= 90) {
        lineWidth = 1.5
    }
    else if (numDays > 90 && numDays <= 120) {
        lineWidth = 1.3
    }
    else if (numDays > 120) {
        lineWidth = 1.1
    }

    return lineWidth;
}

exports.getTraceBase = function () {

    let obj = $.extend(true, {}, internals.traceBase);
    obj.line.width = internals.computeLineWidth();

    return obj;
}


// will be called with the view as the context (we store some state in it)

exports.updateRangeOnZoomOut = function (updatedRange) {

    /*

        on zoomin/zoomout, updatedRange will be something like: 

        {
            "xaxis.range[0]": "2017-08-31 15:15:36.4162",
            "xaxis.range[1]": "2017-10-16 15:15:36.4162"
        }

        on autosizing:

        {
            "xaxis.autorange": true
        }

    */

    // make a early return here? or should we make this check just before the call to Plotly.relayout?
    // (that would allow us to try again if it is under relayout because of something else - see below)

debugger
    if (this.isUnderRelayout) {
        //debugger
        //this.previousRange = updatedRange;
        return;
    }

    // abort if the event is fired because of some other action other than zoomin/zoomout (namely, autoscale)

    if (updatedRange['xaxis.autorange']) {
        this.previousRange = {
            'xaxis.range[0]': this.currentPeriod[0],
            'xaxis.range[1]': this.currentPeriod[1]
        };
        return;
    }

    let fromDateUpdated = updatedRange['xaxis.range[0]'];
    let toDateUpdated = updatedRange['xaxis.range[1]'];

    if (!fromDateUpdated || !toDateUpdated) {
        console.log('ERROR: plotly_relayout handler: unknown case');
        console.log('updatedRange: ', updatedRange);

        return
    }

    // looks like we have a normal zoomin or zoomout; no need to use DateFns.format here...
    fromDateUpdated = fromDateUpdated.substring(0, 10);
    toDateUpdated = toDateUpdated.substring(0, 10);

    if (
        DateFns.isWithinRange(fromDateUpdated, this.currentPeriod[0], this.currentPeriod[1]) &&
        DateFns.isWithinRange(toDateUpdated, this.currentPeriod[0], this.currentPeriod[1])
    ){
        this.previousRange = {
            'xaxis.range[0]': fromDateUpdated,
            'xaxis.range[1]': toDateUpdated
        };
        return;
    }
    
    let layoutOptions = {};
    //let shouldDoRelayout = false;

    // limit the zoomout

    // case 1
    if (DateFns.isBefore(fromDateUpdated, this.currentPeriod[0]) && DateFns.isBefore(toDateUpdated, this.currentPeriod[1])) {
        console.log('case 1 @ ' + Date.now())
        layoutOptions['xaxis.range[0]'] = this.currentPeriod[0];
        layoutOptions['xaxis.range[1]'] = this.previousRange['xaxis.range[1]'];

        layoutOptions['xaxis.rangeslider.range[0]'] = this.currentPeriod[0];
        layoutOptions['xaxis.rangeslider.range[0]'] = this.previousRange['xaxis.range[1]'];
    }

    else if (DateFns.isAfter(fromDateUpdated, this.currentPeriod[0]) && DateFns.isAfter(toDateUpdated, this.currentPeriod[1])) {
        console.log('case 2 @ ' + Date.now())
        layoutOptions['xaxis.range[0]'] = this.previousRange['xaxis.range[0]'];
        layoutOptions['xaxis.range[1]'] = this.currentPeriod[1];

        layoutOptions['xaxis.rangeslider.range[0]'] = this.previousRange['xaxis.range[0]'];
        layoutOptions['xaxis.rangeslider.range[0]'] = this.currentPeriod[1];
    }

    else if (DateFns.isBefore(fromDateUpdated, this.currentPeriod[0]) && DateFns.isAfter(toDateUpdated, this.currentPeriod[1])) {
        console.log('case 3 @ ' + Date.now())
        layoutOptions['xaxis.range[0]'] = this.currentPeriod[0];
        layoutOptions['xaxis.range[1]'] = this.currentPeriod[1];

        layoutOptions['xaxis.rangeslider.range[0]'] = this.currentPeriod[0];
        layoutOptions['xaxis.rangeslider.range[0]'] = this.currentPeriod[1];
    }

    else {
        console.log('ERROR: plotly_relayout handler: case not handled');
        console.log('fromDateUpdated: ', fromDateUpdated);
        console.log('toDateUpdated: ', toDateUpdated);
        console.log('currentPeriod[0]: ', this.currentPeriod[0]);
        console.log('currentPeriod[1]: ', this.currentPeriod[1]);
    }

    
    //if (shouldDoRelayout === false) {
        // limit the zoom in
        // TBD: this is not working well in some cases

        /*
        let minDays = 4;
        if (DateFns.differenceInDays(toDateUpdated, fromDateUpdated) < minDays) {
            //layoutOptions['xaxis.range[0]'] = fromDateUpdated;
            //layoutOptions['xaxis.range[1]'] = Utils.dateFnsFormat(DateFns.addDays(fromDateUpdated, minDays));
            layoutOptions['xaxis.range[0]'] = this.previousRange['xaxis.range[0]'];
            layoutOptions['xaxis.range[1]'] = this.previousRange['xaxis.range[1]'];

            shouldDoRelayout = true;
            debugger
        }
        */
    //}
    
    //debugger

    //if (shouldDoRelayout === false) { return }

    this.isUnderRelayout = true;
    
    Plotly.relayout(this.gd, layoutOptions).then(() => { this.isUnderRelayout = false })
};
