define([
    'jquery',
    'React'
], function($, React) {

  'use strict';

  var conjthisMain = {};


  conjthisMain.init = function(){

    $(document).ready(function(){
      React.renderComponent(
        React.DOM.h1({}, "Hello, world!"),
        document.getElementById('app')
      );
    });
  };

  return conjthisMain;
});
