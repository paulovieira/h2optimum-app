var Backbone = require('backbone');
var Radio = require('backbone.radio');
var _ = require('underscore');
var Utils = require('../_common/utils');
var GuestC = require('../_entities/GuestC');
var GuestM = require('../_entities/GuestM');

internals = {};

var ReservationM = Backbone.Model.extend({

    initialize: function(){

        this.on('change:guest', function(model, value){

            var fullName = value.split(',');
            this.set('mainGuestLastName', fullName[0]);
            this.set('mainGuestFirstName', fullName[1]);
        });


        this.on('change:CheckInFixedFormat', function(model, value){

            //var weekDayIndex = new Date(value).getDay();
            //this.set('CheckInWeekDay', internals.weekDayIndexToText[weekDayIndex]);

            this.set('CheckInNative', new Date(value));
        });

        this.on('change:CheckOutFixedFormat', function(model, value){

            //var weekDayIndex = new Date(value).getDay();
            //this.set('CheckOutWeekDay', internals.weekDayIndexToText[weekDayIndex]);

            this.set('CheckOutNative', new Date(value));
        });

        this.on('change:CheckOutFixedFormat', function(model, value){

            var d1 = new Date(this.get('CheckInFixedFormat'));
            var d2 = new Date(value);
            this.set('nights', Utils.getNumNights(d1, d2));
        });

        this.on('change:room', function(model, value){

            // IMPORTANT - HARDCODED FOR HELLO LISBON (remove the first 2 letters of the apartment name, 
            // because they are relative to the building)
            var isLetter = /^[a-zA-Z\s]$/;

            if (isLetter.test(value[0]) && isLetter.test(value[1])) {
                value = value.substring(2);
            }

            this.set('roomFormatted', value);
        });


        this.on('change', this.computeProperties);
    },

    parse: function(response, options){

        // place the properties that are directly in the object into the first entry of 'data'

        if(Array.isArray(response.data) === false || response.data.length === 0){
            response.data = [{}];
        }

// debug - simulate a room name from HelloLisbon
// response.data[0].room = 'RS5E';

        response.data[0]['reservationFound'] = response.reservationFound;


        if(response.paymentRequest) {
            response.paymentRequest.ReservationTotalPriceWithCityTax = response.paymentRequest.ReservationTotalPrice + response.paymentRequest.CityTaxAmount;

            var currency = 'EUR';

            // formatted version of the paymentRequest properties. Example: 123.4 => "123.40 EUR"
            response.paymentRequestFormatted = {};
            response.paymentRequestFormatted.ReservationTotalPrice = response.paymentRequest.ReservationTotalPrice.toFixed(2) + ' ' + currency;
            response.paymentRequestFormatted.CityTaxAmount = response.paymentRequest.CityTaxAmount.toFixed(2) + ' ' + currency;
            response.paymentRequestFormatted.ReservationTotalPriceWithCityTax = response.paymentRequest.ReservationTotalPriceWithCityTax.toFixed(2) + ' ' + currency;
            response.paymentRequestFormatted.ReservationPayments = response.paymentRequest.ReservationPayments.toFixed(2) + ' ' + currency;
            response.paymentRequestFormatted.PaymentAmount = response.paymentRequest.PaymentAmount.toFixed(2) + ' ' + currency;
        }

        response.data[0]['paymentRequest'] = response.paymentRequest;
        response.data[0]['paymentRequestFormatted'] = response.paymentRequestFormatted;        

        response.data[0]['pendingDeposits'] = response.pendingDeposits;

        response.data[0]['hasKabaKeyCode'] = response.hasKabaKeyCode;
        response.data[0]['kabaKeyCode'] = response.kabaKeyCode;

        if (response.kabaKeyCodeErrMessage) {
            console.log('kabaKeyCodeErrMessage: ', response.kabaKeyCodeErrMessage);
        }

        response.data[0]['wifiUser'] = response.wifiUser;
        response.data[0]['wifiPwd'] = response.wifiPwd;

        if (response.wifiDebugInfo) {
            console.log('wifiDebugInfo: ', response.wifiDebugInfo);
        }

        response.data[0]['hadMultiRoom'] = !!response.hadMultiRoom;
        response.data[0]['hasMultiRoom'] = response.hasMultiRoom;
        response.data[0]['multiRoomList'] = response.multiRoomList;

        response.data[0]['externalReservationNumber'] = response.externalReservationNumber || '';
    
        this.createGuestsCollection(response.guestList);
        return response.data[0];
    },

    createGuestsCollection: function(guestList){

        if (!guestList){
            guestList = []
        }

        // hardcoded for Hello Lisbon - force removal of booking.com email addresses
        guestList.forEach(obj => {

            obj.email = obj.email || '';
            if (obj.email.indexOf('@guest.booking.com') >= 0) {
                obj.email = '';
            }
        });

        var guestC = new GuestC;

        // use .set to make sure the 'change' events are triggered
        var totalhospede = guestList.length;
        guestList.forEach((guestData, i) => {

            var model = new GuestM;
            model.set(_.extend(guestData, {
                numhospede: i + 1,
                totalhospede: totalhospede,
            }));

            guestC.add(model);
        });

        Radio.channel('public').reply('allGuests', guestC);
    },

    computeProperties: function(){

        var totalChildren = this.get('children') + this.get('children2') + this.get('children3');

        this.set({
            totalChildren: totalChildren
        }, { 
            silent: true 
        });
    }

});

module.exports = ReservationM;
