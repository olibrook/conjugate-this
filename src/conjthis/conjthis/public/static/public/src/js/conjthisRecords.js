define(['Immutable', 'conjthisConstants'], function(Immutable, ctConstants){

  'use strict';

  var ctRecords = {};

  /**
   * A translation/conjugation task.
   * @type {*}
   */
  ctRecords.Task = Immutable.Record({

    // Exercise as displayed to the user
    display: '',

    // The pronoun of the conjugation for this task
    pronoun: '',

    // The tense required for this task
    tense: '',

    // The correct solution the the current task
    solution: '',

    // Is the solution a regular conjugation for this tense?
    regularFlag: ''
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
    correct: 0,

    // Number attempted
    attempted: 0,

    // Number of tasks in the exercise
    numToAttempt: 20,

    // The task answer as typed by the user
    answer: '',

    // Pronouns active on the exercise
    pronouns: ctConstants.PRONOUNS.map(function(){
      return true;
    }).toMap(),

    // Tense active for the exercise
    tense: ctConstants.TENSES.keySeq().first()
  });

  return ctRecords;

});
