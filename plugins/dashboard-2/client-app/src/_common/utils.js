

const $ = require('jquery');
const _ = require('underscore');
const Mn = require('backbone.marionette');
const Radio = require('backbone.radio');
const Fecha = require('fecha');
const Nunjucks = require('nunjucks');
const Q = require('q');
let DateFns = require('date-fns');

const internals = {};

internals.inactivityTimerId = undefined
internals.hasActivityListener = false
//internals.nunjucksEnv = require('../_config/nunjucks-env');

/*
exports.compile = function(templateSrc) {

    return Nunjucks.compile(templateSrc, internals.nunjucksEnv, null, true);
}
*/

exports.getRandomNumber = function getRandomNumber(min, max){

    if (typeof min !== 'number'){
        min = 300;
    }
    if (typeof max !== 'number'){
        max = 600;
    }

    return Math.round(min + (Math.random()) * (max - min));
};

// returns a random string with 4 character, used in the getFakeUuid below
exports.s4 = function() {

    var s = Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
    return s;
};

// taken from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript
exports.getPseudoUuid = function getFakeUuid(){

    var s4 = exports.s4;
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
};

exports.getFormData = function(formDataOriginal) {

    var keyOriginal = '', key = '', value, formData = {};

    for (keyOriginal in formDataOriginal){
        value = formDataOriginal[keyOriginal];
        value = (typeof value === 'string') ? value.trim() : value;
        key = keyOriginal.split('___');
        formData[key[0]] = value;
    }

    return formData;
}

exports.resetDOM = function resetDOM(){

    // start with an empty dom

    $('body').empty();
    $('body').html('<div data-id="initial-loading">Please wait...</div>');
};

exports.createRootRegion = function createRootRegion(){

    $('body').append('<div data-region-id="root-region" class="text-unselectablex"></div>');

    var rootR = new Mn.Region({
        el: '[data-region-id="root-region"]'
    });

    Radio.channel('public').reply('rootR', rootR);
};

exports.createModalRegions = function createModalRegions(){
/*
    // small modal
    $('body').append(`
        <div class="modal no-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-sm">
                <div class="modal-content" data-region-id="modal-small">
                </div>
            </div>
        </div>

    `);

    // medium modal
    $('body').append(`
        <div class="modal no-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog">
                <div class="modal-content" data-region-id="modal-medium">
                </div>
            </div>
        </div>
    `);

    // large modal
    $('body').append(`
        <div class="modal no-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg">
                <div class="modal-content" data-region-id="modal-large">
                </div>
            </div>
        </div>
    `);
*/
    // small modal
    $('body').append(`
        <div class="modal NO-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-sm" role="document">
                <div class="modal-content" data-region-id="modal-small">
                </div>
            </div>
        </div>
    `);

    // medium modal
    $('body').append(`
        <div class="modal NO-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog" role="document">
                <div class="modal-content" data-region-id="modal-medium">
                </div>
            </div>
        </div>
    `);

    // large modal
    $('body').append(`
        <div class="modal NO-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content" data-region-id="modal-large">
                </div>
            </div>
        </div>
    `);

    // centered modal
    $('body').append(`
        <div class="modal modal-center NO-fade" tabindex="-1" role="dialog">
            <div class="modal-dialog modal-lg" role="document">
                <div class="modal-content" data-region-id="modal-center">
                </div>
            </div>
        </div>
    `);


    var modalSmallR = new Mn.Region({
        el: 'div[data-region-id="modal-small"]'
    });

    var modalMediumR = new Mn.Region({
        el: 'div[data-region-id="modal-medium"]'
    });

    var modalLargeR = new Mn.Region({
        el: 'div[data-region-id="modal-large"]'
    });

    var modalCenterR = new Mn.Region({
        el: 'div[data-region-id="modal-center"]'
    });

    Radio.channel('public').reply('modalSmallR', modalSmallR);    
    Radio.channel('public').reply('modalMediumR', modalMediumR);
    Radio.channel('public').reply('modalLargeR', modalLargeR);
    Radio.channel('public').reply('modalCenterR', modalCenterR);
};

exports.getModalRegion = function(modalSize){

    if (modalSize instanceof Mn.Region) {
        return modalSize;
    }

    if (!modalSize) {
        modalSize = 'medium';
    }

    var modalR;

    if (modalSize === 'small'){
        modalR = Radio.channel('public').request('modalSmallR');
    }
    else if (modalSize === 'medium'){
        modalR = Radio.channel('public').request('modalMediumR');
    }
    else if (modalSize === 'large'){
        modalR = Radio.channel('public').request('modalLargeR');
    }

    if (!modalR) {
        throw new Error('modal region not found for size: ' + modalSize);
    }

    return modalR;
};

