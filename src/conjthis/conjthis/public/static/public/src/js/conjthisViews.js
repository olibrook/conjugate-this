define(['React', 'conjthisRecords', 'conjthisUtils', 'Bacon'], function(React, ctRecords, ctUtils, Bacon) {

  'use strict';

  var ctViews = {},
      _ = React.DOM;

  ctViews.ConjugatorTextInput = React.createClass({

    displayName: 'ConjugatorTextInput',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
      var answerStatus, pronoun, pronounIndex, isIrregular, groupClass,
          feedback, correctAnswer, conjugated, task, tenseKey,
          value, displayMode;

      answerStatus = this.props.answerStatus;
      pronoun = this.props.pronoun;
      task = this.props.as.get('task');
      tenseKey = this.props.tenseKey;
      pronounIndex = ctRecords.PRONOUNS.get(pronoun);
      displayMode = this.props.as.get('taskIncorrectDisplayMode');

      if (task === null) {
        isIrregular = false;

      } else {
        tenseKey = ctRecords.TENSES.get(task.get('tense'));
        conjugated = task.getIn(['verb', 'conjugations', tenseKey, pronounIndex]);
        isIrregular = conjugated.get(0) === 'i';
        correctAnswer = conjugated.get(1);
      }

      switch (answerStatus) {
        case ctRecords.ANSWER_CORRECT:
          groupClass = ['form-group', 'has-success', 'has-feedback'];
          feedback = _.span({className: 'glyphicon glyphicon-ok form-control-feedback'});
          value = this.props.as.getIn(['answers', pronounIndex]);
          break;

        case ctRecords.ANSWER_INCORRECT:
          groupClass = ['form-group', 'has-error', 'has-feedback'];
          feedback = _.span({className: 'glyphicon glyphicon-remove form-control-feedback'});

          value = (
            displayMode === ctRecords.DISPLAY_CORRECT_ANSWERS ? correctAnswer :
            displayMode === ctRecords.DISPLAY_USER_ANSWERS ? this.props.as.getIn(['answers', pronounIndex]) :
            '');

          break;

        case ctRecords.ANSWER_UNGRADED:
          groupClass = isIrregular ?
            ['form-group', 'has-warning', 'has-feedback'] :
            ['form-group'];
          feedback = isIrregular ?
            _.span({className: 'glyphicon glyphicon-warning-sign form-control-feedback'}) :
            '';
          value = this.props.as.getIn(['answers', pronounIndex]);
          break;

        default:
          throw new Error('Unhandled answerStatus');
          break;
      }

      return (
        _.div({key: 'text-input-' + pronoun, className: groupClass.join(' ')},
          _.div({className: 'input-group'},
            _.span({className: 'input-group-addon'},
              _.span({style: {display: 'inline-block', width: '90px'}}, pronoun)
            ),
            _.input({
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

    focus: function() {
      this.refs['input'].getDOMNode().focus();
    },

    onChange: function(e) {
      this.setAnswer(e.target.value);
    },

    setAnswer: function(answer) {
      this.props.bus.push({
        type: 'setAnswer',
        pronounIndex: this.props.pronounIndex,
        value: answer
      });
    }
  });


  ctViews.ExerciseForm = React.createClass({

    displayName: 'ExerciseForm',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
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
        ctRecords.PRONOUNS.keySeq().toArray()
      );

      if (task === null) {
        display = '';
        tense = '';

      } else {
        display = verb.get('spanish') + ' (' + verb.get('english') + ')';
        tense = this.props.as.getIn(['task', 'tense']);
      }

      return (
        _.div({className: 'panel panel-default'},
          _.div({className: 'panel-heading clearfix'},
            _.div({className: 'pull-left'},
              tense
            ),
            _.div({className: 'pull-right'},
              _.span({className: 'badge'}, this.props.as.get('numCorrect') + ' / ' + this.props.as.get('numAttempted'))
            )
          ),
          _.div({className: 'panel-body'},
            _.h2({style: {margin: '0.75em 0'}}, display),
            _.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
              statusPronounPairs.map(
                function(statusPronounPair, index) {
                  return ctViews.ConjugatorTextInput({
                    as: this.props.as,
                    bus: this.props.bus,
                    answerStatus: statusPronounPair[0],
                    pronoun: statusPronounPair[1],
                    pronounIndex: ctRecords.PRONOUNS.get(statusPronounPair[1]),
                    tenseKey: task !== null ? ctRecords.TENSES.get(task.get('tense')) : null,
                    ref: 'input-' + index
                  });
                },
                this
              ),
              _.div({className: 'form-group clearfix'},
                _.div({className: 'pull-left'},
                  _.button({type: 'submit', className: 'btn btn-primary'},
                    stateName === 'solveTask' ? 'Check' : 'Continue'
                  )
                ),
                _.div({className: 'pull-right'},
                  ctViews.CorrectionsToggleButton({
                    as: this.props.as, bus: this.props.bus
                  })
                )
              )
            )
          )
        )
      );
    },

    componentDidUpdate: function(prevProps) {
      var path;

      // Focus first field when verb changes
      path = ['task', 'verb', 'spanish'];
      if (prevProps.as.getIn(path) !== this.props.as.getIn(path)) {
        this.refs['input-0'].focus();
      }
    },

    onSubmit: function(e) {
      e.preventDefault();
      this.props.bus.push({type: 'submit'});
    }
  });


  ctViews.CorrectionsToggleButton = React.createClass({

    displayName: 'CorrectionsToggleButton',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {

      if (this.props.as.get('stateName') === 'taskIncorrect') {
        if (this.props.as.get('taskIncorrectDisplayMode') === ctRecords.DISPLAY_CORRECT_ANSWERS) {
          return _.button(
            {
              onClick: this.onClick.bind(null, ctRecords.DISPLAY_USER_ANSWERS),
              className: 'btn btn-default'
            },
            'Show my answers'
          );
        }

        if (this.props.as.get('taskIncorrectDisplayMode') === ctRecords.DISPLAY_USER_ANSWERS) {
          return _.button(
            {
              onClick: this.onClick.bind(null, ctRecords.DISPLAY_CORRECT_ANSWERS),
              className: 'btn btn-default'
            },
            'Show correct answers'
          );
        }
      }

      return _.span({}, '');
    },

    onClick: function(displayMode, e) {
      e.preventDefault();

      this.props.bus.push({
        type: 'setTaskIncorrectDisplayMode',
        value: displayMode
      });
    }
  });


  ctViews.SettingsForm = React.createClass({

    displayName: 'SettingsForm',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    renderTenseCheckboxes: function() {
      return ctRecords.TENSES.map(function(tenseId, tense) {
        return _.div({className: 'radio', key: tense},
          _.label({},
            _.input({
              type: 'radio',
              name: 'tenseOptions',
              ref: tense,
              checked: this.props.as.getIn(['tense']) === tense,
              onChange: function(e) {this.onTenseChange(e, tense)}.bind(this)
            }),
            _.span({style: {verticalAlign: 'top'}}, tense)
          )
        );
      }, this).valueSeq().toArray();
    },

    renderPronounCheckboxes: function() {
      return ctRecords.PRONOUNS.map(function(pronounIdx, pronoun) {
        return _.div({className: 'checkbox', key: pronoun},
          _.label({},
            _.input({
              type: 'checkbox',
              ref: pronoun,
              checked: this.props.as.getIn(['pronouns', pronoun]),
              onChange: function(e) {this.onPronounChange(e, pronoun)}.bind(this)
            }),
            _.span({style: {verticalAlign: 'top'}}, pronoun)
          )
        );
      }, this).valueSeq().toArray();
    },

    renderVerbCheckboxes: function() {

    },

    render: function() {
      return _.div({className: 'panel panel-default'},
        _.div({className: 'panel-heading'}, 'Settings Form'),
        _.div({className: 'panel-body'},
          _.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},

            _.div({className: 'row'},
              _.h2({}, 'Verbs'),
              _.div({className: 'form-group'},
                _.div({className: 'input-group'},
                  this.renderVerbCheckboxes()
                )
              )
            ),

            _.div({className: 'row'},
              _.div({className: 'col-md-6'},
                _.h2({}, 'Tenses'),
                _.div({className: 'form-group'},
                  _.div({className: 'input-group'},
                    this.renderTenseCheckboxes()
                  )
                )
              ),

              _.div({className: 'col-md-6'},
                _.h2({}, 'Pronouns'),
                _.div({className: 'form-group'},
                  _.div({className: 'input-group'},
                    this.renderPronounCheckboxes()
                  )
                )
              )
            ),

            _.button({type: 'submit', className: 'btn btn-primary', onSubmit: this.onSubmit}, 'Start exercise')
          )
        )
      );
    },

    onTenseChange: function(e, tense) {
      this.props.bus.push({
        type: 'setTense',
        value: tense
      });
    },

    onPronounChange: function(e, pronoun) {
      this.props.bus.push({
        type: 'updatePronouns',
        key: pronoun,
        value: e.target.checked
      });
    },

    /**
     * On submit, start the exercise.
     */
    onSubmit: function(e) {
      e.preventDefault();

      this.props.bus.push({
        type: 'startExercise'
      });
    }
  });

  ctViews.ResultsView = React.createClass({

    displayName: 'ResultsView',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
      var content;

      if (this.props.as.get('stateName') === 'exerciseFinished') {
        content = (
          _.div({},
            _.h3({}, 'Exercise complete. Score: ' +
                this.props.as.get('numCorrect') + '/' +
                this.props.as.get('numAttempted')
            ),
            _.button(
              {className: 'btn btn-primary', onClick: this.onStartAgainClick},
              'Start again'
            )
          )
        );
      } else {
        content = _.div({}, '');
      }

      return (
        _.div({className: 'panel panel-default'},
          _.div({className: 'panel-heading'}, 'Results'),
          _.div({className: 'panel-body'}, content)
        )
      );
    },

    onStartAgainClick: function(e) {
      this.props.bus.push({
        type: 'startAgain'
      });
    }
  });


  ctViews.ConjugatorMain = React.createClass({

    displayName: 'ConjugatorMain',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
      return (
        _.div({},
          _.div({className: 'navbar navbar-default navbar-static-top', role: 'nav'},
            _.div({className: 'container'},
              _.span({className: 'navbar-brand'}, 'Conjugate this')
            )
          ),
          _.div({className: 'slider' , ref: 'slider'},
            _.div({className: 'inner ' + this.props.as.get('stateName')},
              _.div({className: 'slide'},
                _.div({className: 'container'},
                  ctViews.SettingsForm({as: this.props.as, bus: this.props.bus})
                )
              ),
              _.div({className: 'slide'},
                _.div({className: 'container'},
                  ctViews.ExerciseForm({as: this.props.as, bus: this.props.bus})
                )
              ),
              _.div({className: 'slide'},
                _.div({className: 'container'},
                  ctViews.ResultsView({as: this.props.as, bus: this.props.bus})
                )
              )
            )
          )
        )
      );
    },

    componentDidMount: function() {
      this.fixScroll();
    },

    componentDidUpdate: function() {
      this.fixScroll();
    },

    /**
     * TODO: React bug, or am I doing something wrong?
     * Seems to set scrollLeft when there is overflowing content
     * even when "overflow-x: hidden" used in the CSS.
     */
    fixScroll: function() {
      var domNode = this.refs.slider.getDOMNode();
      setTimeout(function() {
        domNode.scrollLeft = 0;
      }, 40);
    }
  });

  return ctViews;
});
