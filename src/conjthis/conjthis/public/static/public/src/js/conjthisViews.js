define(['React', 'conjthisConstants', 'conjthisUtils'], function(React, ctConstants, ctUtils){

  'use strict';

  var ctViews = {},
      d = React.DOM;

  ctViews.ConjugatorTextInput = React.createClass({
    displayName: 'ConjugatorTextInput',

    render: function(){

      var answerStatus, pronoun, pronounIndex, isIrregular, groupClass,
          feedback, correctAnswer, conjugated, task, tenseKey,
          value, displayMode;

      answerStatus = this.props.answerStatus;
      pronoun = this.props.pronoun;
      task = this.props.as.get('task');
      tenseKey = this.props.tenseKey;
      pronounIndex = ctConstants.PRONOUNS.get(pronoun);
      displayMode = this.props.as.get('taskIncorrectDisplayMode');


      if(task === null){
        isIrregular = false;

      } else {
        tenseKey = ctConstants.TENSES.get(task.get('tense'));
        conjugated = task.getIn(['verb', 'conjugations', tenseKey, pronounIndex]);
        isIrregular = conjugated.get(0) === 'i';
        correctAnswer = conjugated.get(1);
      }

      switch(answerStatus){
        case ctConstants.ANSWER_CORRECT:
          groupClass = ['form-group', 'has-success', 'has-feedback'];
          feedback = d.span({className: 'glyphicon glyphicon-ok form-control-feedback'});
          value = this.props.as.getIn(['answers', pronounIndex]);
          break;

        case ctConstants.ANSWER_INCORRECT:
          groupClass = ['form-group', 'has-error', 'has-feedback'];
          feedback = d.span({className: 'glyphicon glyphicon-remove form-control-feedback'});

          value = (
            displayMode === ctConstants.DISPLAY_CORRECT_ANSWERS ? correctAnswer :
            displayMode === ctConstants.DISPLAY_USER_ANSWERS ? this.props.as.getIn(['answers', pronounIndex]) :
            '');

          break;

        case ctConstants.ANSWER_UNGRADED:
          groupClass = isIrregular ?
            ['form-group', 'has-warning', 'has-feedback'] :
            ['form-group'];
          feedback = isIrregular ?
            d.span({className: 'glyphicon glyphicon-warning-sign form-control-feedback'}) :
            '';
          value = this.props.as.getIn(['answers', pronounIndex]);
          break;

        default:
          throw new Error('Unhandled answerStatus');
          break;
      }

      return (
        d.div({key: 'text-input-' + pronoun, className: groupClass.join(' ')},
          d.div({className: 'input-group'},
            d.span({className: 'input-group-addon'},
              d.span({style: {display: 'inline-block', width: '90px'}}, pronoun)
            ),
            d.input({
              className: 'form-control input-lg',
              type: 'text',
              onChange: this.onChange,
              value: value,
              ref: 'input'
            }),
            feedback
          )
        )
      );
    },

    focus: function(){
      this.refs['input'].getDOMNode().focus();
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

    render: function(){
      var verb,
          stateName,
          display,
          task,
          tense,
          statusPronounPairs;

      task = this.props.as.get('task');
      stateName = this.props.as.get('stateName');
      verb = this.props.as.getIn(['task', 'verb']);
      statusPronounPairs = ctUtils.zip(
        this.props.as.get('answerStatuses').toArray(),
        ctConstants.PRONOUNS.keySeq().toArray()
      );

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
            d.span({className: 'badge'}, this.props.as.get('numCorrect') + ' / ' + this.props.as.get('numAttempted'))
          )
        ),
        d.div({className: 'panel-body'},
          d.h2({style: {margin: '0.75em 0'}}, display),
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
            statusPronounPairs.map(
              function(statusPronounPair, index){
                return ctViews.ConjugatorTextInput({
                  as: this.props.as,
                  answerStatus: statusPronounPair[0],
                  pronoun: statusPronounPair[1],
                  pronounIndex: ctConstants.PRONOUNS.get(statusPronounPair[1]),
                  tenseKey: task !== null ? ctConstants.TENSES.get(task.get('tense')) : null,
                  ref: 'input-' + index
                });
              },
              this
            ),
            d.div({className: 'form-group clearfix'},
              d.div({className: 'pull-left'},
                d.button({type: 'submit', className: 'btn btn-primary'},
                  stateName === 'solveTask' ? 'Check' : 'Continue'
                )
              ),
              d.div({className: 'pull-right'},
                ctViews.CorrectionsToggleButton({as: this.props.as})
              )
            )
          )
        )
      )
    },

    componentDidUpdate: function(prevProps) {
      var path;

      // Focus first field when verb changes
      path = ['task', 'verb', 'spanish'];
      if (prevProps.as.getIn(path) !== this.props.as.getIn(path)) {
        this.refs['input-0'].focus();
      }
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
    }
  });


  ctViews.CorrectionsToggleButton = React.createClass({

    displayName: 'CorrectionsToggleButton',

    render: function(){

      if (this.props.as.get('stateName') === 'taskIncorrect') {
        if(this.props.as.get('taskIncorrectDisplayMode') === ctConstants.DISPLAY_CORRECT_ANSWERS) {
          return d.button(
            {
              onClick: this.onClick.bind(null, ctConstants.DISPLAY_USER_ANSWERS),
              className: 'btn btn-default'
            },
            'Show my answers'
          );
        }

        if(this.props.as.get('taskIncorrectDisplayMode') === ctConstants.DISPLAY_USER_ANSWERS) {
          return d.button(
            {
              onClick: this.onClick.bind(null, ctConstants.DISPLAY_CORRECT_ANSWERS),
              className: 'btn btn-default'
            },
            'Show correct answers'
          );
        }
      }

      return d.span({}, '');
    },

    onClick: function(displayMode, e){
      e.preventDefault();

      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'setTaskIncorrectDisplayMode',
            value: displayMode
          },
          bubbles: true,
          cancelable: false
        })
      );
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
              this.props.as.get('numAttempted')),
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
