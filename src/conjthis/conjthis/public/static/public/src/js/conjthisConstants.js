define(['Immutable'], function(Immutable){

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
    ["Indicative, present", "indicative/present"],
    ["Indicative, preterite", "indicative/preterite"],
    ["Indicative, future", "indicative/future"],
    ["Indicative, conditional", "indicative/conditional"],
    ["Indicative, imperfect", "indicative/imperfect"],
    ["Imperative", "imperative/imperative"],
    ["Subjunctive, present", "subjunctive/present"],
    ["Subjunctive, imperfect", "subjunctive/imperfect"],
    ["Subjunctive, imperfect 2", "subjunctive/imperfect-2"],
    ["Subjunctive, future", "subjunctive/future"]
  ]);

  return ctConstants;
});
