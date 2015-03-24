require.config({
  paths: {
    underscore: 'public/lib/underscore/underscore',
    Backbone: 'public/lib/backbone/backbone',
    React: 'public/lib/react/react',
    jquery: 'public/lib/jquery/dist/jquery.min',
    Bacon: 'public/lib/bacon/dist/Bacon',
    Immutable: 'public/lib/immutable/dist/immutable',

    conjthisMain: 'public/src/js/conjthisMain',
    conjthisVerbs: 'public/src/js/conjthisVerbs',
    conjthisViews: 'public/src/js/conjthisViews',
    conjthisConstants: 'public/src/js/conjthisConstants',
    conjthisRecords: 'public/src/js/conjthisRecords',
    conjthisUtils: 'public/src/js/conjthisUtils'
  }
});

define(['conjthisMain'], function(conjthisMain){
  conjthisMain.init();
});
