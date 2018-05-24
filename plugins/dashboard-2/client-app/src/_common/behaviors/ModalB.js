var $ = require('jquery');
var Mn = require('backbone.marionette');
var _ = require('underscore');

var Behavior = Mn.Behavior.extend({

    initialize: function(options) {

        // a view with this behavior can be given a onCloseModal method in the instance options 
        // (useful to proceed with some action after the modal is closed)
        this.view.onCloseModal = this.view.options.onCloseModal || function(){};

        var defaultModalOptions = {};
        this.options.modalOptions = _.extend(defaultModalOptions, options.modalOptions);
    },

    onCloseModal: function(){

        this.bootstrapHideModal();
    },

    onAttach: function(){

        // at this point the modal's html is already in DOM (in the modal region, whose element is div.modal-content),
        // but it's not visible yet; we show it via bootstrap's javascript api; see:
        // https://getbootstrap.com/docs/4.0/components/modal/

        // this allows to trigger custom events at the correct instants;
        // also check Utils.createModalRegions to see the html structure for bootstrap modals

        this.createListeners();
        this.bootstrapShowModal();
    },

    onDestroy: function() {

        delete this.view._modalRegion;
    },

    getModalContainer: function() {

        var modalEl = this.view.$el
                                .parent()  // will be a div.modal-content (the region's element)
                                .parent()  // will be a div.modal-dialog
                                .parent()  // will be a div.modal

        return modalEl;
    },

    createListeners: function() {

        var self = this;

        var modalContainerEl = this.getModalContainer();

        //modalContainerEl.one('hide.bs.modal', function(e){});

        modalContainerEl.one('hidden.bs.modal', function(e){

            self.view.triggerMethod('hidden:bs:modal');
            self.view._modalRegion.empty();
        });

        // when the modal is visible to the user (will wait for CSS transitions to complete, etc),
        // the 'shown:bs:modal' event is triggered in the modal's container element;
        // we forward this event to the view; this is useful to start other plugins/libs that
        // requires the modal to fully loaded (example: creating an instance of a leaflet map)

        modalContainerEl.one('shown.bs.modal', function(e){

            self.view.triggerMethod('shown:bs:modal');
        });
    },

    // boostrap modal API (via javascript)
    bootstrapShowModal: function() {

        // at this point the modal region has the html of the view, but it's not visible yet;
        // here we actually show the modal
        var modalContainerEl = this.getModalContainer();
        var options = _.extend({ show: true }, this.options.modalOptions);

        modalContainerEl.modal(options);
    },

    bootstrapHideModal: function() {

        // when the internal view event 'close:modal' is triggered, we close the modal via bootstrap's javascript api; 
        // this will trigger the 'hide.bs.modal' and 'hidden.bs.modal' events, which we use empty the modal region being used

        var modalContainerEl = this.getModalContainer();
        var options = 'hide';

        modalContainerEl.modal(options);
    }

});

module.exports = Behavior;
