The original module expects to find a property window.jQuery or window.$, which we don't have. 

However we have a 'jQuery' variable that is injected in the scope of the module by the imports-loader plugin. See the diff for more details.