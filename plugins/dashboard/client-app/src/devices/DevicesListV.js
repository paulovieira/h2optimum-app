let $ = require('jquery');
let Q = require('q');
let _ = require('underscore');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
let Radio = require('backbone.radio');

//let Flatpickr = require('flatpickr')
let DateFns = require('date-fns');
//let Billboard = require('billboard.js');

let Utils = require('../_common/utils');
let AddOrEditDeviceV = require('./AddOrEditDeviceV');
let DeleteDeviceV = require('./DeleteDeviceV');
let PopoverConfig = require('../_config/popover');

let internals = {};

let View = Mn.View.extend({

    initialize: function(){

        // var groupId = Math.ceil(Math.random() * 3);
        // this.model.set({ groupId: groupId})
        
        this.listenTo(Radio.channel('popover'), 'popover:item:clicked', (action, entityId) => {

            if (action === 'edit-device') {

                let device = this.model.get('collection').filter(obj => obj.id === entityId)[0];
                let deviceM = new Backbone.Model(device);
                this.openEditDeviceModal(deviceM);
            }
            else if (action === 'delete-device') {

                let device = this.model.get('collection').filter(obj => obj.id === entityId)[0];
                let deviceM = new Backbone.Model(device);
                this.openDeleteDeviceModal(deviceM);
            }
            
        })
        //Radio.channel('popover').listenTo('popover:item:clicked', popoverId);
        //Radio.channel('popover').on('popover:item:clicked', function(popoverId){
        //    debugger
        //});

        this.refreshList();
    },

    ui: {
        'add-controller': '[data-id="add-controller"]',
        'device-options': 'table tr a',
    },

    events: {
        'click @ui.add-controller': 'onClickAddController',
    },

    onAttach: function() {

    },

    onRender: function () {

        this.getUI('device-options').each((i, el) => {

            //debugger
            let popoverDeviceConfig = _.extend({}, PopoverConfig.baseConfig);
            let deviceId = $(el).data('device-id');

            popoverDeviceConfig.content = `
                <a data-entity-id=${ deviceId } data-action="edit-device" class="dropdown-item" style="margin: 0; padding: 6px 25px;" href="#">Edit</a>
                <a data-entity-id=${ deviceId } data-action="delete-device" class="dropdown-item" style="margin: 0; padding: 6px 25px;" href="#">Delete</a>
            `;

            $(el).popover(popoverDeviceConfig);

        })

        
    },

    onClickAddController: function (ev) {

        let deviceM = new Backbone.Model({
            id: undefined,
            installationId: this.model.get('installationId')
        })

        this.openEditDeviceModal(deviceM);
    },

    openEditDeviceModal: function(deviceM){

        var addOrEditDeviceV = new AddOrEditDeviceV({
            model: deviceM,
            onCloseModal: options => {

                if (options.refreshList) {
                    this.refreshList();    
                }
            }
        });

        Utils.showAsModal(addOrEditDeviceV, 'small');        
    },

    openDeleteDeviceModal: function(deviceM){

        var deleteDeviceV = new DeleteDeviceV({
            model: deviceM,
            onCloseModal: options => {

                if (options.refreshList) {
                    this.refreshList();    
                }
            }
        });

        Utils.showAsModal(deleteDeviceV, 'small');        
    },

    fetchData: function() {

        let data = {
            installationId: this.model.get('installationId')
        };

        let p = Q($.ajax({
            url: '/api/get-devices',
            type: 'GET',
            data: data,
        }));

        p = p.then(response => {

            response.forEach(obj => {

                obj.lastReadingFormatted = DateFns.format(obj.lastReading, 'D/MMM HH:MM')
            })
            Radio.channel('public').reply('devices', response);
            this.model.set('collection', response)
            
        })
        
        p = p.catch(err => {
            debugger
            // TODO: what errors can happen here?
            alert('ERROR')            
        })

        return p;
    },

    refreshList: function() {

        this.fetchData().then(() => { this.render() })
    }

});



module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
