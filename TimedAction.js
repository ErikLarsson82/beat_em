(function() {

    class TimedAction {
        // Runs a function after a certain amount of time
        constructor(amount, funktion) {
            this.amount = amount;
            this.funktion = funktion
        }
        tick(delta = 1000/60) {
            this.amount -= delta;
            if (this.amount <= 0) {
                this.funktion();
            }
        }
    }

    if (typeof define !== 'undefined') {
        define('TimedAction', [], function() {
          return TimedAction;
        });
    } else {
        this.TimedAction = TimedAction;
    }

}.call(this))