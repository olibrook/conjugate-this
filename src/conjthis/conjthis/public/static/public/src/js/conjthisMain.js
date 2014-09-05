define([
    'React',
], function(React) {

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


  conjthisMain.ConjugatorTextInput = React.createClass({
    displayName: 'ConjugatorTextInput',
    SHIFT: 16,
    ALT: 18,

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    ACCENT_CYCLES: {
      'a': ['a', 'á'],
      'e': ['e', 'é'],
      'i': ['i', 'í'],
      'o': ['o', 'ó'],
      'u': ['u', 'ú', 'ü'],
      'n': ['n', 'ñ']
    },

    reverseMap: null,

    getInitialState: function(){
      return {
        modifierIndex: 0,
        value: '',
        restoreCursor: null
      }
    },

    render: function(){
      return d.input({
        className: 'form-control',
        type: 'text',
        onKeyPress: this.onKeyPress,
        onChange: this.onChange,
        value: this.state.value
      });
    },

    onKeyPress: function(e){
      var value, char, unaccented, accented, index, isUpper, domNode, selectionStart;

      domNode = this.getDOMNode();
      selectionStart = domNode.selectionStart;
      value = this.state.value;

      if( (e.keyCode == this.UP) || (e.keyCode == this.DOWN) ){
        index = e.keyCode == this.UP ? this.state.modifierIndex + 1 : this.state.modifierIndex - 1;
        char = value.length > 0 ? value.charAt(selectionStart - 1) : '';
        isUpper = char.toUpperCase() == char;
        unaccented = this.getUnaccented(char.toLowerCase());
        accented = this.getAccented(unaccented, index);
        accented = isUpper ? accented.toUpperCase() : accented;
        value = value.slice(0, selectionStart -1) + accented + value.slice(selectionStart, value.length);
        this.setState({value: value, modifierIndex: index, restoreCursor: selectionStart});
      } else {
        this.setState({modifierIndex: 0, restoreCursor: null});
      }
    },

    componentDidUpdate: function(){
      var domNode = this.getDOMNode();
      if(this.state.restoreCursor !== null){
        domNode.selectionStart = this.state.restoreCursor;
        domNode.selectionEnd = this.state.restoreCursor;
      }
    },

    getReverseMap: function(){
      var k, i, reverseMap;
      if(this.reverseMap === null){
        reverseMap = {};
        for(k in this.ACCENT_CYCLES){
          if(this.ACCENT_CYCLES.hasOwnProperty(k)){
            for(i=0; i< this.ACCENT_CYCLES[k].length; i+=1){
              reverseMap[this.ACCENT_CYCLES[k][i]] = k;
            }
          }
        }
        this.reverseMap = reverseMap;
      }
      return this.reverseMap;
    },

    getUnaccented: function(char){
      var reverseMap = this.getReverseMap();
      if(reverseMap[char] !== undefined){
        return reverseMap[char]
      } else {
        return char;
      }
    },

    getAccented: function(char, index){
      var isUpper = char.toUpperCase() === char,
          lower = char.toLowerCase(),
          ret;

      if(this.ACCENT_CYCLES[lower] !== undefined){
        ret = this.ACCENT_CYCLES[lower][Math.abs(index % this.ACCENT_CYCLES[lower].length)];
        if(isUpper){
          ret = ret.toUpperCase();
        }
        return ret;
      } else {
        return char;
      }
    },

    onChange: function(e){
      this.setState({value: e.target.value});
    }
  });


  conjthisMain.ConjugatorForm = React.createClass({

    displayName: 'ConjugatorForm',

    getInitialState: function(){
      return {
        shiftKey: false
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
              conjthisMain.ConjugatorTextInput()
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
      var shiftKey = e.keyCode === this.SHIFT;
      if(shiftKey){
        this.setState({shiftKey: true});
      }
    },

    onKeyUp: function(e){
      if(e.keyCode === this.SHIFT){
        this.setState({shiftKey: false});
      }
    }
  });

  conjthisMain.init = function(){
    var el = document.createElement('div');
    document.body.appendChild(el);
    React.renderComponent(conjthisMain.ConjugatorForm({}), el);
  };

  return conjthisMain;
});