exports.showAsModal = function (view, modalSize){

    if (!modalSize) {
        modalSize = 'medium';
    }

    var modalR = exports.getModalRegion(modalSize);

    // explicitely close any previously opened view in this modal region (to execute the destroy procedures from the modal plugin)
    exports.closeModal(modalR);
    view._modalRegion = modalR;
    modalR.show(view);
};

exports.closeModal = function (modalSize){

    if (!modalSize) {
        modalSize = 'medium';
    }

    var modalR = exports.getModalRegion(modalSize);

    if (modalR.hasView()) {
        modalR.currentView.triggerMethod('close:modal');
    }

};



exports.restartInactivityTimer = function() {
//debugger
    // if we already have a scheduled timer, cancel it before the new one is created
    if (typeof internals.inactivityTimerId === 'number') {
        clearInterval(internals.inactivityTimerId);
    }

    var idleWarningTimeout = Radio.channel('public').request('startupDataM').get('IdleWarningTimeout');
    internals.inactivityTimerId = setTimeout(exports.showInactivityModal, idleWarningTimeout * 1000);
};


exports.addActivityListener = function() {

    if (internals.hasActivityListener) {
        return;
    }
    
    var eventName = global.PointerEvent ? 'pointerdown' : 'mousedown';

    // any touch/click in any part of the applicatoin is suficient to restart the inactivity timer,
    // but there are exceptions

    $('body').on(eventName, function(e){
//debugger
        // exception: don't restart the inactivity timer if we are showing the inactivy modal 
        // ("attention please: the kiosk will restart in x seconds" )
        if ($('div[data-id="inactivity-modal"]').length > 0) {
            return;
        }

        exports.restartInactivityTimer();
    });

    // manual trigger the callback above, so that restartInactivityTimer in called
    $('body').trigger(eventName);
    internals.hasActivityListener = true;
};

exports.getCurrentLang = function(){

    var startupDataM = Radio.channel('public').request('startupDataM');

    return Radio.channel('public').request('currentLang') || startupDataM.get('defaultLanguage');
};

exports.getCurrentKbLayout = function(){

    var currentLang = this.getCurrentLang().toLowerCase();
    var layout = 'qwerty';  // default layout (english)

    if (currentLang === 'pt-pt') {
        layout = 'portuguese-qwerty';
    }
    else if (currentLang === 'es-es') {
        layout = 'spanish-qwerty';
    }
    else if (currentLang === 'fr-fr') {
        layout = 'french-azerty-1';
    }
    else if (currentLang === 'de-de') {
        layout = 'german-qwertz-1';
    }

    return layout;
};


// current language can be set from the query string
exports.setCurrentLang = function(request){

    var startupDataM = Radio.channel('public').request('startupDataM');

    var currentLang = Radio.channel('public').request('currentLang') || startupDataM.get('defaultLanguage');
    if (request.query.lang) {
        currentLang = request.query.lang;
    }

    Radio.channel('public').reply('currentLang', currentLang);

    // update the fecha library
    Fecha.i18n = {

        dayNames: [
            exports.getText(100),
            exports.getText(101),
            exports.getText(102),
            exports.getText(103),
            exports.getText(104),
            exports.getText(105),
            exports.getText(106)
        ],

        dayNamesShort: [
            exports.getText(64),
            exports.getText(65),
            exports.getText(66),
            exports.getText(67),
            exports.getText(68),
            exports.getText(69),
            exports.getText(70)
        ],

        monthNames: [
            exports.getText(107),
            exports.getText(108),
            exports.getText(109),
            exports.getText(110),
            exports.getText(111),
            exports.getText(112),
            exports.getText(113),
            exports.getText(114),
            exports.getText(115),
            exports.getText(116),
            exports.getText(117),
            exports.getText(118),
        ],

        monthNamesShort: [
            exports.getText(52),
            exports.getText(53),
            exports.getText(54),
            exports.getText(55),
            exports.getText(56),
            exports.getText(57),
            exports.getText(58),
            exports.getText(59),
            exports.getText(60),
            exports.getText(61),
            exports.getText(62),
            exports.getText(63),
        ],
    }

};

// d1, d2 should be 2 native Date objects, constructed using a string in the format 'YYYY-MM-DD'
exports.getNumNights = function (d1, d2){

    return Math.round((d2.getTime() - d1.getTime()) / 86400000);
};

exports.resetSingletons = function(){

    Radio.channel('public').reply('searchData', undefined);
    Radio.channel('public').reply('allGuests', undefined);
    Radio.channel('public').reply('currentReservation', undefined);
};

