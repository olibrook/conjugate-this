define([
    'jquery',
    'React'
], function($, React) {

  'use strict';

  var conjthisMain = {}, d = React.DOM;

  conjthisMain.words = [
    {
      type: 'verb',
      english: 'to eat',
      spanish: 'comer',
      reflexive: 'optional',
      conjugations: {
        indicative: {
          present: {
            'pattern': 'regular',
            'yo': 'como',
            'tú': 'comes',
            'él/ella/Ud.': 'come',
            'nosotros': 'comemos',
            'vosotros': 'coméis',
            'ellos/ellas/Uds.': 'comen'
          },
          preterit: {
            'pattern': 'regular',
            'yo': 'comí',
            'tú': 'comiste',
            'él/ella/Ud.': 'comió',
            'nosotros': 'comimos',
            'vosotros': 'comisteis',
            'ellos/ellas/Uds.': 'comieron'
          }
        }
      }
    },
    {
      type: 'verb',
      english: 'to go',
      spanish: 'ir',
      reflexive: 'optional',
      conjugations: {
        indicative: {
          present: {
            'pattern': 'irregular',
            'yo': 'voy',
            'tú': 'vas',
            'él/ella/Ud.': 'va',
            'nosotros': 'vamos',
            'vosotros': 'vais',
            'ellos/ellas/Uds.': 'van'
          },
          preterit: {
            'pattern': 'irregular',
            'yo': 'fui',
            'tú': 'fuiste',
            'él/ella/Ud.': 'fue',
            'nosotros': 'fuimos',
            'vosotros': 'fuisteis',
            'ellos/ellas/Uds.': 'fueron'
          }
        }
      }
    },
    {
      type: 'noun',
      english: 'food',
      spanish: 'comida'
    },
    {
      type: 'adjective',
      english: 'beautiful',
      spanish: 'hermoso'
    },
    {
      type: 'adverb',
      english: 'so',
      spanish: 'tan'
    }
  ];

  conjthisMain.choose = function(arr){
    var i = Math.round(Math.random() * arr.length - 1);
    return arr[i];
  };

  conjthisMain.ConjugatorForm = React.createClass({

    displayName: 'ConjugatorForm',

    SHIFT: 16,
    DOWN: 40,
    ACCENT_CYCLES: {
      'a': 'á',
      'á': 'a',
      'e': 'é',
      'é': 'e',
      'i': 'í',
      'í': 'i',
      'o': 'ó',
      'ó': 'o',
      'u': 'ú',
      'ú': 'ü',
      'ü': 'u',
      'n': 'ñ',
      'ñ': 'n'
    },

    getInitialState: function(){
      return {
        shiftKey: false,
        value: ''
      }
    },

    render: function(){
      return d.div({},
        d.form({className: 'form-horizontal', role: 'form'},

            d.div({className: 'form-group'},
            d.label({className: 'col-sm-2 control-label'}, 'English'),
            d.div({className: 'col-sm-10'},
              d.p({className: 'form-control-static'}, 'Something English')
            )
          ),

          d.div({className: 'form-group'},
            d.label({className: 'col-sm-2 control-label'}, 'Spanish'),
            d.div({className: 'col-sm-10'},
              d.input({
                className: 'form-control',
                type: 'text',
                onKeyDown: this.onKeyDown,
                onKeyUp: this.onKeyUp,
                onChange: this.onChange,
                value: this.state.value
              })
            )
          ),

          d.div({className: 'form-group'},
            d.label({className: 'col-sm-2 control-label'}, ''),
            d.div({className: 'col-sm-10'},
              d.span({}, this.state.shiftKey ? 'Á' : 'á'),
              d.span({}, this.state.shiftKey ? 'É' : 'é'),
              d.span({}, this.state.shiftKey ? 'Í' : 'í'),
              d.span({}, this.state.shiftKey ? 'Ó' : 'ó'),
              d.span({}, this.state.shiftKey ? 'Ú' : 'ú'),
              d.span({}, this.state.shiftKey ? 'Ü' : 'ü'),
              d.span({}, this.state.shiftKey ? 'Ñ' : 'ñ')
            )
          )
        )
      )
    },

    onKeyDown: function(e){
      var shiftKey = (e.keyCode === this.SHIFT) || e.shiftKey;

      this.setState({shiftKey: shiftKey});

      if(e.keyCode === this.DOWN){
        e.preventDefault();
        this.accentLastCharacter();
      }
    },

    onKeyUp: function(e){
      var shiftKey = (e.keyCode !== this.SHIFT) && e.shiftKey;
      this.setState({shiftKey: shiftKey});
    },

    accentLastCharacter: function(){
      var val = this.state.value,
          last = val.charAt(val.length - 1),
          isUpper = last.toUpperCase() === last,
          lower = last.toLowerCase(),
          replacement;

      if(this.ACCENT_CYCLES[lower] !== undefined){
        replacement = this.ACCENT_CYCLES[lower];
        if(isUpper){
          replacement = replacement.toUpperCase();
        }
        replacement = val.slice(0, val.length - 1) + replacement;
        this.setState({value: replacement});
      }
    },

    onChange: function(e){
      this.setState({value: e.target.value});
    }

  });

  conjthisMain.init = function(){
    $(document).ready(function(){
      React.renderComponent(conjthisMain.ConjugatorForm({}), document.getElementById('app'));
    });
  };

  return conjthisMain;
});
