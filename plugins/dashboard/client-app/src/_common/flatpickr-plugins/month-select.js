var _ = require('underscore');

function monthSelectPlugin(pluginConfig) {
    return function (fp) {

        var pluginConfigDefaults = {
            xyz: 123
        };

        var handlers = [];

        // TODO: do not change the original object
        pluginConfig = _.extend({}, pluginConfigDefaults, pluginConfig || {})

        function onMonthNavClick(e) {
            //debugger;

            if (e.target.className.indexOf('cur-month') >= 0) {
                return;
            }

            /*
            var isPrevMonth = self.prevMonthNav.contains(e.target);
            var isNextMonth = self.nextMonthNav.contains(e.target);

            if (isPrevMonth || isNextMonth) changeMonth(isPrevMonth ? -1 : 1);else if (e.target === self.currentYearElement) {
                e.preventDefault();
                self.currentYearElement.select();
            } else if (e.target.className === "arrowUp") self.changeYear(self.currentYear + 1);else if (e.target.className === "arrowDown") self.changeYear(self.currentYear - 1);
            */
        }

        function bind(element, event, handler) {

            element.addEventListener(event, handler);
            handlers.push({element, event, handler});
        }

        function onClick(handler) {
            return evt => evt.which === 1 && (handler(evt));
        }

        return {

            onChange:  function (selectedDates, dateStr, fp) {
                //debugger;
            },
            onOpen: function (selectedDates, dateStr, fp) {
                //debugger;
            },
            onClose: function (selectedDates, dateStr, fp) {
                //debugger;
            },
            onMonthChange:  function (selectedDates, dateStr, fp) {
                //debugger;
            },
            onYearChange:  function (selectedDates, dateStr, fp) {
                //debugger;
            },


            onReady: function (selectedDates, dateStr, fp) {
                //debugger;
                bind(fp.monthNav, "mousedown", onClick(onMonthNavClick));
            },

            onDestroy: function () {
                //debugger;
                for (var i = handlers.length; i--;) {
                    var h = handlers[i];
                    h.element.removeEventListener(h.event, h.handler);
                }
            },

            onValueUpdate: function(selectedDates, dateStr, fp) {
                //debugger;
            },
            onDayCreate: function(selectedDates, dateStr, fp, dayElem) {
                //// debugger;
            },

            onParseConfig: function (selectedDates, dateStr, fp) {
                //debugger;
            },
            onKeyDown: function (selectedDates, dateStr, fp) {
                //debugger;
            },
        };
    };
}

module.exports = monthSelectPlugin;
