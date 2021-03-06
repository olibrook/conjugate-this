/**
 * Constants and Records which form the model of the app.
 */
define(['Immutable', 'conjthisVerbs'], function(Immutable, ctVerbs) {

  'use strict';

  var ctRecords = {};

  // Maps pronoun -> index used in the verbs data
  ctRecords.PRONOUNS = Immutable.OrderedMap([
    ['yo', 0],
    ['tú', 1],
    ['él/ella/Ud.', 2],
    ['nosotros', 3],
    ['vosotros', 4],
    ['ellos/ellas/Uds.', 5]
  ]);

  // Maps tense -> key used in the verbs data
  ctRecords.TENSES = Immutable.OrderedMap([
    ['Indicative, present', 'indicative/present'],
    ['Indicative, preterite', 'indicative/preterite'],
    ['Indicative, future', 'indicative/future'],
    ['Indicative, conditional', 'indicative/conditional'],
    ['Indicative, imperfect', 'indicative/imperfect'],
    ['Imperative', 'imperative/imperative'],
    ['Subjunctive, present', 'subjunctive/present'],
    ['Subjunctive, imperfect', 'subjunctive/imperfect'],
    ['Subjunctive, imperfect 2', 'subjunctive/imperfect-2'],
    ['Subjunctive, future', 'subjunctive/future']
  ]);

  ctRecords.INITIAL_ANSWERS = ctRecords.PRONOUNS.map(function() {
    return '';
  }).toList();

  ctRecords.ANSWER_UNGRADED = 'ANSWER_UNGRADED';
  ctRecords.ANSWER_CORRECT = 'ANSWER_CORRECT';
  ctRecords.ANSWER_INCORRECT = 'ANSWER_INCORRECT';

  ctRecords.INITIAL_ANSWER_STATUSES = ctRecords.PRONOUNS.map(function() {
    return ctRecords.ANSWER_UNGRADED;
  }).toList();

  ctRecords.DISPLAY_CORRECT_ANSWERS = 'DISPLAY_CORRECT_ANSWERS';
  ctRecords.DISPLAY_USER_ANSWERS = 'DISPLAY_USER_ANSWERS';

  ctRecords.VERB_LIST_ORDER_AS_PRACTICED = 'Practice order';
  ctRecords.VERB_LIST_ORDER_ALPHABETICALLY = 'Alphabetical order';

  ctRecords.VERBS_ALPHABETICAL_ORDER = Immutable.List(
    ctVerbs.map(
      function(verb){return verb.spanish;}
    ).sort()
  );

  ctRecords.INDEXED_VERBS = function(){
    var indexed, i, verb;

    indexed = new Immutable.Map();
    for(i=0; i<ctVerbs.length; i+=1) {
      verb = ctVerbs[i];
      indexed = indexed.set(verb.spanish, Immutable.fromJS(verb))
    }
    return indexed;
  }();

  /**
   * The entire AppState is a single, immutable record.
   * @type {*}
   */
  ctRecords.AppState = Immutable.Record({

    // The start state
    stateName: 'configureExercise',

    // Current verb to conjugate
    verb: null,

    // Number correctly answered
    numCorrect: 0,

    // Number attempted
    numAttempted: 0,

    // Number of tasks in the exercise
    numToAttempt: 20,

    // The answers as typed by the user
    answers: ctRecords.INITIAL_ANSWERS,

    // The index of the focused answer
    focusedAnswerIndex: 0,

    // Correct/incorrect for each of the given answers. Array.<Boolean>
    answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES,

    // Tense active for the exercise
    tense: ctRecords.TENSES.keySeq().first(),

    // Display corrections or user's answers when task incorrectly solved
    taskIncorrectDisplayMode: ctRecords.DISPLAY_CORRECT_ANSWERS,

    // A queue of verbs to test, one per tense.
    verbOrder: ctRecords.TENSES.map(function(){
      return ctRecords.VERBS_ALPHABETICAL_ORDER;
    }),

    // On the verb list screen display verbs alphabetically or in the
    // order practiced for that tense.
    verbListVerbOrder: ctRecords.VERB_LIST_ORDER_ALPHABETICALLY,

    // All-time scores for each verb and tense
    accumulatedScores: ctRecords.INDEXED_VERBS.map(function(){
      return ctRecords.TENSES.flip().map(function(){
        return Immutable.Map({attempted: 0, correct: 0});
      })
    })
  });



  ctRecords.SAVE_KEY = 'ct-save';

  /**
   * Partial save of the AppState to local storage.
   * @param appState
   */
  ctRecords.saveAppState = function(appState){
    console.log('Saving app state');

    var saveFields = {
      verbOrder: appState.get('verbOrder').toJSON(),
      accumulatedScores: appState.get('accumulatedScores').toJSON()
    };
    localStorage.setItem(ctRecords.SAVE_KEY, JSON.stringify(saveFields));
  };

  /**
   * Partial restore of the AppState from local storage. Returns a new
   * AppState if never saved before.
   */
  ctRecords.restoreAppState = function(){
    var appState,
        saved;

    appState = new ctRecords.AppState();
    saved = JSON.parse(localStorage.getItem(ctRecords.SAVE_KEY));
    if(saved){
      console.log('Restoring app state');
      appState = appState.set('verbOrder', Immutable.fromJS(saved.verbOrder));
      appState = appState.set('accumulatedScores', Immutable.fromJS(saved.accumulatedScores));
    }
    return appState;
  };

  return ctRecords;
});
