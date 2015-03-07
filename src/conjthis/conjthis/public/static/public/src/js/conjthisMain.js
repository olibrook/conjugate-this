define([
    'React',
    'Bacon',
    'Immutable',
    'conjthisVerbs',
    'conjthisViews',
    'conjthisConstants'
], function(React, Bacon, Immutable, ctVerbs, ctViews, ctConstants) {

  'use strict';

  var ctMain;

  ctMain = {};

  ctMain.verbs = Immutable.fromJS(ctVerbs);

  ctMain.choose = function(arr){
    return arr.get(Math.round(Math.random() * (arr.length - 1)));
  };

  /**
   * Selects a tense, given the current app state.
   */
  ctMain.getTense = function(appState){
    var activeTenses, tense, tenseName;

    activeTenses = appState.get('tenses').filter(function(isActive){
      return isActive;
    });
    tense = ctMain.randomEntry(activeTenses);
    tenseName = tense[0];
    return tenseName;
  };

  /**
   * Selects a pronoun, given the current app state.
   */
  ctMain.getPronoun = function(appState){
    var activePronouns, pronoun, pronounName;

    activePronouns = appState.get('pronouns').filter(function(isActive){
      return isActive;
    });
    pronoun = ctMain.randomEntry(activePronouns);
    pronounName = pronoun[0];
    return pronounName;
  };

  /**
   * TODO: This is not a pure function - uses Math.random. Maybe cleaner
   * to pass in an iterator over a pre-randomized sequence of pronouns/tenses?
   */
  ctMain.createTask = function(verb, appState){
    var tense, tenseId, pronoun, pronounIdx, conjugations,
        conjugation, regularFlag, solution;

    tense = ctMain.getTense(appState);
    tenseId = ctConstants.TENSES.get(tense);

    pronoun = ctMain.getPronoun(appState);
    pronounIdx = ctConstants.PRONOUNS.get(pronoun);

    conjugation = verb.getIn(['conjugations', tenseId, pronounIdx]);
    regularFlag = conjugation.get(0);
    solution = conjugation.get(1);

    return new ctMain.Task({
      display: verb.get('spanish') + ' (' + verb.get('english') + ') ' + tense,
      prompt: pronoun,
      regularFlag: regularFlag,
      solution: solution
    });
  };

  ctMain.nextTask = function(appState){
    return ctMain.createTask(ctMain.choose(ctMain.verbs), appState);
  };

  ctMain.randomEntry = function(map){
    var keys = map.keySeq().toArray(),
        randomKey = keys[Math.round(Math.random() * (keys.length - 1))];
    return [randomKey, map.get(randomKey)];
  };





  /**
   * A translation/conjugation task.
   * @type {*}
   */
  ctMain.Task = Immutable.Record({
    display: '',
    prompt: '',
    solution: '',
    regularFlag: ''
  });

  /**
   * The entire AppState is a single, immutable record.
   * @type {*}
   */
  ctMain.AppState = Immutable.Record({
    stateName: '',
    task: null,
    correct: 0,
    attempted: 0,
    streak: 0,
    answer: '',
    pronouns: {},
    tenses: {}
  });

  /**
   * The main logic of the app. Takes an old app state and returns a new one
   * based on the input of some kind of application message.
   *
   * Keep this a pure function.
   *
   * @param appState
   * @param message
   * @param nextTask
   * @returns {*}
   */
  ctMain.nextState = function(appState, message, nextTask){
    var isCorrect, obj;

    if(!appState){
      return new ctMain.AppState({
        task: null,
        stateName: 'configureExercise',
        pronouns: ctConstants.PRONOUNS.map(function(){
          return true;
        }).toMap(),
        tenses: ctConstants.TENSES.map(function(){
          return true;
        }).toMap()
      });
    }

    if(appState.stateName === 'configureExercise'){
      if(message.type === 'updateTenses'){
        obj = {tenses: {}};
        obj.tenses[message.key] = message.value;
        return appState.mergeDeep(obj);
      }
      if(message.type === 'updatePronouns'){
        obj = {pronouns: {}};
        obj.pronouns[message.key] = message.value;
        return appState.mergeDeep(obj);
      }
      if(message.type === 'startExercise'){
        return appState.mergeDeep({
          stateName: 'solveTask',
          task: nextTask(appState),
          answer: ''
        });
      }
    }

    if(appState.stateName === 'solveTask'){
      if(message.type === 'submit'){
        isCorrect = appState.answer === appState.task.solution;
        return appState.mergeDeep({
          stateName: isCorrect ? 'taskCorrect' : 'taskIncorrect',
          correct: isCorrect ? appState.correct + 1 : appState.correct,
          attempted: appState.attempted + 1,
          streak: isCorrect ? appState.streak + 1 : 0
        });
      }

      else if(message.type === 'setAnswer'){
        return appState.mergeDeep({
          answer: message.value
        });
      }
    }

    if(['solveTask', 'taskCorrect', 'taskIncorrect'].indexOf(appState.stateName) >= 0){
      if(message.type === 'next'){
        return appState.mergeDeep({
          stateName: 'solveTask',
          task: nextTask(appState),
          answer: ''
        })
      }
    }

    else {
      throw new Error('Unhandled message type: "' + message.type + '"');
    }
  };

  /**
   * Constructor for the app, bundles up those bits which are unavoidably
   * stateful.
   *
   * @constructor
   */
  ctMain.ConjugateThis = function(){
    this.el = document.createElement('div');
    this.appState = ctMain.nextState(null, null, ctMain.nextTask);

    this.component = React.renderComponent(
        ctViews.ConjugatorMain({as: this.appState}), this.el);
    this.bus = new Bacon.Bus();

    this.commandStream = Bacon.fromEventTarget(this.el, "command", function(event){
      return event.detail
    });

    this.bus.plug(this.commandStream);
    this.bus.onValue(
      function(message){
        this.appState = ctMain.nextState(this.appState, message, ctMain.nextTask);
        this.component.setProps({as: this.appState});
      }.bind(this)
    );
  };

  ctMain.init = function(){
    var app = new ctMain.ConjugateThis();
    document.body.appendChild(app.el);
  };

  return ctMain;
});
