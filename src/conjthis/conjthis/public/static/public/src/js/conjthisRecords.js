/**
 * Constants and Records which form the model of the app.
 */
define(['Immutable'], function(Immutable) {

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

    // Correct/incorrect for each of the given answers. Array.<Boolean>
    answerStatuses: ctRecords.INITIAL_ANSWER_STATUSES,

    // Pronouns active on the exercise
    pronouns: ctRecords.PRONOUNS.map(function() {
      return true;
    }).toMap(),

    // Tense active for the exercise
    tense: ctRecords.TENSES.keySeq().first(),

    // Display corrections or user's answers when task incorrectly solved
    taskIncorrectDisplayMode: ctRecords.DISPLAY_CORRECT_ANSWERS
  });

  return ctRecords;

});
