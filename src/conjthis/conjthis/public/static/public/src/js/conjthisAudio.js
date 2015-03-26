define([], function() {

  'use strict';

  var ctAudio = {};

  ctAudio.incorrectAudio = new Audio('/static/public/src/audio/incorrect.mp3');

  ctAudio.correctAudio = new Audio('/static/public/src/audio/correct.mp3');

  ctAudio.playSound = function(stateTransition) {
    switch(stateTransition){
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
