define(['React', 'conjthisConstants', 'conjthisUtils'], function(React, ctConstants, ctUtils){

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
        value: this.props.as.getIn(['answers', this.props.pronounIndex])
      });
    },

    onKeyDown: function(e){
      var answer, chr, unaccented, accented, index, isUpper, domNode, selectionStart;
      domNode = this.getDOMNode();
      selectionStart = domNode.selectionStart;
      answer = this.props.as.getIn(['answers', this.props.pronounIndex])

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
            pronounIndex: this.props.pronounIndex,
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

    renderTextInputs: function(){
      var task, tenseKey, zipped;

      task = this.props.as.get('task');

      zipped = ctUtils.zip(
        this.props.as.get('answerStatuses').toArray(),
        ctConstants.PRONOUNS.keySeq().toArray()
      );

      return zipped.map(function(arr){
        var answerStatus, pronoun, pronounIndex, isIrregular, groupClass, feedback;

        answerStatus = arr[0];
        pronoun = arr[1];
        pronounIndex = ctConstants.PRONOUNS.get(pronoun);


        if(task === null){
          isIrregular = false;

        } else {
          tenseKey = ctConstants.TENSES.get(task.get('tense'));
          isIrregular = task.getIn(['verb', 'conjugations', tenseKey, pronounIndex, 0]) === 'i';
        }


        switch(answerStatus){
          case ctConstants.ANSWER_CORRECT:
            groupClass = ['form-group', 'has-success', 'has-feedback'];
            feedback = d.span({className: 'glyphicon glyphicon-ok form-control-feedback'});
            break;

          case ctConstants.ANSWER_INCORRECT:
            groupClass = ['form-group', 'has-error', 'has-feedback'];
            feedback = d.span({className: 'glyphicon glyphicon-remove form-control-feedback'});
            break;

          case ctConstants.ANSWER_UNGRADED:
            groupClass = isIrregular ?
              ['form-group', 'has-warning', 'has-feedback'] :
              ['form-group'];
            feedback = isIrregular ?
              d.span({className: 'glyphicon glyphicon-warning-sign form-control-feedback'}) :
              '';
            break;

          default:
            groupClass = ['form-group'];
            feedback = '';
            break;
        }

        return (
          d.div({key: 'text-input-' + pronoun, className: groupClass.join(' ')},
            d.div({className: 'input-group'},
              d.span({className: 'input-group-addon'},
                d.span({style: {display: 'inline-block', width: '90px'}}, pronoun)
              ),
              ctViews.ConjugatorTextInput({
                as: this.props.as,
                pronounIndex: pronounIndex,
                pronoun: pronoun
              }),
              feedback
            )
          )
        );
      }, this);
    },

    render: function(){
      var verb,
          stateName,
          display,
          task,
          tense;

      task = this.props.as.get('task');
      stateName = this.props.as.get('stateName');
      verb = this.props.as.getIn(['task', 'verb']);

      if(task === null){
        display = '';
        tense = '';

      } else {
        display = verb.get('spanish') + ' (' + verb.get('english') + ')';
        tense = this.props.as.getIn(['task', 'tense']);
      }

      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading clearfix'},
          d.div({className: 'pull-left'},
            tense
          ),
          d.div({className: 'pull-right'},
            d.span({}, 'Score ', d.span({className: 'badge'}, this.props.as.get('numCorrect') + ' / ' + this.props.as.get('numAttempted')))
          )
        ),
        d.div({className: 'panel-body'},
          d.h2({style: {margin: '0.75em 0'}}, display),
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
            this.renderTextInputs(),
            d.input({type: 'submit', value: 'Submit'})
          )
        )
      )
    },

    onSubmit: function(e){
      console.log('OnSubmit');
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

    renderTenseCheckboxes: function(){
      return ctConstants.TENSES.map(function(tenseId, tense){
        return d.div({className: 'radio', key: tense},
          d.label({},
            d.input({
              type: 'radio',
              name: 'tenseOptions',
              ref: tense,
              checked: this.props.as.getIn(['tense']) === tense,
              onChange: function(e){this.onTenseChange(e, tense)}.bind(this)
            }),
            d.span({style: {verticalAlign: 'top'}}, tense)
          )
        )
      }, this).valueSeq().toArray();
    },

    renderPronounCheckboxes: function(){
      return ctConstants.PRONOUNS.map(function(pronounIdx, pronoun){
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
    },

    renderVerbCheckboxes: function(){

    },

    render: function(){
      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading'}, 'Settings Form'),
        d.div({className: 'panel-body'},
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},

            d.div({className: 'row'},
              d.h2({}, 'Verbs'),
              d.div({className: 'form-group'},
                d.div({className: 'input-group'},
                  this.renderVerbCheckboxes()
                )
              )
            ),

            d.div({className: 'row'},
              d.div({className: 'col-md-6'},
                d.h2({}, 'Tenses'),
                d.div({className: 'form-group'},
                  d.div({className: 'input-group'},
                    this.renderTenseCheckboxes()
                  )
                )
              ),

              d.div({className: 'col-md-6'},
                d.h2({}, 'Pronouns'),
                d.div({className: 'form-group'},
                  d.div({className: 'input-group'},
                    this.renderPronounCheckboxes()
                  )
                )
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
            type: 'setTense',
            value: tense
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

  ctViews.ResultsView = React.createClass({

    displayName: 'ResultsView',

    render: function(){
      var content;

      if(this.props.as.get('stateName') === 'exerciseFinished'){
        content = d.div({},
          d.h3({}, 'Exercise complete. Score: ' +
              this.props.as.get('numCorrect') + '/' +
              this.props.as.get('attempted')),
          d.button({className: 'btn btn-primary', onClick: this.onStartAgainClick}, 'Start again'));
      } else {
        content = d.div({}, '');
      }

      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading'}, 'Results'),
        d.div({className: 'panel-body'}, content)
      );
    },

    onStartAgainClick: function(e){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'startAgain'
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
        d.div({className: 'slider' , ref: 'slider'},
          d.div({className: 'inner ' + this.props.as.get('stateName')},
            d.div({className: 'slide'}, d.div({className: 'container'}, ctViews.SettingsForm({as: this.props.as}))),
            d.div({className: 'slide'}, d.div({className: 'container'}, ctViews.ExerciseForm({as: this.props.as}))),
            d.div({className: 'slide'}, d.div({className: 'container'}, ctViews.ResultsView({as: this.props.as})))
          )
        )
      )
    },

    componentDidMount: function(){
      this.fixScroll();
    },

    componentDidUpdate: function(){
      this.fixScroll();
    },

    /**
     * TODO: React bug, or am I doing something wrong?
     * Seems to set scrollLeft when there is overflowing content
     * even when "overflow-x: hidden" used in the CSS.
     */
    fixScroll: function(){
      var domNode = this.refs.slider.getDOMNode();
      setTimeout(function(){
        domNode.scrollLeft = 0;
      }, 40);
    }
  });


  return ctViews;

});
