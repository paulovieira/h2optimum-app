//let $ = require('jquery');
let Mn = require('backbone.marionette');

let Behavior = Mn.Behavior.extend({

    ui: {
        'all-bootstrap-select': 'select.selectpicker'
    },

    events: {
        'changed.bs.select @ui.all-bootstrap-select': 'onChangedOption'
    },

    onRender: function (){

        this.getUI('all-bootstrap-select').selectpicker({
            iconBase: '',
            tickIcon: 'ti-check',
            style: 'btn-light'
        });

        this.getUI('all-bootstrap-select').siblings('div.dropdown-menu').each((i, el) => {

            // if the first option of the select is both disabled and selected, we assume it's a placeholder (dummy)
            // "choose option" option; in that case we hide the icon and change the style a bit
            $firstOption = $(el).find('a.dropdown-item').first();

            if ($firstOption.hasClass('disabled') && $firstOption.hasClass('selected')) {
                $firstOption.css({ 'padding-top': '0', 'padding-bottom': '0', 'font-size': '85%' });
                $firstOption.find('span').last().css('display', 'none');
            }
        })
    },

    onChangedOption: function (ev) {

        let $originalSelect = $(ev.target);
        let $placeholderOption = $originalSelect.children().first();

        if ($placeholderOption.attr('disabled') !== undefined && $placeholderOption.attr('selected') !== undefined) {
            $placeholderOption.remove();
            $originalSelect.selectpicker('refresh');
        }
    },

    onBeforeDestroy: function () {

        this.getUI('all-bootstrap-select').selectpicker('destroy');
    }

});

module.exports = Behavior;