exports.getText = function(defaultText, textIndex) {

    if (typeof defaultText === 'number') {
        textIndex = defaultText;
        defaultText = '';
    }

    var currentLang = Radio.channel('public').request('currentLang'); 
    var suffix = '';

    var a = global.Host.texts[currentLang];
    if (!a) {
        a = [];
        //suffix += ' [language ' + currentLang + ' is missing]';
    }
    
    var t = a[textIndex];

    // if the text is missing for a given language, use the equivalent in english as default
    if (!t) {
        t = global.Host.texts['en-GB'] && global.Host.texts['en-GB'][textIndex];
    }

    // if it is still missing, use the hardcoded text (given in the first parameter)
    if (!t) {
        t = defaultText;
        //suffix += ' [text ' + textIndex + ' is missing in ' + currentLang + ']';

        if (global.document) {
            console.log('WARNING: text ' + textIndex + ' is missing in ' + currentLang);
        }
    }

    return t + suffix;
};


exports.datepicker = {};

// 'JAN', 'FEB', 'MAR', etc
exports.datepicker.getMonths = function(){

    return [
        exports.getText(40),
        exports.getText(41),
        exports.getText(42),
        exports.getText(43),
        exports.getText(44),
        exports.getText(45),
        exports.getText(46),
        exports.getText(47),
        exports.getText(48),
        exports.getText(49),
        exports.getText(50),
        exports.getText(51)
    ];
};

// 'Jan', 'Feb', 'Mar', etc
exports.datepicker.getMonthsShort = function(monthIndex){

    var months = [
        exports.getText(52),
        exports.getText(53),
        exports.getText(54),
        exports.getText(55),
        exports.getText(56),
        exports.getText(57),
        exports.getText(58),
        exports.getText(59),
        exports.getText(60),
        exports.getText(61),
        exports.getText(62),
        exports.getText(63)
    ];

    var i = parseInt(monthIndex, 10);

    if(!i){
        return months;
    }

    return months[monthIndex - 1];
};

// 'S', 'M', 'T', etc
exports.datepicker.getDaysMin = function(){

    return [
        exports.getText(64),
        exports.getText(65),
        exports.getText(66),
        exports.getText(67),
        exports.getText(68),
        exports.getText(69),
        exports.getText(70),
        exports.getText(71)
    ];
};

exports.adjustMainContentPosition = function(pixels, layout) {

    if (layout === undefined) {
        layout = 'vertical';
    }

    // global jquery lookup
    if (layout === 'vertical') {
        $('nav').first().css('padding-top', pixels - 90);
        $('div.page-header > div.container').css('padding-top', pixels);
    }

}


exports.replaceTextVariables = function(textToPrint, data){

    var currentReservation = Radio.channel('public').request('currentReservation');

    return textToPrint
            .replace('@GuestName', currentReservation.get('mainGuestFirstName') + ' ' + currentReservation.get('mainGuestLastName'))
            .replace('@ReservationNumber', currentReservation.get('resno'))
            .replace('@CheckIn', Fecha.format(currentReservation.get('CheckInNative'), 'dddd, D/MMMM/YYYY'))
            .replace('@CheckOut', Fecha.format(currentReservation.get('CheckOutNative'), 'dddd, D/MMMM/YYYY'))
            .replace('@Room', currentReservation.get('roomFormatted'))
            .replace('@DoorCode', currentReservation.get('kabaKeyCode'))
            .replace('@WiFiNetwork', currentReservation.get('wifiUser'))
            .replace('@WiFiPassword', currentReservation.get('wifiPwd'))
};

exports.saveToLocalStorage = function(key, value){

    if (value === undefined){
        value = key;
        key = new Date().toISOString();
    }
    
    try {
        if (typeof value !== 'string'){
            value = JSON.stringify(value);
        }

        global.localStorage.setItem(key, value);
    }
    catch(e){
        global.localStorage.setItem(key, 'ERROR: ' + e.message);
    }
    
};




exports.sendEmail = function(options){


    // TODO: hard-coded for Hello Lisbon (but can be changed in the texts)
    var currentReservationM = Radio.channel('public').request('currentReservation');
    var subjectText = `${ exports.getText('Your reservation at Hello Lisbon ', 170) } (${ exports.getText('Apartment', 130) } ${ currentReservationM.get('roomFormatted') })`;

    data = {
        To: options.toEmailAddress,
        Subject: subjectText,
        Body: options.bodyText
    }

    var p = Q($.ajax({
        url: exports.getAreaUrl('/api/SendMail'),
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json; charset=utf-8',
        //dataType: 'json'
    }));

    return p;
};

exports.getRootUrl = function(url){

    url = url.trim();
    if (url.charAt(0) !== '/') {
        url = '/' + url;
    }

    return global.Host.rootPath + url;
}

exports.getAreaUrl = function(url){

    url = url.trim();
    if (url.charAt(0) !== '/') {
        url = '/' + url;
    }

    return global.Host.areaPath + url;
}

exports.getAreaStaticUrl = function(url){

    url = url.trim();
    if (url.charAt(0) !== '/') {
        url = '/' + url;
    }

    return global.Host.areaFullPath + url;
}


// new methods for BI

