define([
    'React',
    'Bacon',
    'Immutable',
    'conjthisVerbs',
    'conjthisViews',
    'conjthisRecords',
    'conjthisUtils',
    'conjthisAudio'
], function(React, Bacon, Immutable, ctVerbs, ctViews, ctRecords, ctUtils, ctAudio) {

  'use strict';

  var ctMain = {};

  ctMain.randomEntry = function(map) {
    var keys = map.keySeq().toArray(),
        randomKey = keys[Math.round(Math.random() * (keys.length - 1))];
    return [randomKey, map.get(randomKey)];
  };


  ctMain.setTense = function(appState, message){
    return appState.set('tense', message.value);
  };

  ctMain.viewStats = {};

  ctMain.viewStats.setTense = ctMain.setTense;

  ctMain.configureExercise = {};

  ctMain.configureExercise.setTense = ctMain.setTense;

  ctMain.configureExercise.startExercise = function(appState, message){
    var key, verbOrder;

    key = ['verbOrder', appState.getIn(['tense'])];
    verbOrder = appState.getIn(key);

    return appState.merge({
      stateName: 'solveTask',
      answers: ctRecords.INITIAL_ANSWERS,
      answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES,
      verb: Immutable.fromJS(ctRecords.INDEXED_VERBS[verbOrder.first()])
    });
  };

  ctMain.solveTask = {};

  ctMain.solveTask.submit = function(appState, message){
    var tenseKey, solutions, givenAnswers, solutionsAndAnswers,
        answerStatuses, allCorrect;

    tenseKey = ctRecords.TENSES.get(appState.get('tense'));

    solutions = appState.getIn(
        ['verb', 'conjugations', tenseKey]
    ).map(function(val) {
        return val.get(1);
    }).toArray();

    givenAnswers = appState.get('answers').toArray();

    solutionsAndAnswers = ctUtils.zip(solutions, givenAnswers);

    answerStatuses = solutionsAndAnswers.map(function(arr) {
      return arr[0] === arr[1] ?
        ctRecords.ANSWER_CORRECT : ctRecords.ANSWER_INCORRECT;
    });

    allCorrect = answerStatuses.every(function(status) {
      return status === ctRecords.ANSWER_CORRECT;
    });

    return appState.mergeDeep({
      stateName: allCorrect ? 'taskCorrect' : 'taskIncorrect',
      numCorrect: allCorrect ? appState.numCorrect + 1 : appState.numCorrect,
      numAttempted: appState.numAttempted + 1,
      answerStatuses: Immutable.List(answerStatuses)
    });
  };

  ctMain.solveTask.setFocusedAnswerIndex = function(appState, message) {
    return appState.set('focusedAnswerIndex', message.value);
  };

  ctMain.solveTask.setAnswer = function(appState, message){
    return appState.setIn(['answers', message.pronounIndex], message.value);
  };

  ctMain.taskIncorrect = {};

  ctMain.taskIncorrect.setTaskIncorrectDisplayMode = function(appState, message){
    return appState.set('taskIncorrectDisplayMode', message.value);
  };

  ctMain.nextTaskOrExit = function(appState, answeredCorrectly){
    var orderKey, nextVerbKey;

    if(appState.numAttempted === appState.numToAttempt){

      return appState.merge({
        stateName: 'exerciseFinished',
        answers: ctRecords.INITIAL_ANSWERS,
        answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES
      }).set('verb', null);  // Doesn't work with mergeDeep

    } else {

      orderKey = ['verbOrder', appState.getIn(['tense'])];

      // This update does the spaced-repetition
      appState = appState.updateIn(orderKey, function(verbOrder){
        var verbKey, spliceIndex;

        verbKey = verbOrder.first();
        verbOrder = verbOrder.shift();

        if(answeredCorrectly){
          return verbOrder.push(verbKey);
        } else {
          spliceIndex = 10;
          return verbOrder.splice(spliceIndex, 0, verbKey);
        }
      });

      nextVerbKey = appState.getIn(orderKey).first();

      return appState.merge({
        stateName: 'solveTask',
        answers: ctRecords.INITIAL_ANSWERS,
        answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES,
        taskIncorrectDisplayMode: ctRecords.DISPLAY_CORRECT_ANSWERS,
        verb: Immutable.fromJS(ctRecords.INDEXED_VERBS[nextVerbKey]),
        focusedAnswerIndex: 0
      });
    }
  };

  ctMain.taskIncorrect.submit = function (appState, message){
    var answeredCorrectly = false;
    return ctMain.nextTaskOrExit(appState, answeredCorrectly);
  };

  ctMain.taskCorrect = {};

  ctMain.taskCorrect.submit = function (appState, message){
    var answeredCorrectly = true;
    return ctMain.nextTaskOrExit(appState, answeredCorrectly);
  };

  ctMain.exerciseFinished = {};

  ctMain.exerciseFinished.startAgain = function(appState, message){
    return appState.mergeDeep({
      stateName: 'configureExercise',
      numAttempted: 0,
      numCorrect: 0,
      answers: ctRecords.INITIAL_ANSWERS,
      answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES
    });
  };

  ctMain.noop = function (appState, message){
    return appState // Unmodified
  };

  ctMain.dispatchMap = {
    'viewStats/setTense': ctMain.viewStats.setTense,
    'configureExercise/setTense': ctMain.configureExercise.setTense,
    'configureExercise/startExercise': ctMain.configureExercise.startExercise,
    'solveTask/submit': ctMain.solveTask.submit,
    'solveTask/setFocusedAnswerIndex': ctMain.solveTask.setFocusedAnswerIndex,
    'solveTask/setAnswer': ctMain.solveTask.setAnswer,
    'taskIncorrect/setTaskIncorrectDisplayMode': ctMain.taskIncorrect.setTaskIncorrectDisplayMode,
    'taskIncorrect/submit': ctMain.taskIncorrect.submit,
    'taskCorrect/submit': ctMain.taskCorrect.submit,
    'exerciseFinished/startAgain': ctMain.exerciseFinished.startAgain
  };


  /**
   * The main logic of the app. Takes an old app state and returns a new one
   * based on the input of some kind of application message.
   *
   * Keep this a pure function.
   *
   * @param appState
   * @param message
   * @return {*}
   */
  ctMain.nextState = function(appState, message) {
    var dispatchKey, func;

    dispatchKey = appState.get('stateName') + '/' + message.type;
    func = ctMain.dispatchMap[dispatchKey];
    if(func === undefined){
      console.log('No handler found for dispatchKey "'+ dispatchKey +'"');
      func = ctMain.noop;
    }
    return func(appState, message);
  };

  /**
   * Constructor for the app, bundles up those bits which are unavoidably
   * stateful.
   *
   * @constructor
   */
  ctMain.ConjugateThis = function(el) {

    /**
     * Element in which the app is rendered
     */
    this.el = el;

    /**
     * The top-most React component
     */
    this.component = null;

    /**
     * Stream of application messages
     */
    this.bus = new Bacon.Bus();

    /**
     * Stream of ctRecords.AppState instances
     */
    this.appStates = Bacon.update(ctRecords.restoreAppState(),
        [this.bus], ctMain.nextState
    );

    /**
     * Sliding window of the most recent two app states.
     */
    this.statesWhenChanged = this.appStates
      // Two at a time
      .slidingWindow(2, 1)

      // Only when changed
      .filter(function(states){
        return (
          states.length === 1 ||
          states[0].get('stateName') !== states[1].get('stateName')
        );
      }
    );

    this.appStates.onValue(this.logAppStates.bind(this));
    this.appStates.onValue(this.render.bind(this));

    this.statesWhenChanged.onValue(ctAudio.playSound);
    this.statesWhenChanged.onValue(this.saveAppState.bind(this));
  };

  ctMain.ConjugateThis.prototype.logAppStates = function(appState){
    console.log(appState.toJSON());
  };

  ctMain.ConjugateThis.prototype.render = function(appState){
    if(this.component === null){
      this.component = React.renderComponent(
        ctViews.ConjugatorMain({as: appState, bus: this.bus}),
        this.el
      );
    } else {
      this.component.setProps({as: appState});
    }
  };

  ctMain.ConjugateThis.prototype.saveAppState = function(appStates){
    var transition, appState;

    transition = appStates.map(
      function(appState){
        return appState.get('stateName')
      }
    ).join('->');

    appState = appStates[appStates.length - 1];

    if(transition === 'exerciseFinished->configureExercise') {
      ctRecords.saveAppState(appState);
    }
  };

  ctMain.init = function() {
    var app;
    app = new ctMain.ConjugateThis(document.createElement('div'));
    document.body.appendChild(app.el);
  };

  return ctMain;
});
