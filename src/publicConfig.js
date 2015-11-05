require.config({
  paths: {
    underscore: 'public/lib/underscore/underscore',
    Backbone: 'public/lib/backbone/backbone',
    React: 'public/lib/react/react-with-addons',
    jquery: 'public/lib/jquery/dist/jquery.min',
    Bacon: 'public/lib/bacon/dist/Bacon',
    Immutable: 'public/lib/immutable/dist/immutable',

    conjthisMain: 'public/src/js/conjthisMain',
    conjthisVerbs: 'public/src/js/conjthisVerbs',
    conjthisViews: 'public/src/js/conjthisViews',
    conjthisRecords: 'public/src/js/conjthisRecords',
    conjthisUtils: 'public/src/js/conjthisUtils',
    conjthisAudio: 'public/src/js/conjthisAudio'
  }
});

define(['conjthisMain'], function(conjthisMain){
  conjthisMain.init();
});
