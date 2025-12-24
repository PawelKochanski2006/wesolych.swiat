export class MusicPlayer {
    constructor() {
        this.audioContext = null;
        this.isPlaying = false;
        this.notes = [];
        this.tempo = 100; // Speed (bpm-ish)
        this.noteIndex = 0;
        this.schedulerTime = 0;
        this.timerID = null;
        this.gainNode = null;

        // Jingle Bells Melody
        // Note, Duration (0.25 = quarter, 0.5 = half, 1 = whole, etc. relative to beat)
        // E5: 659.25, G5: 783.99, C5: 523.25, D5: 587.33, F5: 698.46
        const E = 659.25;
        const G = 783.99;
        const C = 523.25;
        const D = 587.33;
        const F = 698.46;
        const A = 880.00; // Not used often in simple version but available
        const B = 987.77;

        this.melody = [
            // E E E
            { f: E, d: 0.25 }, { f: E, d: 0.25 }, { f: E, d: 0.5 },
            // E E E
            { f: E, d: 0.25 }, { f: E, d: 0.25 }, { f: E, d: 0.5 },
            // E G C D E
            { f: E, d: 0.25 }, { f: G, d: 0.25 }, { f: C, d: 0.25 }, { f: D, d: 0.25 }, { f: E, d: 1.0 },
            
            // F F F F
            { f: F, d: 0.25 }, { f: F, d: 0.25 }, { f: F, d: 0.25 }, { f: F, d: 0.25 },
            // F E E E E
            { f: F, d: 0.25 }, { f: E, d: 0.25 }, { f: E, d: 0.25 }, { f: E, d: 0.125 }, { f: E, d: 0.125 },
            // E D D E D G
            { f: E, d: 0.25 }, { f: D, d: 0.25 }, { f: D, d: 0.25 }, { f: E, d: 0.25 }, { f: D, d: 0.5 }, { f: G, d: 0.5 }
        ];
    }
    

    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.value = 0.1; // Low volume initially
            this.gainNode.connect(this.audioContext.destination);
        }
    }

    play() {
        this.init();
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.noteIndex = 0;
            this.schedulerTime = this.audioContext.currentTime;
            this.schedule();
        }
    }

    schedule() {
        while (this.schedulerTime < this.audioContext.currentTime + 0.1) {
            this.playNote(this.melody[this.noteIndex]);
            this.schedulerTime += this.melody[this.noteIndex].d * (60 / this.tempo) * 2; // Adjust math for seconds
            this.noteIndex = (this.noteIndex + 1) % this.melody.length;
        }
        
        if (this.isPlaying) {
            this.timerID = setTimeout(this.schedule.bind(this), 25);
        }
    }

    playNote(note) {
        const osc = this.audioContext.createOscillator();
        const envelope = this.audioContext.createGain();

        osc.type = 'triangle'; // Bell-like-ish
        osc.frequency.setValueAtTime(note.f, this.schedulerTime);

        envelope.gain.setValueAtTime(0, this.schedulerTime);
        envelope.gain.linearRampToValueAtTime(0.1, this.schedulerTime + 0.05);
        envelope.gain.exponentialRampToValueAtTime(0.001, this.schedulerTime + note.d * (60/this.tempo) * 1.5);

        osc.connect(envelope);
        envelope.connect(this.gainNode);

        osc.start(this.schedulerTime);
        osc.stop(this.schedulerTime + note.d * (60/this.tempo) * 2);
    }

    pause() {
        this.isPlaying = false;
        if (this.timerID) clearTimeout(this.timerID);
        if (this.audioContext) this.audioContext.suspend();
    }

    toggle() {
        if (this.isPlaying) this.pause();
        else this.play();
        return this.isPlaying;
    }
}
