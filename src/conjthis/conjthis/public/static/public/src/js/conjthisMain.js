define([
    'React',
    'Bacon',
    'Immutable',
    'conjthisVerbs'
], function(React, Bacon, Immutable, conjthisVerbs) {

  'use strict';

  var ct, d, PRONOUNS, TENSES;

  ct = {};
  d = React.DOM;

  // Maps pronoun -> index used in the verbs data
  PRONOUNS = [
    ['yo', 0],
    ['tú', 1],
    ['él/ella/Ud.', 2],
    ['nosotros', 3],
    ['vosotros', 4],
    ['ellos/ellas/Uds.', 5]
  ];

  // Maps tense -> key used in the verbs data
  TENSES = [
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
  ];

  ct.verbs = Immutable.fromJS(conjthisVerbs);

  ct.choose = function(arr){
    return arr.get(Math.round(Math.random() * (arr.length - 1)));
  };

  ct.createTask = function(verb, appState){
    var tense, tenseId, tenseName, pronoun, pronounText, pronounIdx, conjugations, conjugation, regularFlag, solution;

    tense = ct.randomEntry(TENSES);
    tenseName = tense[0];
    tenseId = tense[1];

    pronoun = ct.randomEntry(PRONOUNS);
    pronounText = pronoun[0];
    pronounIdx = pronoun[1];

    conjugation = verb.getIn(['conjugations', tenseId, pronounIdx]);
    regularFlag = conjugation.get(0);
    solution = conjugation.get(1);

    return new ct.Task({
      display: verb.get('spanish') + ' (' + verb.get('english') + ') ' + tenseName,
      prompt: pronounText,
      regularFlag: regularFlag,
      solution: solution
    });
  };

  ct.nextTask = function(appState){
    return ct.createTask(ct.choose(ct.verbs), appState);
  };

  ct.randomEntry = function(arr){
    return arr[Math.round(Math.random() * (arr.length - 1))];
  };

  ct.ConjugatorTextInput = React.createClass({
    displayName: 'ConjugatorTextInput',
    SHIFT: 16,
    ALT: 18,

    LEFT: 37,
    UP: 38,
    RIGHT: 39,
    DOWN: 40,

    ACCENT_CYCLES: {
      'a': ['a', 'á'],
      'e': ['e', 'é'],
      'i': ['i', 'í'],
      'o': ['o', 'ó'],
      'u': ['u', 'ú', 'ü'],
      'n': ['n', 'ñ']
    },

    reverseMap: null,

    getInitialState: function(){
      return {
        modifierIndex: 0,
        value: '',
        restoreCursor: null
      }
    },

    render: function(){
      return d.input({
        className: 'form-control input-lg',
        type: 'text',
        onKeyDown: this.onKeyDown,
        onChange: this.onChange,
        value: this.props.as.get('answer')
      });
    },

    onKeyDown: function(e){
      var answer, char, unaccented, accented, index, isUpper, domNode, selectionStart;
      domNode = this.getDOMNode();
      selectionStart = domNode.selectionStart;
      answer = this.props.as.get('answer');

      if( (e.keyCode == this.UP) || (e.keyCode == this.DOWN) ){
        index = e.keyCode == this.UP ? this.state.modifierIndex + 1 : this.state.modifierIndex - 1;
        char = answer.length > 0 ? answer.charAt(selectionStart - 1) : '';
        isUpper = char.toUpperCase() == char;
        unaccented = this.getUnaccented(char.toLowerCase());
        accented = this.getAccented(unaccented, index);
        accented = isUpper ? accented.toUpperCase() : accented;
        answer = answer.slice(0, selectionStart -1) + accented + answer.slice(selectionStart, answer.length);
        this.setAnswer(answer);
        this.setState({modifierIndex: index, restoreCursor: selectionStart});
      } else {
        this.setState({modifierIndex: 0, restoreCursor: null});
      }
    },

    componentDidUpdate: function(){
      var domNode = this.getDOMNode();
      if(this.state.restoreCursor !== null){
        domNode.selectionStart = this.state.restoreCursor;
        domNode.selectionEnd = this.state.restoreCursor;
      }
    },

    getReverseMap: function(){
      var k, i, reverseMap;
      if(this.reverseMap === null){
        reverseMap = {};
        for(k in this.ACCENT_CYCLES){
          if(this.ACCENT_CYCLES.hasOwnProperty(k)){
            for(i=0; i< this.ACCENT_CYCLES[k].length; i+=1){
              reverseMap[this.ACCENT_CYCLES[k][i]] = k;
            }
          }
        }
        this.reverseMap = reverseMap;
      }
      return this.reverseMap;
    },

    getUnaccented: function(char){
      var reverseMap = this.getReverseMap();
      if(reverseMap[char] !== undefined){
        return reverseMap[char]
      } else {
        return char;
      }
    },

    getAccented: function(char, index){
      var isUpper = char.toUpperCase() === char,
          lower = char.toLowerCase(),
          ret;

      if(this.ACCENT_CYCLES[lower] !== undefined){
        ret = this.ACCENT_CYCLES[lower][Math.abs(index % this.ACCENT_CYCLES[lower].length)];
        if(isUpper){
          ret = ret.toUpperCase();
        }
        return ret;
      } else {
        return char;
      }
    },

    onChange: function(e){
      this.setAnswer(e.target.value);
    },

    setAnswer: function(answer){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'setAnswer',
            value: answer
          },
          bubbles: true,
          cancelable: false
        })
      );
    }
  });

  ct.ExerciseForm = React.createClass({

    displayName: 'ExerciseForm',

    getInitialState: function(){
      return {
        shiftKey: false
      }
    },

    render: function(){
      var statusMessage,
          stateName,
          isIrregular,
          display,
          task,
          prompt;

      task = this.props.as.get('task');
      stateName = this.props.as.get('stateName');

      if(task === null){
        isIrregular = false;
        display = '';
        prompt = '';

      } else {
        isIrregular = this.props.as.getIn(['task', 'regularFlag']) === 'i';
        display = this.props.as.getIn(['task', 'display']);
        prompt = this.props.as.getIn(['task', 'prompt']);
      }


      if(stateName === 'solveTask'){
        statusMessage = d.div(
          {className: 'alert alert-info'},
          'Type your answer')

      } else if(stateName === 'taskCorrect'){
        statusMessage = d.div(
          {className: 'alert alert-success'},
          'That\'s right!')

      } else if(stateName === 'taskIncorrect'){
        statusMessage = d.div(
          {className: 'alert alert-danger'},
          'The right answer is "' + this.props.as.getIn(['task', 'solution']) + '"')

      } else {
        statusMessage = d.div({}, '');
      }


      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading', style: {textAlign: 'right'}},
          d.span({}, 'Total ', d.span({className: 'badge'}, this.props.as.get('correct') + ' / ' + this.props.as.get('attempted'))),
          d.span({}, ' Streak ', d.span({className: 'badge'}, this.props.as.get('streak')))
        ),
        d.div({className: 'panel-body'},
          d.h2({style: {margin: '0.75em 0'}}, display),
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},
            d.div({className: 'form-group' + (isIrregular ? ' has-warning has-feedback' : '')},
              d.div({className: 'input-group'},
                d.span({className: 'input-group-addon'},
                  d.span({style: {display: 'inline-block', width: '90px'}}, prompt)
                ),
                ct.ConjugatorTextInput({key: 'conjugatorTextInput', ref: 'conjugatorTextInput', as: this.props.as}),
                d.span({className: 'glyphicon glyphicon-warning-sign form-control-feedback', style: {visibility: isIrregular ? 'visible': 'hidden'}})
              )
            )
          ),
          statusMessage
        )
      )
    },

    componentDidMount: function(){
      this.focusTextInput();
    },

    focusTextInput: function(){
      // TODO: Looks like a React bug
      setTimeout(function(){
        this.refs.conjugatorTextInput.getDOMNode().focus();
      }.bind(this), 40);
    },

    onSubmit: function(e){
      e.preventDefault();
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: this.props.as.get('stateName') === 'solveTask' ? 'submit' : 'next'
          },
          bubbles: true,
          cancelable: false
        })
      );
    },

    onKeyDown: function(e){
      var shiftKey = e.keyCode === this.SHIFT;
      if(shiftKey){
        this.setState({shiftKey: true});
      }
    },

    onKeyUp: function(e){
      if(e.keyCode === this.SHIFT){
        this.setState({shiftKey: false});
      }
    }
  });

  ct.SettingsForm = React.createClass({

    displayName: 'SettingsForm',

    render: function(){
      var tenseCheckboxes, pronounCheckboxes;

      tenseCheckboxes = TENSES.map(function(arr){
        var tense = arr[0];

        return d.div({className: 'checkbox', key: tense},
          d.label({},
            d.input({
              type: 'checkbox',
              ref: tense,
              checked: this.props.as.getIn(['tenses', tense]),
              onChange: function(e){this.onTenseChange(e, tense)}.bind(this)
            }),
            d.span({style: {verticalAlign: 'top'}}, tense)
          )
        )
      }, this);

      pronounCheckboxes = PRONOUNS.map(function(arr){
        var pronoun = arr[0];

        return d.div({className: 'checkbox', key: pronoun},
          d.label({},
            d.input({
              type: 'checkbox',
              ref: pronoun,
              checked: this.props.as.getIn(['pronouns', pronoun]),
              onChange: function(e){this.onPronounChange(e, pronoun)}.bind(this)
            }),
            d.span({style: {verticalAlign: 'top'}}, pronoun)
          )
        )
      }, this);

      return d.div({className: 'panel panel-default'},
        d.div({className: 'panel-heading'}, 'Settings Form'),
        d.div({className: 'panel-body'},
          d.form({className: 'form-horizontal', role: 'form', style: {margin: '15px'}, onSubmit: this.onSubmit},

            d.h2({}, 'Tenses'),
            d.div({className: 'form-group'},
              d.div({className: 'input-group'},
                tenseCheckboxes
              )
            ),

            d.h2({}, 'Pronouns'),
            d.div({className: 'form-group'},
              d.div({className: 'input-group'},
                pronounCheckboxes
              )
            ),

            d.button({type: 'submit', className: 'btn btn-primary', onSubmit: this.onSubmit}, 'Start exercise')
          )
        )
      );
    },

    onTenseChange: function(e, tense){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'updateTenses',
            key: tense,
            value: e.target.checked
          },
          bubbles: true,
          cancelable: false
        })
      );
    },

    onPronounChange: function(e, pronoun){
      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'updatePronouns',
            key: pronoun,
            value: e.target.checked
          },
          bubbles: true,
          cancelable: false
        })
      );
    },

    /**
     * On submit, start the exercise.
     * @param e
     */
    onSubmit: function(e){
      e.preventDefault();

      this.getDOMNode().dispatchEvent(
        new CustomEvent('command', {
          detail: {
            type: 'startExercise'
          },
          bubbles: true,
          cancelable: false
        })
      );
    }
  });


  ct.ConjugatorMain = React.createClass({
    displayName: 'ConjugatorMain',
    render: function(){
      return d.div({},
        d.div({className: 'navbar navbar-default navbar-static-top', role: 'nav'},
          d.div({className: 'container'},
            d.span({className: 'navbar-brand'}, 'Conjugate this')
          )
        ),
        d.div({className: 'container'},
          ct.SettingsForm({as: this.props.as}),
          ct.ExerciseForm({as: this.props.as})
        )
      )
    }
  });



  /**
   * A translation/conjugation task.
   * @type {*}
   */
  ct.Task = Immutable.Record({
    display: '',
    prompt: '',
    solution: '',
    regularFlag: ''
  });

  /**
   * The entire AppState is a single, immutable record.
   * @type {*}
   */
  ct.AppState = Immutable.Record({
    stateName: '',
    task: null,
    correct: 0,
    attempted: 0,
    streak: 0,
    answer: '',
    pronouns: {},
    tenses: {}
  });

  /**
   * The main logic of the app. Takes an old app state and returns a new one
   * based on the input of some kind of application message.
   *
   * Keep this a pure function.
   *
   * @param appState
   * @param message
   * @param nextTask
   * @returns {*}
   */
  ct.nextState = function(appState, message, nextTask){
    var isCorrect, obj, initialPronouns, initialTenses;

    if(!appState){

      initialPronouns = {};
      PRONOUNS.forEach(function(p){
        initialPronouns[p[0]] = true;
      }, this);
      initialPronouns = Immutable.fromJS(initialPronouns);

      initialTenses = {};
      TENSES.forEach(function(t){
        initialTenses[t[0]] = true;
      }, this);
      initialTenses = Immutable.fromJS(initialTenses);

      return new ct.AppState({
        task: null,
        stateName: 'configureExercise',
        pronouns: initialPronouns,
        tenses: initialTenses
      });
    }

    if(appState.stateName === 'configureExercise'){
      if(message.type === 'updateTenses'){
        obj = {tenses: {}};
        obj.tenses[message.key] = message.value;
        return appState.mergeDeep(obj);
      }
      if(message.type === 'updatePronouns'){
        obj = {pronouns: {}};
        obj.pronouns[message.key] = message.value;
        return appState.mergeDeep(obj);
      }
      if(message.type === 'startExercise'){
        return appState.mergeDeep({
          stateName: 'solveTask',
          task: nextTask(appState),
          answer: ''
        });
      }
    }

    if(appState.stateName === 'solveTask'){
      if(message.type === 'submit'){
        isCorrect = appState.answer === appState.task.solution;
        return appState.mergeDeep({
          stateName: isCorrect ? 'taskCorrect' : 'taskIncorrect',
          correct: isCorrect ? appState.correct + 1 : appState.correct,
          attempted: appState.attempted + 1,
          streak: isCorrect ? appState.streak + 1 : 0
        });
      }

      else if(message.type === 'setAnswer'){
        return appState.mergeDeep({
          answer: message.value
        });
      }
    }

    if(['solveTask', 'taskCorrect', 'taskIncorrect'].indexOf(appState.stateName) >= 0){
      if(message.type === 'next'){
        return appState.mergeDeep({
          stateName: 'solveTask',
          task: nextTask(appState),
          answer: ''
        })
      }
    }

    else {
      throw new Error('Unhandled message type: "' + message.type + '"');
    }
  };

  /**
   * Constructor for the app, bundles up those bits which are unavoidably
   * stateful.
   *
   * @constructor
   */
  ct.ConjugateThis = function(){
    this.el = document.createElement('div');
    this.appState = ct.nextState(null, null, ct.nextTask);

    this.component = React.renderComponent(
        ct.ConjugatorMain({as: this.appState}), this.el);
    this.bus = new Bacon.Bus();

    this.commandStream = Bacon.fromEventTarget(this.el, "command", function(event){
      return event.detail
    });

    this.bus.plug(this.commandStream);
    this.bus.onValue(
      function(message){
        this.appState = ct.nextState(this.appState, message, ct.nextTask);
        this.component.setProps({as: this.appState});
      }.bind(this)
    );
  };

  ct.init = function(){
    var app = new ct.ConjugateThis();
    document.body.appendChild(app.el);
  };

  return ct;
});
