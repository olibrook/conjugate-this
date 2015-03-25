// TODO: Add a 'finished' state with a results screen.
// TODO: Plan for spaced repetition:
//   - Each tense gets a queue of verb names
//   - As a verb is completed, it is marked as correct or incorrect.
//   - Correctly completed verbs go to the back of the queue, incorrect further
//     to the front.
//   - When picking the next verb for a task, always pick from the front of
//     the queue.
// TODO: Remove the task record. Totally unnecessary.
// TODO: Ability to input spanish characters.
// TODO: Stupid idea - make a turn-based, pokemon-style battle game out of this!

define([
    'React',
    'Bacon',
    'Immutable',
    'conjthisVerbs',
    'conjthisViews',
    'conjthisConstants',
    'conjthisRecords',
    'conjthisUtils'
], function(React, Bacon, Immutable, ctVerbs, ctViews, ctConstants, ctRecords, ctUtils) {

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


  // TODO: Obviously shit.
  ctMain.arraysEqual = function(arr1, arr2) {
    var i;
    if (arr1.length !== arr2.length) {

    }
    for (i = 0; i < arr1.length; i += 1) {
      if (arr1[i] !== arr2[i]) {
        return false;
      }
    }
    return true;
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
  ctMain.nextState = function(appState, message, nextTask) {
    var obj, as;

    if (!appState) {
      console.log((new ctRecords.AppState).toJSON());
      return new ctRecords.AppState();
    }

    if (appState.stateName === 'configureExercise') {
      if (message.type === 'setTense') {
        return appState.mergeDeep({tense: message.value});
      }
      if (message.type === 'updatePronouns') {
        obj = {pronouns: {}};
        obj.pronouns[message.key] = message.value;
        return appState.mergeDeep(obj);
      }
      if (message.type === 'startExercise') {
        return appState.mergeDeep({
          stateName: 'solveTask',
          task: nextTask(appState),
          answers: ctConstants.INITIAL_ANSWERS,
          answerStatuses: ctConstants.INITIAL_ANSWER_STATUSES
        });
      }
    }

    if (appState.stateName === 'solveTask') {
      if (message.type === 'submit') {

        var tenseKey = ctConstants.TENSES.get(appState.get('tense'));

        var solutions = appState.getIn(
          ['task', 'verb', 'conjugations', tenseKey]
        ).map(function(val) {
            return val.get(1);
        }).toArray();

        var givenAnswers = appState.answers.toArray();

        var solutionsAndAnswers = ctUtils.zip(solutions, givenAnswers);

        var answerStatuses = solutionsAndAnswers.map(function(arr) {
          return arr[0] === arr[1] ?
            ctConstants.ANSWER_CORRECT : ctConstants.ANSWER_INCORRECT;
        });

        var allCorrect = answerStatuses.every(function(status) {
          return status === ctConstants.ANSWER_CORRECT;
        });

        return appState.mergeDeep({
          stateName: allCorrect ? 'taskCorrect' : 'taskIncorrect',
          numCorrect: allCorrect ? appState.numCorrect + 1 : appState.numCorrect,
          numAttempted: appState.numAttempted + 1,
          answerStatuses: Immutable.List(answerStatuses)
        });
      }

      else if (message.type === 'setAnswer') {
        return appState.set(
          'answers', appState.get('answers').set(
            message.pronounIndex,
            message.value
          )
        );
      }
    }

    if (appState.stateName === 'taskIncorrect') {
      if (message.type === 'setTaskIncorrectDisplayMode') {
        return appState.mergeDeep({
          taskIncorrectDisplayMode: message.value
        });
      }
    }

    if (['taskCorrect', 'taskIncorrect'].indexOf(appState.stateName) >= 0) {
      if (message.type === 'submit') {
        if (appState.numAttempted === appState.numToAttempt) {
          as = appState.mergeDeep({
            stateName: 'exerciseFinished',
            answers: ctConstants.INITIAL_ANSWERS,
            answerStatuses: ctConstants.INITIAL_ANSWER_STATUSES
          });
          // Doesn't look like you can set to null with mergeDeep.
          as = as.set('task', null);
          return as;
        } else {
          return appState.mergeDeep({
            stateName: 'solveTask',
            task: nextTask(appState),
            answers: ctConstants.INITIAL_ANSWERS,
            answerStatuses: ctConstants.INITIAL_ANSWER_STATUSES,
            taskIncorrectDisplayMode: ctConstants.DISPLAY_CORRECT_ANSWERS
          });
        }
      }
    }

    if (appState.stateName === 'exerciseFinished') {
      if (message.type === 'startAgain') {
        return appState.mergeDeep({
          stateName: 'configureExercise',
          numAttempted: 0,
          numCorrect: 0,
          answers: ctConstants.INITIAL_ANSWERS,
          answerStatuses: ctConstants.INITIAL_ANSWER_STATUSES
        });
      }
    }

    console.log(
        'Unhandled message: stateName: "' + appState.stateName
            + '" type: "' + message.type + '". Ignoring.');

    return appState; // Unmodified
  };

  /**
   * Constructor for the app, bundles up those bits which are unavoidably
   * stateful.
   *
   * @constructor
   */
  ctMain.ConjugateThis = function() {
    this.el = document.createElement('div');
    this.appState = ctMain.nextState(null, null, ctMain.nextTask);

    this.component = React.renderComponent(
        ctViews.ConjugatorMain({as: this.appState}), this.el);
    this.bus = new Bacon.Bus();

    this.commandStream = Bacon.fromEventTarget(this.el, 'command', function(event) {
      return event.detail;
    });

    this.bus.plug(this.commandStream);
    this.bus.onValue(
      function(message) {
        this.appState = ctMain.nextState(this.appState, message, ctMain.nextTask);
        console.log(this.appState.toJSON());
        this.component.setProps({as: this.appState});
      }.bind(this)
    );
  };

  ctMain.init = function() {
    var app = new ctMain.ConjugateThis();
    document.body.appendChild(app.el);
  };

  return ctMain;
});
