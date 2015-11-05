require.config({
  paths: {
    underscore: 'lib/underscore/underscore',
    Backbone: 'lib/backbone/backbone',
    React: 'lib/react/react-with-addons',
    jquery: 'lib/jquery/dist/jquery.min',
    Bacon: 'lib/bacon/dist/Bacon',
    Immutable: 'lib/immutable/dist/immutable',

    conjthisMain: 'src/js/conjthisMain',
    conjthisVerbs: 'src/js/conjthisVerbs',
    conjthisViews: 'src/js/conjthisViews',
    conjthisRecords: 'src/js/conjthisRecords',
    conjthisUtils: 'src/js/conjthisUtils',
    conjthisAudio: 'src/js/conjthisAudio'
  }
});

define(['conjthisMain'], function(conjthisMain){
  conjthisMain.init();
});
