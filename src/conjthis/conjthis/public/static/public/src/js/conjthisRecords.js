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

    // Typically a pronoun, eg. conjugation this for "yo"
    prompt: '',

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

    // Streak of correct answers
    streak: 0,

    // Number of tasks in the exercise
    numToAttempt: 5,

    // The task answer as typed by the user
    answer: '',

    // Pronouns active on the exercise
    pronouns: ctConstants.PRONOUNS.map(function(){
      return true;
    }).toMap(),

    // Tenses active on the exercise
    tenses: ctConstants.TENSES.map(function(){
      return true;
    }).toMap()
  });

  return ctRecords;

});
