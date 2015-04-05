TODO: Store scores for each and every verb/tense/pronoun and display these.
TODO: Update Verb List view to shade background color of cells based on
      number of times answered correctly.
TODO: Save progress to localstorage.
TODO: Load initial app state from localstorage, if saved previously.
TODO: Add the verb "haber". One of the big three!


DONE: Fix verbs which have reflexive solutions to display the reflexive infinitive.
DONE: Rename StatisticsView and related to VerbsList.
DONE: Change opening screen - just a tense dropdown and a 'go' button.
DONE: Remove pronoun selection.
DONE: Ability to input spanish characters.
DONE: Add a 'finished' state with a results screen.
DONE: Plan for spaced repetition:
  - Each tense gets a queue of verb names
  - As a verb is completed, it is marked as correct or incorrect.
  - Correctly completed verbs go to the back of the queue, incorrect further
    to the front.
  - When picking the next verb for a task, always pick from the front of
    the queue.