// 1000.321 -> "€ 1.3 K", 1000000.789 -> "€ 1.7 M", etc
exports.getFormattedNumber = function(value, valueType, options){

    if (options === undefined) {
        options = { 
            precision: undefined,
            html: true
        }
    };

    // support legacy signature (temporary)
    if (typeof options === 'number') {
        options = { 
            precision: options,
            html: true
        }
    }

    var valueAbs = Math.abs(value);
    var valueFormatted = '';

    if (valueType === undefined) {
        valueType = 'money'
    }

    if (valueType === 'money') {

        var currency = '€';
        var precision = options.precision || 0;

        if (valueAbs >= 0 && valueAbs < 1000) {
            valueFormatted = (valueAbs / 1).toFixed(precision);
            if (options.html) {
                valueFormatted = '<span style="margin-right: 2px">' + currency + '</span>' + valueFormatted + '';
            }
            else {
                valueFormatted = currency + ' ' + valueFormatted;
            }
        }
        else if (valueAbs >= 1000 && valueAbs < 1000000) {
            valueFormatted = (valueAbs / 1000).toFixed(precision);
            if (options.html) {
                valueFormatted = '<span style="margin-right: 2px">' + currency + '</span>' + valueFormatted + '<span style="margin-left: 2px">K</span>';    
            }
            else {
                valueFormatted = currency + ' ' + valueFormatted + ' K';
            }
            
        }
        else if (valueAbs >= 1000000) {
            valueFormatted = (valueAbs / 1000000).toFixed(precision);
            if (options.html) {
                valueFormatted = '<span style="margin-right: 2px">' + currency + '</span>' + valueFormatted + '<span style="margin-left: 2px">M</span>';    
            }
            else {
                valueFormatted = currency + ' ' + valueFormatted + ' M';
            }
            
        }
    }
    else if (valueType === 'percentage') {

        var precision = options.precision || 0;
        valueFormatted = (value / 1).toFixed(precision);
        valueFormatted = valueFormatted + (options.html ? '<span style="margin-left: 2px">%</span>' : ' %'); 
    }
    else if (valueType === 'percentagePoints') {

        var precision = options.precision || 0;
        valueFormatted = (value / 1).toFixed(precision) + '<span style="margin-left: 2px"><em>p.p.</em></span>';
    }
    else if (valueType === 'int') {
        // like the money case, but do not add the suffix; the precision, if not given, is also adjusted according to the 
        // value
        var precision;

        if (valueAbs >= 0 && valueAbs < 1000) {
            precision = options.precision
            if (typeof precision === 'undefined') { precision = 0 }

            valueFormatted = (valueAbs / 1).toFixed(precision);
            valueFormatted = valueFormatted + '';
        }
        else if (valueAbs >= 1000 && valueAbs < 1000000) {
            precision = options.precision
            if (typeof precision === 'undefined') { precision = 2 }

            valueFormatted = (valueAbs / 1000).toFixed(precision);
            valueFormatted = valueFormatted + (options.html ? '<span style="margin-left: 2px">K</span>' : ' K'); 
        }
        else if (valueAbs >= 1000000) {
            precision = options.precision
            if (typeof precision === 'undefined') { precision = 1 }

            valueFormatted = (valueAbs / 1000000).toFixed(precision);
            valueFormatted = valueFormatted + (options.html ? '<span style="margin-left: 2px">M</span>' : ' M');
        }

    }
    else {
        throw new Error('unknown data type (must be "money" or "percentage")')
    }

    return valueFormatted;
}

exports.activateSelectpicker = function(options) {

    var defaultOptions = {
        style: 'btn-default',
    }

    this.$('select').selectpicker(_.extend({}, defaultOptions, options));
};

exports.getConfig = function(key) {

    if (key === undefined) {
        return global.Host.config;
    }

    if (typeof key !== 'string') {
        return undefined;
    }

    // all keys in global.Host.config have been previously lower-cased
    return global.Host.config[key.toLowerCase()];
};

// wrapper around DateFns.format for a generalized use (can be used with a date object
// or with an object containing dates); 
exports.dateFnsFormat = function (date, format = 'YYYY-MM-DD'){

    let out;

    if (typeof format !== 'string') { format = 'YYYY-MM-DD' }

    if (_.isString(date)) {
        // we assume it is already a date in the desired format, so nothing to do
        out = date;
    }
    else if (_.isDate(date)){
        out = DateFns.format(date, format);
    }
    else if (Array.isArray(date)) {
        // we assume all values in the array are dates
        out = [];
        for (let i = 0; i < date.length; i++) {
            out.push(DateFns.format(date[i], format))
        }
    }
    else if (_.isObject(date)) {
        // we assume all values in the object are dates
        out = {};
        for (let key in date) {
            out[key] = DateFns.format(date[key], format);
        }
    }

    return out;
};
