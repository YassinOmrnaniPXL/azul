/**
 * Audio Synthesizer for Azul Game
 * Generates synthetic audio when audio files are not available
 */

class AudioSynthesizer {
    constructor() {
        this.audioContext = null;
        this.masterGainNode = null;
    }

    async initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGainNode = this.audioContext.createGain();
            this.masterGainNode.connect(this.audioContext.destination);
        }
    }

    /**
     * Generate a basic sound with envelope
     */
    generateSound(params) {
        if (!this.audioContext) return null;

        const {
            type = 'sine',
            frequency,
            duration,
            attack = 0.01,
            decay = 0.1,
            sustain = 0.5,
            release = 0.2,
            volume = 0.5,
            frequencySlide = null
        } = params;

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

        if (frequencySlide) {
            oscillator.frequency.exponentialRampToValueAtTime(
                frequencySlide, 
                this.audioContext.currentTime + duration
            );
        }

        // ADSR envelope
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + attack);
        gainNode.gain.exponentialRampToValueAtTime(
            volume * sustain, 
            this.audioContext.currentTime + attack + decay
        );
        gainNode.gain.setValueAtTime(
            volume * sustain, 
            this.audioContext.currentTime + duration - release
        );
        gainNode.gain.exponentialRampToValueAtTime(
            0.001, 
            this.audioContext.currentTime + duration
        );

        oscillator.connect(gainNode);
        gainNode.connect(this.masterGainNode);

        const startTime = this.audioContext.currentTime;
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);

        return {
            start: () => {}, // Already started
            stop: () => oscillator.stop()
        };
    }

    /**
     * Generate a chord (multiple frequencies)
     */
    generateChord(frequencies, duration, volume = 0.5) {
        if (!this.audioContext) return null;

        const oscillators = frequencies.map(freq => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume / frequencies.length, this.audioContext.currentTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.masterGainNode);

            osc.start(this.audioContext.currentTime);
            osc.stop(this.audioContext.currentTime + duration);

            return osc;
        });

        return {
            start: () => {}, // Already started
            stop: () => oscillators.forEach(osc => osc.stop())
        };
    }

    /**
     * Set master volume
     */
    setVolume(volume) {
        if (this.masterGainNode) {
            this.masterGainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }

    /**
     * Get sound generators for specific game events
     */
    getSynthesizedSounds() {
        return {
            tileClick: () => this.generateSound({
                type: 'square', frequency: 800, duration: 0.1, volume: 0.3
            }),
            tilePlace: () => this.generateSound({
                type: 'triangle', frequency: 220, duration: 0.15, volume: 0.4
            }),
            tilePickup: () => this.generateSound({
                type: 'sine', frequency: 1200, duration: 0.08, volume: 0.25
            }),
            scoring: () => this.generateChord([440, 554, 659], 0.3, 0.4),
            lineComplete: () => this.generateChord([523, 659, 784], 0.5, 0.6),
            turnStart: () => this.generateSound({
                type: 'sine', frequency: 523, duration: 0.2, volume: 0.3
            }),
            buttonClick: () => this.generateSound({
                type: 'square', frequency: 1000, duration: 0.05, volume: 0.2
            }),
            errorSound: () => this.generateSound({
                type: 'sawtooth', frequency: 150, duration: 0.3, volume: 0.4, frequencySlide: 100
            }),
            notification: () => this.generateChord([800, 1000], 0.15, 0.3),
            victory: () => this.generateChord([523, 659, 784, 1047], 0.8, 0.6),
        };
    }
}

// Export the synthesizer
export { AudioSynthesizer }; 