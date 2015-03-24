define(['Immutable', 'conjthisConstants'], function(Immutable, ctConstants){

  'use strict';

  var ctRecords = {};

  /**
   * A translation/conjugation task.
   * @type {*}
   */
  ctRecords.Task = Immutable.Record({
    // The tense required for this task
    tense: '',

    // The verb to conjugate
    verb: null
  });

  /**
   * The entire AppState is a single, immutable record.
   * @type {*}
   */
  ctRecords.AppState = Immutable.Record({

    // The start state
    stateName: 'configureExercise',

    // Current conjugation task
    task: null,

    // Number correctly answered
    numCorrect: 0,

    // Number attempted
    numAttempted: 0,

    // Number of tasks in the exercise
    numToAttempt: 20,

    // The task answers as typed by the user
    answers: ctConstants.INITIAL_ANSWERS,

    // Correct/incorrect for each of the given answers. Array.<Boolean>
    answerStatuses: ctConstants.INITIAL_ANSWER_STATUSES,

    // Pronouns active on the exercise
    pronouns: ctConstants.PRONOUNS.map(function(){
      return true;
    }).toMap(),

    // Tense active for the exercise
    tense: ctConstants.TENSES.keySeq().first()
  });

  return ctRecords;

});
