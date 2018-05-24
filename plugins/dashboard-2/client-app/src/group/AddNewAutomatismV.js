let $ = require('jquery');
let Backbone = require('backbone');
let Mn = require('backbone.marionette');
//let Radio = require('backbone.radio');

let internals = {};

internals.StepViews = [
    require('./AutomatismStep1V'),
    require('./AutomatismStep2V'),
    require('./AutomatismStep3V'),
    require('./AutomatismStep4V'),
];

let View = Mn.View.extend({


    initialize: function(){
    },

    ui: {
        'save': 'button[data-id="save"]',
        'close': 'button[data-id="close"]',

        'wizard-container': '[data-id="wizard-container"]',
        //'wizard-nav': '[data-id="wizard-nav"]',
        'wizard-nav': '[data-id="wizard-container"] > ul',
        'wizard-nav-items': '[data-id="wizard-container"] > ul > li',

        'wizard-previous': '[data-id="wizard-previous"]',
        'wizard-next': '[data-id="wizard-next"]',
        'wizard-finish': '[data-id="wizard-finish"]',

        'region-step-0': '[data-region-id="step-0"]',
        'region-step-1': '[data-region-id="step-1"]',
        'region-step-2': '[data-region-id="step-2"]',
        'region-step-3': '[data-region-id="step-3"]',
    },

    events: {
        'click @ui.save': 'save',
        'click @ui.close': 'closeModal'
    },

    behaviors: [
        {
            behaviorClass: require('../_common/behaviors/ModalB'),

            // reference: https://getbootstrap.com/docs/4.0/components/modal/
            modalOptions: {
                backdrop: 'static',  // use a backdrop which doesn't close the modal on click
            }
        },
    ],

    regions: {
        'step-0': '@ui.region-step-0',
        'step-1': '@ui.region-step-1',
        'step-2': '@ui.region-step-2',
        'step-3': '@ui.region-step-3',
    },

    onRender: function () {

        this.initWizard();        
    },

    closeModal: function(e, options){

        options = options || {};
        this.triggerMethod('close:modal', options);
    },

    initWizard: function( ){

        var $wizard   = this.getUI('wizard-container');
        
        var view = this;

        this.getUI('wizard-container').bootstrapWizard({
          tabClass: this.getUI('wizard-nav'),
          nextSelector: this.getUI('wizard-next'),
          previousSelector: this.getUI('wizard-previous'),
          finishSelector: this.getUI('wizard-finish'),

          onTabClick: function (tab, navigation, index) {

            return false;

            //if (view.getUI('wizard-container').is('[data-navigateable="true"]') === false) {
            //    return false;
            //}

          },


          onNext: function (tab, navigation, index) {
            //debugger
          },


          onPrevious: function (tab, navigation, index) {
            //debugger
          },


          onTabShow: function (tab, navigation, index) {

            // 1 - if we are in the last step, swap the 'next' button for the 'finish' button

            let max = view.getUI('wizard-container').bootstrapWizard('navigationLength');
            if (index === max) {
                view.getUI('wizard-next').addClass('d-none');
                view.getUI('wizard-finish').removeClass('d-none');
            }
            else {
                view.getUI('wizard-next').removeClass('d-none');
                view.getUI('wizard-finish').addClass('d-none');
            }

            // 2 - for the first step, update the cursor style on the previous button

            let cursorStyle = (index === 0) ? 'default' : 'pointer';
            view.getUI('wizard-previous').css('cursor', cursorStyle);

            // 3 - update the 'complete' and 'processing' visual status (reset)

            let $navItems = view.getUI('wizard-nav-items');

            $navItems.removeClass('processing');
            $navItems.removeClass('complete');

            $navItems.each((i, el) => {

                if (i < index) {
                    $(el).addClass('complete')
                }
                else if (i === index) {
                    $(el).addClass('processing');    
                }
                else {
                    // do nothing
                }
            });

            // 4 - update the view in the pane
            //debugger

            // if the pane/region has a view already, it means the "previous" button of the wizard was clicked;
            // in that case don't recreate the view
            let regionName = `step-${ index }`;
            if (view.getRegion(regionName).hasView()) { return }

            let stepViewClass = internals.StepViews[index];
            let stepView = new stepViewClass({
                model: new Backbone.Model
            });

            view.getRegion(regionName).show(stepView);

          },


          onFinish: function (tab, navigation, index) {

            var $nav = view.getUI('wizard-nav-items').eq(index);
            $nav.addClass('complete').removeClass('processing');


            view.getUI('wizard-previous').prop('disabled', true);
            view.getUI('wizard-next').prop('disabled', true);
            view.getUI('wizard-finish').prop('disabled', true);

            setTimeout(() => {

                view.getUI('close').trigger('click')
            }, 500)
          },



        });

    }
});


module.exports = View;


// this directive will read the template associated to this file, compile it and assign to module.exports.prototype.template;
// see the StringReplacePlugin for more details

// @insert-nunjucks-template
