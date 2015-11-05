define([], function() {

  'use strict';

  var ctAudio = {};

  /**
   * Creates a new Audio object on each play - played sounds cannot overlap
   * using the built-in Audio.
   */
  ctAudio.AudioWrapper = function(path){
    this.path = path;
    this.initAudio();
  };

  ctAudio.AudioWrapper.prototype.initAudio = function() {
    this.audio = new Audio(this.path);
  };

  ctAudio.AudioWrapper.prototype.play = function(){
    this.audio.play();
    this.initAudio();
  };

  ctAudio.correctAudio = new ctAudio.AudioWrapper('/src/audio/correct.mp3');

  ctAudio.incorrectAudio = new ctAudio.AudioWrapper('/src/audio/incorrect.mp3');


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
