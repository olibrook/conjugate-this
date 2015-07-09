define(['React', 'conjthisRecords', 'conjthisUtils', 'Bacon', 'conjthisVerbs'], function(React, ctRecords, ctUtils, Bacon, ctVerbs) {

  'use strict';

  var ctViews = {},
      _ = React.DOM;


  ctViews.getScreenName = function(appState) {
    switch(appState.get('stateName')) {
      case 'viewStats':         return 'verbList';
      case 'configureExercise': return 'settingsForm';
      case 'solveTask':         return 'exerciseForm';
      case 'taskIncorrect':     return 'exerciseForm';
      case 'taskCorrect':       return 'exerciseForm';
      case 'exerciseFinished':  return 'resultsView';
      default:                  return null;
    }
  };


  ctViews.ConjugatorTextInput = React.createClass({

    displayName: 'ConjugatorTextInput',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
      var answerStatus, pronoun, pronounIndex, isIrregular, groupClass,
          feedback, correctAnswer, conjugated, verb, tenseKey,
          value, displayMode;

      answerStatus = this.props.answerStatus;
      pronoun = this.props.pronoun;
      verb = this.props.as.get('verb');
      tenseKey = this.props.tenseKey;
      pronounIndex = ctRecords.PRONOUNS.get(pronoun);
      displayMode = this.props.as.get('taskIncorrectDisplayMode');

      if (verb === null) {
        isIrregular = false;

      } else {
        tenseKey = ctRecords.TENSES.get(this.props.as.get('tense'));
        conjugated = verb.getIn(['conjugations', tenseKey, pronounIndex]);
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
              onFocus: this.onFocus,
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

    onFocus: function() {
      this.props.bus.push({
        type: 'setFocusedAnswerIndex',
        value: this.props.pronounIndex
      })
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
          tense,
          statusPronounPairs;

      verb = this.props.as.get('verb');
      stateName = this.props.as.get('stateName');
      statusPronounPairs = ctUtils.zip(
        this.props.as.get('answerStatuses').toArray(),
        ctRecords.PRONOUNS.keySeq().toArray()
      );

      if (verb === null) {
        display = '';
        tense = '';

      } else {
        display = verb.get('spanish') + ' (' + verb.get('english') + ')';
        tense = this.props.as.get('tense');
      }

      return (
        _.div({},
          _.div({className: 'ct-screen__toolbar'}, 'Toolbar'),
          _.div({className: 'ct-screen__content'},
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
                        tenseKey: verb !== null ? ctRecords.TENSES.get(this.props.as.get('tense')) : null,
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
            ),
            ctViews.CharacterMap({as: this.props.as, bus: this.props.bus})
          )
        )
      );
    },

    componentDidUpdate: function() {
      var ref;
      if(this.props.as.get('stateName') === 'solveTask') {
        ref = 'input-' + this.props.as.get('focusedAnswerIndex');
        this.refs[ref].focus();
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

    render: function() {
      return (
        _.div({},
          _.div({className: 'ct-screen__toolbar'}, 'Toolbar'),
          _.div({className: 'ct-screen__content'},
            _.div({className: 'panel panel-default'},
              _.div({className: 'panel-heading'}, 'Settings Form'),
              _.div({className: 'panel-body'},
                _.form({className: 'form-inline', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
                  _.div({className: 'form-group'},
                    _.div({className: 'input-group'},
                      ctViews.TensePicker({as: this.props.as, bus: this.props.bus}),
                      _.button({type: 'submit', className: 'btn btn-primary', onSubmit: this.onSubmit}, 'Start exercise')
                    )
                  )
                )
              )
            )
          )
        )
      );
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
        _.div({},
          _.div({className: 'ct-screen__toolbar'}, 'Toolbar'),
          _.div({className: 'ct-screen__content'},
            _.div({className: 'panel panel-default'},
              _.div({className: 'panel-heading'}, 'Results'),
              _.div({className: 'panel-body'},
                content
              )
            )
          )
        )
      );
    },

    onStartAgainClick: function(e) {
      this.props.bus.push({
        type: 'startAgain'
      });
    }
  });


  ctViews.Screen = React.createClass({
    displayName: 'Screen',

    render: function() {
      var active, inactive;

      active = ' ct-screen--active';
      inactive = ' ct-screen--inactive';
      return (
        _.div(
          {
            className: 'ct-screen' + (this.props.isActive ? active  : inactive)
          },
          this.props.children
        )
      );
    }

  });


  ctViews.ConjugatorMain = React.createClass({

    displayName: 'ConjugatorMain',

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    render: function() {
      var screen;

      screen = ctViews.getScreenName(this.props.as);

      return (
        _.div({className: 'ct-root'},
          ctViews.Navbar({as: this.props.as, bus: this.props.bus}),
          _.div({className: 'ct-main' , ref: 'slider'},

            ctViews.Screen({isActive: screen === 'verbList'},
              ctViews.VerbListView({as: this.props.as, bus: this.props.bus})
            ),

            ctViews.Screen({isActive: screen === 'settingsForm'},
              ctViews.SettingsForm({as: this.props.as, bus: this.props.bus})
            ),

            ctViews.Screen({isActive: screen === 'exerciseForm'},
              ctViews.ExerciseForm({as: this.props.as, bus: this.props.bus})
            ),

            ctViews.Screen({isActive: screen === 'resultsView'},
              ctViews.ResultsView({as: this.props.as, bus: this.props.bus})
            )
          )
        )
      );
    }
  });

  ctViews.Navbar = React.createClass({
    displayName: 'NavBar',

    render: function(){
      var screen, active, inactive;

      screen = ctViews.getScreenName(this.props.as);
      active = ' ct-sidebar__item--active';
      inactive = '';

      return (
        _.div({className: 'ct-sidebar'},
          _.p({className: 'ct-sidebar__logo'}, 'Conjugate this'),
          _.p(
            {
              className: 'ct-sidebar__item'  + (screen === 'settingsForm' ? active : inactive),
              onClick: this.navigateToConfigureExercise
            },
            'Home'
          ),
          _.p(
            {
              className: 'ct-sidebar__item' + (screen === 'verbList' ? active : inactive),
              onClick: this.navigateToVerbList
            },
            'Verbs'
          )
        )
      )
    },

    navigateToVerbList: function(e){
      e.preventDefault();
      this.props.bus.push({
        type: 'navigateToVerbList'
      });
    },

    navigateToConfigureExercise: function(e){
      e.preventDefault();
      this.props.bus.push({
        type: 'navigateToConfigureExercise'
      });
    }

  });

  ctViews.CharacterMap = React.createClass({
    displayName: 'CharacterMap',

    chars: "ÁÉÍÓÚÜÑ¿¡",

    propTypes: {
      as: React.PropTypes.instanceOf(ctRecords.AppState).isRequired,
      bus: React.PropTypes.instanceOf(Bacon.Bus).isRequired
    },

    getInitialState: function() {
      return {
        shiftHeld: false
      }
    },

    componentDidMount: function(){

      function isShift(e){
        return e.keyCode === 16;
      }

      if(this.shiftChanged === undefined){
        this.shiftKeyDowns = Bacon.fromEventTarget(document.body, 'keydown')
            .filter(isShift)
            .map(function(){return true});

        this.shiftKeyUps = Bacon.fromEventTarget(document.body, 'keyup')
            .filter(isShift)
            .map(function(){return false});

        this.shiftChanged = this.shiftKeyDowns.merge(this.shiftKeyUps);
      }

      this.unsubscribeShiftChanged = this.shiftChanged.onValue(this.onShiftChanged.bind(this));
    },

    componentWillUnmount: function(){
      this.unsubscribeShiftChanged();
    },

    onShiftChanged: function(shiftHeld){
      this.setState({shiftHeld: shiftHeld});
    },

    render: function(){
      var chars, buttons;
      chars = this.state.shiftHeld ? this.chars : this.chars.toLowerCase();
      buttons = chars.split('').map(function(c, index){
        return _.a(
          {className: 'badge', onClick: this.onClick.bind(null, c), key: 'char-' + index, href: '#'},
          c
        );
      }.bind(this));
      return _.div({}, buttons);
    },

    /**
     * @param ch String, character to append to focused answer
     * @param e
     */
    onClick: function(ch, e){
      var focusedAnswerIndex,
          value;

      e.preventDefault();

      focusedAnswerIndex = this.props.as.get('focusedAnswerIndex');
      value = this.props.as.getIn(['answers', focusedAnswerIndex]) + ch;

      this.props.bus.push({
        type: 'setAnswer',
        pronounIndex: focusedAnswerIndex,
        value: value
      });
    }
  });

  ctViews.VerbListView = React.createClass({

    displayName: 'VerbListView',

    render: function(){
      var tense,
          tenseKey,
          spanishInfinitive,
          orderedVerbs,
          header,
          rows,
          order;

      tense = this.props.as.getIn(['tense']);
      tenseKey = ctRecords.TENSES.get(tense);

      order = this.props.as.get('verbListVerbOrder');

      if(order == ctRecords.VERB_LIST_ORDER_ALPHABETICALLY){
        orderedVerbs = ctRecords.VERBS_ALPHABETICAL_ORDER;

      } else if(order == ctRecords.VERB_LIST_ORDER_AS_PRACTICED){
        orderedVerbs = this.props.as.getIn(['verbOrder', tense]);

      } else {
        orderedVerbs = [];
      }

      header = (
        _.tr({},
          _.th({}, 'infinitive'),
          ctRecords.PRONOUNS.map(function(idx, pronoun){
            return _.th({}, pronoun);
          }).toArray(),
          _.th({}, 'score')
        )
      );

      rows = orderedVerbs.map(function(verbKey){
        var verb;

        verb = ctRecords.INDEXED_VERBS.get(verbKey);
        spanishInfinitive = verb.getIn(['spanish']);

        return (
          _.tr({},
            _.th({}, verb.getIn(['spanish'])),
            ctRecords.PRONOUNS.map(function(idx, pronoun){
              var conjugation = verb.getIn(['conjugations', tenseKey, idx, 1]),
                  isRegular = verb.getIn(['conjugations', tenseKey, idx, 0]) === 'r',
                  style = isRegular ? {} : {color: 'red'};

              return _.td({style:style}, conjugation);
            }).toArray(),
            _.td({},
              this.props.as.getIn(['accumulatedScores', spanishInfinitive, tenseKey, 'correct']) +
              '/' +
              this.props.as.getIn(['accumulatedScores', spanishInfinitive, tenseKey, 'attempted'])
            )
          )
        );
      }.bind(this)).toArray();

      return (
        _.div({},
          _.div({className: 'ct-screen__toolbar'},
            _.div({className: 'row', style: {paddingBottom: '1em'}},
              _.div({className: 'col-md-12', style: {textAlign: 'right'}},
                _.form({className: 'form-inline'},
                  _.div({className: 'button-toolbar'},
                    ctViews.TensePicker({as: this.props.as, bus: this.props.bus}),
                    ctViews.VerbListVerbOrderToggle({as: this.props.as, bus: this.props.bus})
                  )
                )
              )
            )
          ),
          _.div({className: 'ct-screen__content'},
            _.table({className: 'table table-bordered'},
              _.thead({}, header),
              _.tbody({}, rows)
            )
          )
        )
      );
    }
  });

  ctViews.TensePicker = React.createClass({

    displayName: 'TensePicker',

    render: function(){
      var options;

      options = ctRecords.TENSES.map(function(tenseId, tense) {
        return _.option({value: tense}, tense);
      }, this).valueSeq().toArray();

      return (
        _.select({
            onChange: this.onTenseChange,
            value: this.props.as.get('tense'),
            className: 'form-control'
          },
          options
        )
      );
    },

    onTenseChange: function(e) {
      this.props.bus.push({
        type: 'setTense',
        value: e.target.value
      });
    }
  });

  ctViews.VerbListVerbOrderToggle = React.createClass({

    displayName: 'VerbListVerbOrderToggle',

    render: function(){
      var currentValue = this.props.as.get('verbListVerbOrder'),
          otherValue = currentValue == ctRecords.VERB_LIST_ORDER_AS_PRACTICED ?
            ctRecords.VERB_LIST_ORDER_ALPHABETICALLY :
            ctRecords.VERB_LIST_ORDER_AS_PRACTICED;

      return (
        _.a(
          {
            href: '#',
            className: 'btn btn-default',
            onClick: function(e){
              e.preventDefault();
              this.setOrder(otherValue)
            }.bind(this)
          },
          otherValue
        )
      )
    },

    setOrder: function(order) {
      this.props.bus.push({
        type: 'setVerbListVerbOrder',
        value: order
      });
    }
  });

  return ctViews;
});
