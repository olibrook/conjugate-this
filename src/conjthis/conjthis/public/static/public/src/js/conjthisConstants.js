define(['Immutable'], function(Immutable) {

  'use strict';

  var ctConstants = {};

  // Maps pronoun -> index used in the verbs data
  ctConstants.PRONOUNS = Immutable.OrderedMap([
    ['yo', 0],
    ['tú', 1],
    ['él/ella/Ud.', 2],
    ['nosotros', 3],
    ['vosotros', 4],
    ['ellos/ellas/Uds.', 5]
  ]);

  // Maps tense -> key used in the verbs data
  ctConstants.TENSES = Immutable.OrderedMap([
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

  ctConstants.INITIAL_ANSWERS = ctConstants.PRONOUNS.map(function() {
    return '';
  }).toList();

  ctConstants.ANSWER_UNGRADED = 'ANSWER_UNGRADED';
  ctConstants.ANSWER_CORRECT = 'ANSWER_CORRECT';
  ctConstants.ANSWER_INCORRECT = 'ANSWER_INCORRECT';

  ctConstants.INITIAL_ANSWER_STATUSES = ctConstants.PRONOUNS.map(function() {
    return ctConstants.ANSWER_UNGRADED;
  }).toList();

  ctConstants.DISPLAY_CORRECT_ANSWERS = 'DISPLAY_CORRECT_ANSWERS';
  ctConstants.DISPLAY_USER_ANSWERS = 'DISPLAY_USER_ANSWERS';

  return ctConstants;
});
