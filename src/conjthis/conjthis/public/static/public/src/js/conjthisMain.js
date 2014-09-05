define([
    'React',
    'Bacon'
], function(React, Bacon) {

  'use strict';

  var ct = {},
      d = React.DOM;

  ct.words = [
    {
      type: 'verb',
      english: 'to eat',
      spanish: 'comer',
      reflexive: 'optional',
      conjugations: {
        indicative: {
          present: {
            'yo': 'como',
            'tú': 'comes',
            'él/ella/Ud.': 'come',
            'nosotros': 'comemos',
            'vosotros': 'coméis',
            'ellos/ellas/Uds.': 'comen'
          },
          preterit: {
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
            'yo': 'voy',
            'tú': 'vas',
            'él/ella/Ud.': 'va',
            'nosotros': 'vamos',
            'vosotros': 'vais',
            'ellos/ellas/Uds.': 'van'
          },
          preterit: {
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

  ct.choose = function(arr){
    var i = Math.round(Math.random() * (arr.length - 1));
    return arr[i];
  };

  ct.createTask = function(word){
    var arr;
    if(word.type == 'verb'){
      arr = ct.randomKeyValue(word.conjugations.indicative.present);
      return {
        display: word.spanish,
        prompt: arr[0],
        solution: arr[1]
      }
    } else if(['adjective', 'adverb', 'noun'].indexOf(word.type) >= 0){
      return {
        display: word.english,
        prompt: 'Spanish',
        solution: word.spanish
      }
    } else {
      throw new Error();
    }
  };

  ct.nextTask = function(){
    return ct.createTask(
        ct.choose(
            ct.words));
  };

  ct.randomKeyValue = function(obj){
    var keys = Object.keys(obj),
        k = keys[Math.round(Math.random() * (keys.length - 1))];
    return [k, obj[k]];
  };

  ct.ConjugatorTextInput = React.createClass({
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
        className: 'form-control input-lg',
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


  ct.ConjugatorForm = React.createClass({

    displayName: 'ConjugatorForm',

    getInitialState: function(){
      return {
        shiftKey: false
      }
    },

    render: function(){
      return d.div({},
        d.div({className: 'navbar navbar-default navbar-static-top', role: 'nav'},
          d.div({className: 'container'},
            d.span({className: 'navbar-brand'}, 'Conjugate this')
          )
        ),
        d.div({className: 'container'},
          d.p({className: 'stats', style: {textAlign: 'right'}},
            d.span({}, 'Total ', d.span({className: 'badge'}, this.props.correct + ' / ' + this.props.attempted)),
            d.span({}, ' Streak ', d.span({className: 'badge'}, this.props.streak))
          ),
          d.div({className: 'panel panel-default'},
            d.div({className: 'panel-body'},
              d.h2({style: {margin: '0.75em 0'}}, this.props.task.display),
              d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
                d.div({className: 'form-group'},
                  d.div({className: 'input-group'},
                    d.span({className: 'input-group-addon'},
                        d.span({style: {display: 'inline-block', width: '90px'}}, this.props.task.prompt)
                    ),
                    ct.ConjugatorTextInput({ref: 'conjugatorTextInput'})
                  )
                )
              )
            )
          )
        )
      )
    },

    onSubmit: function(e){
      e.preventDefault();
      this.props.bus.push({
        type: 'submit',
        value: this.refs.conjugatorTextInput.state.value
      });
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

  ct.init = function(){

    var el = document.createElement('div'),
        bus = new Bacon.Bus(),
        component;

    document.body.appendChild(el);

    bus.subscribe(update);

    component = React.renderComponent(ct.ConjugatorForm(initialAppState()), el);

    function initialAppState(){
      return {
        bus: bus,
        task: ct.nextTask(),
        correct: 0,
        attempted: 0,
        streak: 0
      }
    }

    function update(baconMsg){
      var isCorrect,
          message = baconMsg.value();

      if(message.type === 'submit'){
        isCorrect = message.value === component.props.task.solution;
        component.setProps({
          task: ct.nextTask(),
          correct: isCorrect ? component.props.correct + 1 : component.props.correct,
          attempted: component.props.attempted + 1,
          streak: isCorrect ? component.props.streak + 1 : 0
        })
      } else {
        throw new Error();
      }
    }
  };

  return ct;
});
