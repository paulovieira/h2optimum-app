let $ = require('jquery');
let Radio = require('backbone.radio');

$(document).on('click', '.popover .dropdown-item', function(ev){

	let popoverId = $(this).closest('div.popover').attr('id');
	Radio.channel('popover').trigger('popover:item:clicked', popoverId);
});

exports.controller = exports.controllerConfig = {
    trigger: 'focus',
    //trigger: 'manual',
    placement: 'bottom',
    html: true,
    template: `
        <div class="popover" role="tooltip">
            <div class="arrow"></div>
            <h3 class="popover-header"></h3>
            <div class="popover-body" style="padding: 3px 0 0 0;"></div>
        </div>
    `,
    content: `
        <a class="dropdown-item" style="margin: 0; padding: 6px 25px;" href="#">Edit</a>
        <a class="dropdown-item" style="margin: 0; padding: 6px 25px;" href="#">Delete</a>
    `,

};
