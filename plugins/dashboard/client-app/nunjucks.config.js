module.exports = function(env){

    env.addFilter('getFullYear', function(){

        return String(new Date().getFullYear())
    });

    env.addFilter('getText', function(textId){

        return window.HOST.texts[textId] || (textId + ' (missing translation)');
    });


};
