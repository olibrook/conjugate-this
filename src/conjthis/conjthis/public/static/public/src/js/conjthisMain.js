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

  /**
   * Choose the next verb to practice.
   */
  ctMain.chooseVerb = function(arr) {
    return arr[Math.round(Math.random() * (arr.length - 1))];
  };

  ctMain.createTask = function(verb, appState) {
    return new ctRecords.Task({
      tense: appState.get('tense'),
      verb: Immutable.fromJS(verb)
    });
  };

  ctMain.nextTask = function(appState) {
    return ctMain.createTask(ctMain.chooseVerb(ctVerbs), appState);
  };

  ctMain.randomEntry = function(map) {
    var keys = map.keySeq().toArray(),
        randomKey = keys[Math.round(Math.random() * (keys.length - 1))];
    return [randomKey, map.get(randomKey)];
  };


  ctMain.configureExercise = {};

  ctMain.configureExercise.setTense = function(appState, message){
    return appState.set('tense', message.value);
  };

  ctMain.configureExercise.updatePronouns = function(appState, message){
    return appState.setIn(['pronouns', message.key], message.value);
  };

  ctMain.configureExercise.startExercise = function(appState, message){
    return appState.mergeDeep({
      stateName: 'solveTask',
      task: ctMain.nextTask(appState),
      answers: ctRecords.INITIAL_ANSWERS,
      answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES
    });
  };

  ctMain.solveTask = {};

  ctMain.solveTask.submit = function(appState, message){
    var tenseKey, solutions, givenAnswers, solutionsAndAnswers,
        answerStatuses, allCorrect;

    tenseKey = ctRecords.TENSES.get(appState.get('tense'));

    solutions = appState.getIn(
      ['task', 'verb', 'conjugations', tenseKey]
    ).map(function(val) {
        return val.get(1);
    }).toArray();

    givenAnswers = appState.answers.toArray();

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

  ctMain.solveTask.setAnswer = function(appState, message){
    return appState.setIn(['answers', message.pronounIndex], message.value);
  };

  ctMain.taskIncorrect = {};

  ctMain.taskIncorrect.setTaskIncorrectDisplayMode = function(appState, message){
    return appState.set('taskIncorrectDisplayMode', message.value);
  };

  ctMain.taskIncorrect.submit = function (appState, message){
    if (appState.numAttempted === appState.numToAttempt) {
      return appState.mergeDeep({
        stateName: 'exerciseFinished',
        answers: ctRecords.INITIAL_ANSWERS,
        answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES
      }).set('task', null);  // Doesn't work with mergeDeep

    } else {
      return appState.mergeDeep({
        stateName: 'solveTask',
        task: ctMain.nextTask(appState),
        answers: ctRecords.INITIAL_ANSWERS,
        answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES,
        taskIncorrectDisplayMode: ctRecords.DISPLAY_CORRECT_ANSWERS
      });
    }
  };

  ctMain.taskCorrect = {};

  ctMain.taskCorrect.submit = ctMain.taskIncorrect.submit;


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
    'configureExercise/setTense': ctMain.configureExercise.setTense,
    'configureExercise/updatePronouns': ctMain.configureExercise.updatePronouns,
    'configureExercise/startExercise': ctMain.configureExercise.startExercise,
    'solveTask/submit': ctMain.solveTask.submit,
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
   * @param nextTask
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
    this.appStates = Bacon.update(new ctRecords.AppState(),
        [this.bus], ctMain.nextState
    );

    /**
     * Stream of state names
     */
    this.stateNames = this.appStates.map(function(appState){
      return appState.get('stateName');
    });

    /**
     * Stream of named transitions, eg. 'solveTask->taskIncorrect'
     */
    this.stateTransitions = this.stateNames
      // Two at a time
      .slidingWindow(2, 1)

      // Only when changed
      .filter(function(pairs){
        return (pairs.length === 1) || (pairs[0] !== pairs[1]);
      })

      // Combine and format
      .map(function(pairs){
        return pairs.join('->');
      }
    );

    this.appStates.onValue(this.logAppStates.bind(this));
    this.appStates.onValue(this.render.bind(this));
    this.stateTransitions.onValue(ctAudio.playSound);
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

  ctMain.init = function() {
    var app;
    app = new ctMain.ConjugateThis(document.createElement('div'));
    document.body.appendChild(app.el);
  };

  return ctMain;
});
