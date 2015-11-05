define([], function() {

  'use strict';

  var ctAudio = {};

  ctAudio.incorrectAudio = new Audio('/src/audio/incorrect.mp3');

  ctAudio.correctAudio = new Audio('/src/audio/correct.mp3');

  ctAudio.playSound = function(appStates) {
    var transition;

    transition = appStates.map(
      function(appState){
        return appState.get('stateName')
      }
    ).join('->');

    switch(transition){
      case 'solveTask->taskIncorrect':
        ctAudio.incorrectAudio.play();
        break;
      case 'solveTask->taskCorrect':
        ctAudio.correctAudio.play();
        break;
      default:
        break;
    }
  };

  return ctAudio;
});
