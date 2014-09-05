require.config({
  paths: {
    underscore: 'public/lib/underscore/underscore',
    Backbone: 'public/lib/backbone/backbone',
    React: 'public/lib/react/react',
    jquery: 'public/lib/jquery/dist/jquery.min',
    Bacon: 'public/lib/bacon/dist/Bacon',

    conjthisMain: 'public/src/js/conjthisMain'
  }
});

define(['conjthisMain'], function(conjthisMain){
  conjthisMain.init();
});
