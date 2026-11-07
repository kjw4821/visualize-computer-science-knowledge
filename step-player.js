'use strict';
// advance returns true while another step remains; the first step is shown immediately by the caller.
class StepPlayer {
  constructor() { this.timer = null; this.generation = 0; }
  stop() {
    this.generation++;
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
  play(advance) {
    this.stop();
    const generation = this.generation;
    const tick = () => {
      if (generation !== this.generation) return;
      this.timer = null;
      if (advance()) this.timer = setTimeout(tick, 2000);
    };
    this.timer = setTimeout(tick, 2000);
  }
}
if (typeof module !== 'undefined') module.exports = StepPlayer;
