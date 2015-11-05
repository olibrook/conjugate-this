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
          _.div({className: 'ct-screen__toolbar clearfix'},
            _.div({className: 'pull-left'},
              _.h1({className: 'ct-screen__toolbar-heading'}, tense)
            )
          ),
          _.div({className: 'ct-screen__content'},
            _.div({className: 'panel panel-default'},
              _.div({className: 'panel-body'},
                _.div({className: 'clearfix'},
                  _.div({className: 'pull-left'},
                    _.h2({style: {margin: '0 0 15px'}}, display)
                  ),
                  _.div({className: 'pull-right'},
                    _.span({className: 'badge'}, this.props.as.get('numCorrect') + ' / ' + this.props.as.get('numAttempted'))
                  )
                ),
                _.form({className: 'form-horizontal', role: 'form', style: {margin: '0 15px'}, onSubmit: this.onSubmit},
                  statusPronounPairs.map(
                    function(statusPronounPair, index) {
                      return ctViews.conjugatorTextInput({
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
                  _.div({className: 'form-group clearfix', style: {marginBottom: '0'}},
                    _.div({className: 'pull-left'},
                      ctViews.characterMap({as: this.props.as, bus: this.props.bus})
                    ),
                    _.div({className: 'pull-right'},
                      ctViews.correctionsToggleButton({
                        as: this.props.as, bus: this.props.bus
                      }),
                      ' ',
                      _.button({type: 'submit', className: 'btn btn-primary ct-btn-check-continue'},
                        stateName === 'solveTask' ? 'Check' : 'Continue'
                      )
                    )
                  )
                )
              )
            )
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
              className: 'btn btn-default ct-btn-corrections-toggle'
            },
            'My answers'
          );
        }

        if (this.props.as.get('taskIncorrectDisplayMode') === ctRecords.DISPLAY_USER_ANSWERS) {
          return _.button(
            {
              onClick: this.onClick.bind(null, ctRecords.DISPLAY_CORRECT_ANSWERS),
              className: 'btn btn-default ct-btn-corrections-toggle'
            },
            'Correct answers'
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

      var tensePickers, i;

      i = 0;
      tensePickers = ctRecords.TENSES.map(function(tenseId, tense) {
        return (
          _.a({className: 'tense-choice', href: "#", onClick: function(e){this.onTenseClick(e, tense)}.bind(this)},
            _.span({className: 'tense-choice__inner tense-choice__inner--' + i++}),
            _.span({className: 'tense-choice__label'}, tense)
          )
        );
      }, this).valueSeq().toArray();

      return (
        _.div({},
          _.div({className: 'ct-screen__toolbar'},
            _.h1({className: 'ct-screen__toolbar-heading'}, 'Conjugate This')
          ),
          _.div({className: 'ct-screen__content'},

            _.div({style: {display: 'flex', flexWrap: 'wrap'}},
              tensePickers
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
    },

    onTenseClick: function(e, tense) {
      e.preventDefault();

      this.props.bus.push({
        type: 'setTense',
        value: tense
      });

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
      var tense, numCorrect, numAttempted, judgement, percentage;


      tense = this.props.as.get('tense');
      numCorrect = this.props.as.get('numCorrect');
      numAttempted = this.props.as.get('numAttempted');
      percentage = numCorrect / numAttempted;
      judgement =
        percentage == 1  ? "Perfect!" :
        percentage > .95 ? "Great!" :
        percentage > .75 ? "Pretty good." : "There's room for improvement here.";

      return (
        _.div({},
          _.div({className: 'ct-screen__toolbar'},
            _.h1({className: 'ct-screen__toolbar-heading'}, tense)
          ),
          _.div({className: 'ct-screen__content'},
            _.div({className: 'panel panel-default'},
              _.div({className: 'panel-heading'}, 'Results'),
              _.div({className: 'panel-body'},
                _.form({className: 'form-horizontal', style: {margin: '0 15px'}},
                  _.div({style: {textAlign: 'center'}},
                    _.h3({}, 'You scored ' + numCorrect + '/' + numAttempted),
                    _.p({}, judgement)
                  ),
                  _.div({className: 'form-group clearfix'},
                    _.div({className: 'pull-right'},
                      _.button(
                        {className: 'btn btn-primary', onClick: this.onContinueClick},
                        'Continue'
                      )
                    )
                  )
                )
              )
            )
          )
        )
      );
    },

    onContinueClick: function(e) {
      e.preventDefault();
      this.props.bus.push({
        type: 'startAgain'
      });
    }
  });

  ctViews.Screen = React.createClass({
    displayName: 'Screen',

    render: function() {
      return (
        _.div({className: 'ct-screen'}, this.props.children)
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
      var screen = ctViews.getScreenName(this.props.as);

      return (
        _.div({className: 'ct-root'},
          ctViews.navbar({as: this.props.as, bus: this.props.bus}),
          _.div({className: 'ct-main' , ref: 'slider'},

            React.createElement(React.addons.CSSTransitionGroup, {transitionName: "example"},

              (screen === 'verbList') ?
                ctViews.screen({key: 'verbList'},
                  ctViews.verbListView({as: this.props.as, bus: this.props.bus})
                ) :

              (screen === 'settingsForm') ?
                ctViews.screen({key: 'settingsForm'},
                  ctViews.settingsForm({as: this.props.as, bus: this.props.bus})
                ) :

              (screen === 'exerciseForm') ?
                ctViews.screen({key: 'exerciseForm'},
                  ctViews.exerciseForm({as: this.props.as, bus: this.props.bus})
                ) :

              (screen === 'resultsView') ?

                ctViews.screen({key: 'resultsView'},
                  ctViews.resultsView({as: this.props.as, bus: this.props.bus})
                ) :

                _.span({}, 'No screen selected')
            )

          )
        )
      );
    }
  });


  ctViews.Navbar = React.createClass({
    displayName: 'NavBar',

    render: function(){
      var screen, active, inactive, displayNav;

      screen = ctViews.getScreenName(this.props.as);
      active = ' ct-sidebar__item--active';
      inactive = '';
      displayNav = ['exerciseForm', 'resultsView'].indexOf(screen) < 0;

      if(displayNav) {
        return (
          _.div({className: 'ct-sidebar'},
            _.a(
              {
                href: '#',
                className: 'ct-sidebar__item'  + (screen === 'settingsForm' ? active : inactive),
                onClick: this.navigateToConfigureExercise
              },
              'Home'
            ),
            _.a(
              {
                href: '#',
                className: 'ct-sidebar__item' + (screen === 'verbList' ? active : inactive),
                onClick: this.navigateToVerbList
              },
              'Verbs and scores'
            )
          )
        );
      } else {
        return (
          _.div({className: 'ct-sidebar'})
        );
      }
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
          {className: 'ct-character-map__character', onClick: this.onClick.bind(null, c), key: 'char-' + index, href: '#'},
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
            _.div({className: 'row'},
              _.div({className: 'col-md-4'},
                _.h1({className: 'ct-screen__toolbar-heading'}, 'Verbs and scores')
              ),
              _.div({className: 'col-md-8', style: {textAlign: 'right'}},
                _.form({className: 'form-inline ct-screen__toolbar-form'},
                  ctViews.tensePicker({as: this.props.as, bus: this.props.bus}),
                  ' ',
                  ctViews.verbListVerbOrderToggle({as: this.props.as, bus: this.props.bus})
                )
              )
            )
          ),
          _.div({className: 'ct-screen__content'},
            _.div({className: 'panel panel-default'},
              _.table({className: 'table table-bordered'},
                _.thead({}, header),
                _.tbody({}, rows)
              )
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
        _.div({className: 'form-group'},
          _.label({htmlFor: 'tense-picker'}, 'Show tense'),
          ' ',
          _.select({
              id: 'tense-picker',
              onChange: this.onTenseChange,
              value: this.props.as.get('tense'),
              className: 'form-control'
            },
            options
          )
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
      var value = this.props.as.get('verbListVerbOrder'),
          options = [
            ctRecords.VERB_LIST_ORDER_ALPHABETICALLY,
            ctRecords.VERB_LIST_ORDER_AS_PRACTICED
          ];

      options = options.map(function(opt){
        return _.option({value: opt}, opt);
      });

      return (
        _.div({className: 'form-group'},
          _.label({forHtml: 'verb-order-toggle'}, 'Sort by'),
          ' ',
          _.select({
              id: 'verb-order-toggle',
              onChange: this.onSortOrderChange,
              value: value,
              className: 'form-control'
            },
            options
          )
        )
      );
    },

    onSortOrderChange: function(e) {
      this.props.bus.push({
        type: 'setVerbListVerbOrder',
        value: e.target.value
      });
    }
  });




  // Factory functions required by latest react version
  // when not using JSX. Sigh.


  ctViews.conjugatorTextInput = React.createFactory(
    ctViews.ConjugatorTextInput
  );

  ctViews.exerciseForm = React.createFactory(
    ctViews.ExerciseForm
  );

  ctViews.correctionsToggleButton = React.createFactory(
    ctViews.CorrectionsToggleButton
  );

  ctViews.settingsForm = React.createFactory(
    ctViews.SettingsForm
  );

  ctViews.resultsView = React.createFactory(
    ctViews.ResultsView
  );

  ctViews.screen = React.createFactory(
    ctViews.Screen
  );

  ctViews.conjugatorMain = React.createFactory(
    ctViews.ConjugatorMain
  );

  ctViews.navbar = React.createFactory(
    ctViews.Navbar
  );

  ctViews.characterMap = React.createFactory(
    ctViews.CharacterMap
  );

  ctViews.verbListView = React.createFactory(
    ctViews.VerbListView
  );

  ctViews.tensePicker = React.createFactory(
    ctViews.TensePicker
  );

  ctViews.verbListVerbOrderToggle = React.createFactory(
    ctViews.VerbListVerbOrderToggle
  );

  return ctViews;
});
