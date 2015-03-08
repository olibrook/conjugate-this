define(['React', 'conjthisConstants'], function(React, ctConstants){

  'use strict';

  var ctViews = {},
      d = React.DOM;

  ctViews.ConjugatorTextInput = React.createClass({
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
        onKeyDown: this.onKeyDown,
        onChange: this.onChange,
        value: this.props.as.get('answer')
      });
    },

    onKeyDown: function(e){
      var answer, chr, unaccented, accented, index, isUpper, domNode, selectionStart;
      domNode = this.getDOMNode();
      selectionStart = domNode.selectionStart;
      answer = this.props.as.get('answer');

      if( (e.keyCode == this.UP) || (e.keyCode == this.DOWN) ){
        index = e.keyCode == this.UP ? this.state.modifierIndex + 1 : this.state.modifierIndex - 1;
        chr = answer.length > 0 ? answer.charAt(selectionStart - 1) : '';
        isUpper = chr.toUpperCase() == chr;
        unaccented = this.getUnaccented(chr.toLowerCase());
        accented = this.getAccented(unaccented, index);
        accented = isUpper ? accented.toUpperCase() : accented;
        answer = answer.slice(0, selectionStart -1) + accented + answer.slice(selectionStart, answer.length);
        this.setAnswer(answer);
        this.setState({modifierIndex: index, restoreCursor: selectionStart});
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

    getUnaccented: function(chr){
      var reverseMap = this.getReverseMap();
      if(reverseMap[chr] !== undefined){
        return reverseMap[chr]
      } else {
        return chr;
      }
    },

    getAccented: function(chr, index){
      var isUpper = chr.toUpperCase() === chr,
          lower = chr.toLowerCase(),
          ret;

      if(this.ACCENT_CYCLES[lower] !== undefined){
        ret = this.ACCENT_CYCLES[lower][Math.abs(index % this.ACCENT_CYCLES[lower].length)];
        if(isUpper){
          ret = ret.toUpperCase();
        }
        return ret;
      } else {
        return chr;
      }
    },

    onChange: function(e){
      this.setAnswer(e.target.value);
    },

    setAnswer: function(answer){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'setAnswer',
            value: answer
          },
          bubbles: true,
          cancelable: false
        })
      );
    }
  });

  ctViews.ExerciseForm = React.createClass({

    displayName: 'ExerciseForm',

    getInitialState: function(){
      return {
        shiftKey: false
      }
    },

    render: function(){
      var statusMessage,
          stateName,
          isIrregular,
          display,
          task,
          prompt;

      task = this.props.as.get('task');
      stateName = this.props.as.get('stateName');

      if(task === null){
        isIrregular = false;
        display = '';
        prompt = '';

      } else {
        isIrregular = this.props.as.getIn(['task', 'regularFlag']) === 'i';
        display = this.props.as.getIn(['task', 'display']);
        prompt = this.props.as.getIn(['task', 'prompt']);
      }


      if(stateName === 'solveTask'){
        statusMessage = d.div(
          {className: 'alert alert-info'},
          'Type your answer')

      } else if(stateName === 'taskCorrect'){
        statusMessage = d.div(
          {className: 'alert alert-success'},
          'That\'s right!')

      } else if(stateName === 'taskIncorrect'){
        statusMessage = d.div(
          {className: 'alert alert-danger'},
          'The right answer is "' + this.props.as.getIn(['task', 'solution']) + '"')

      } else {
        statusMessage = d.div({}, '');
      }


      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading', style: {textAlign: 'right'}},
          d.span({}, 'Total ', d.span({className: 'badge'}, this.props.as.get('correct') + ' / ' + this.props.as.get('attempted'))),
          d.span({}, ' Streak ', d.span({className: 'badge'}, this.props.as.get('streak')))
        ),
        d.div({className: 'panel-body'},
          d.h2({style: {margin: '0.75em 0'}}, display),
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
            d.div({className: 'form-group' + (isIrregular ? ' has-warning has-feedback' : '')},
              d.div({className: 'input-group'},
                d.span({className: 'input-group-addon'},
                  d.span({style: {display: 'inline-block', width: '90px'}}, prompt)
                ),
                ctViews.ConjugatorTextInput({key: 'conjugatorTextInput', ref: 'conjugatorTextInput', as: this.props.as}),
                d.span({className: 'glyphicon glyphicon-warning-sign form-control-feedback', style: {visibility: isIrregular ? 'visible': 'hidden'}})
              )
            )
          ),
          statusMessage
        )
      )
    },

    componentDidMount: function(){
      this.focusTextInput();
    },

    focusTextInput: function(){
      // TODO: Looks like a React bug
      setTimeout(function(){
        this.refs.conjugatorTextInput.getDOMNode().focus();
      }.bind(this), 40);
    },

    onSubmit: function(e){
      e.preventDefault();
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'submit'
          },
          bubbles: true,
          cancelable: false
        })
      );
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

  ctViews.SettingsForm = React.createClass({

    displayName: 'SettingsForm',

    render: function(){
      var tenseCheckboxes, pronounCheckboxes;

      tenseCheckboxes = ctConstants.TENSES.map(function(tenseId, tense){
        return d.div({className: 'checkbox', key: tense},
          d.label({},
            d.input({
              type: 'checkbox',
              ref: tense,
              checked: this.props.as.getIn(['tenses', tense]),
              onChange: function(e){this.onTenseChange(e, tense)}.bind(this)
            }),
            d.span({style: {verticalAlign: 'top'}}, tense)
          )
        )
      }, this).valueSeq().toArray();

      pronounCheckboxes = ctConstants.PRONOUNS.map(function(pronounIdx, pronoun){
        return d.div({className: 'checkbox', key: pronoun},
          d.label({},
            d.input({
              type: 'checkbox',
              ref: pronoun,
              checked: this.props.as.getIn(['pronouns', pronoun]),
              onChange: function(e){this.onPronounChange(e, pronoun)}.bind(this)
            }),
            d.span({style: {verticalAlign: 'top'}}, pronoun)
          )
        )
      }, this).valueSeq().toArray();

      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading'}, 'Settings Form'),
        d.div({className: 'panel-body'},
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},

            d.h2({}, 'Tenses'),
            d.div({className: 'form-group'},
              d.div({className: 'input-group'},
                tenseCheckboxes
              )
            ),

            d.h2({}, 'Pronouns'),
            d.div({className: 'form-group'},
              d.div({className: 'input-group'},
                pronounCheckboxes
              )
            ),

            d.button({type: 'submit', className: 'btn btn-primary', onSubmit: this.onSubmit}, 'Start exercise')
          )
        )
      );
    },

    onTenseChange: function(e, tense){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'updateTenses',
            key: tense,
            value: e.target.checked
          },
          bubbles: true,
          cancelable: false
        })
      );
    },

    onPronounChange: function(e, pronoun){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'updatePronouns',
            key: pronoun,
            value: e.target.checked
          },
          bubbles: true,
          cancelable: false
        })
      );
    },

    /**
     * On submit, start the exercise.
     * @param e
     */
    onSubmit: function(e){
      e.preventDefault();

      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'startExercise'
          },
          bubbles: true,
          cancelable: false
        })
      );
    }
  });


  ctViews.ConjugatorMain = React.createClass({
    displayName: 'ConjugatorMain',
    render: function(){
      return d.div({},
        d.div({className: 'navbar navbar-default navbar-static-top', role: 'nav'},
          d.div({className: 'container'},
            d.span({className: 'navbar-brand'}, 'Conjugate this')
          )
        ),
        d.div({className: 'container'},
          ctViews.SettingsForm({as: this.props.as}),
          ctViews.ExerciseForm({as: this.props.as})
        )
      )
    }
  });

  return ctViews;

});
