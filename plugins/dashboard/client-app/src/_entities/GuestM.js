var Backbone = require('backbone');
var Radio = require('backbone.radio');
var Utils = require('../_common/utils');

var GuestM = Backbone.Model.extend({

    initialize: function(){

        this.on('change:birthdate', this.setBirthdatefixed);
        this.on('change:doctype', this.setDocDescription);
        this.on('change:docval', this.setDocvalfixed);
        this.on('change:nationality_iso', this.setNationality);
        this.on('change:country_iso', this.setCountry);
    },

    defaults: {

        numreserva: 0,
        ResId: 0,
        DetailId: 0,
        IsMainGuest: false,
        name: '',
        surname: '',
        birthdate: '',
        birthdatefixed: null,
        nationality: null,
        nationality_iso: '',
        doctype: 0,
        docdescription: 0,
        docid: '',
        docval: '',
        docvalfixed: '',
        address1: '',
        address2: '',
        postalcode: '',
        locality: '',
        country: null,
        country_iso: '',
        email: '',
        phone: '',
        mobile: '',
        guestid: 0,
        numhospede: 0,
        totalhospede: 0,

        _isAbsent: false
    },

    setBirthdatefixed: function (model, value) { 

        // doesn't make sense to show a date like '0000-01-01'
        var a = value.split(' ');
        if (a.length > 1) { 
            value = a[0] 
        }

        if (new Date(value).getTime() < new Date('1900-01-01').getTime()){
            this.set('birthdate', '', { silent: true });
            this.set('birthdatefixed', '', { silent: true });
            return;
        }

        var isoDate = new Date(value).toISOString().split('T')[0];
        var y = isoDate.split('-')[0];
        var m = isoDate.split('-')[1];
        var d = isoDate.split('-')[2];

        this.set('birthdate', `${ y }-${ m }-${ d }`, { silent: true });
        this.set('birthdatefixed', `${ d }-${ Utils.datepicker.getMonthsShort(m) }-${ y }`);
    },

    // same logic as above
    setDocvalfixed: function(model, value) { 

        var a = value.split(' ');
        if (a.length > 1) { 
            value = a[0] 
        }

        if (new Date(value).getTime() < new Date('1900-01-01').getTime()){
            this.set('docval', '', { silent: true });
            this.set('docvalfixed', '', { silent: true });
            return;
        }

        var isoDate = new Date(value).toISOString().split('T')[0];
        var y = isoDate.split('-')[0];
        var m = isoDate.split('-')[1];
        var d = isoDate.split('-')[2];

        this.set('docval', `${ y }-${ m }-${ d }`, { silent: true });
        this.set('docvalfixed', `${ d }-${ Utils.datepicker.getMonthsShort(m) }-${ y }`);
    },

    setDocDescription: function(model, value) { 

        if (parseInt(value) === 1) {
            this.set('docdescription', Utils.getText(30))
        }
        else if (parseInt(value) === 2) {
            this.set('docdescription', Utils.getText(29))
        }
    },

    setNationality: function(model, isoCode) { 

        if (!isoCode) { return }
            
        this.setCountryName({ attribute: 'nationality', isoCode: isoCode });
    },

    setCountry: function(model, isoCode) { 

        if (!isoCode) { return }

        this.setCountryName({ attribute: 'country', isoCode: isoCode });
    },    

    setCountryName: function(options){

        var startupDataM = Radio.channel('public').request('startupDataM');

        // countryList is the correct array of objects
        var countryList = startupDataM.get('CountryList2')[Utils.getCurrentLang().toLowerCase()];
        var countryObj = countryList.filter(obj => obj.CountryIsoCode.toLowerCase() === options.isoCode.toLowerCase());

        if (countryObj[0]) {
            this.set(options.attribute, countryObj[0].CountryName);
        }
    },

});

module.exports = GuestM;
