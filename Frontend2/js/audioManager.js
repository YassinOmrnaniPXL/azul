/**
 * Enhanced AudioManager for Azul Game
 * Audio system with sound effects and real music tracks
 */

class AudioManager {
    constructor() {
        this.isInitialized = false;
        this.audioContext = null;
        this.masterVolume = 0.7;
        this.sfxVolume = 0.8;
        this.musicVolume = 0.3;
        this.isSfxEnabled = true;
        this.isMusicEnabled = true;
        this.currentMusic = null;
        this.currentTrack = null;
        
        // Available music tracks
        this.musicTracks = {
            'ambient': {
                name: 'Dark Ambient',
                file: 'audio/music/dark-ambient-music-312290.mp3',
                description: 'Atmospheric and moody'
            },
            'retro': {
                name: 'Retro Arcade',
                file: 'audio/music/retro-game-arcade-236133.mp3',
                description: 'Classic gaming vibes'
            },
            'hey': {
                name: 'Hey (Chiptune)',
                file: 'audio/music/kim-lightyear-hey-233400.mp3',
                description: 'Upbeat electronic'
            },
            'angel': {
                name: 'Angel Eyes',
                file: 'audio/music/kim-lightyear-angel-eyes-chiptune-edit-110226.mp3',
                description: 'Melodic chiptune'
            }
        };
        
        // Load settings from localStorage
        this.loadSettings();
    }
    
    /**
     * Initialize the audio system
     */
    async initialize() {
        if (this.isInitialized) return;
        
        try {
            // Create audio context for better control
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            console.log('🎵 AudioManager: Audio system initialized successfully');
            this.isInitialized = true;
            
            // Set up UI controls
            this.setupAudioControls();
            
        } catch (error) {
            console.warn('🎵 AudioManager: Failed to initialize audio system:', error);
        }
    }
    
    /**
     * Play a sound effect (synthesized)
     */
    playSfx(soundId, volumeMultiplier = 1.0) {
        if (!this.isSfxEnabled || !this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            // Different frequencies for different sounds
            const soundFreqs = {
                buttonClick: 800,
                tileClick: 600,
                tilePlace: 400,
                notification: 1000,
                error: 200,
                messageReceived: 900,
                messageSent: 700,
                playerJoin: 1200,
                playerLeave: 300
            };
            
            const freq = soundFreqs[soundId] || 500;
            oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            oscillator.type = 'square';
            
            const volume = 0.1 * this.sfxVolume * this.masterVolume * volumeMultiplier;
            gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + 0.1);
            
        } catch (error) {
            console.warn(`🎵 Error playing sound: ${soundId}`, error);
        }
    }
    
    /**
     * Play music track
     */
    async playMusic(trackId, fadeIn = true) {
        if (!this.isMusicEnabled || !this.audioContext) return;
        
        const track = this.musicTracks[trackId];
        if (!track) {
            console.warn(`🎵 Unknown track: ${trackId}`);
            return;
        }
        
        // Stop current music
        this.stopMusic(false);
        
        try {
            console.log(`🎵 Loading music track: ${track.name}`);
            
            // Create audio element
            this.currentMusic = new Audio(track.file);
            this.currentMusic.loop = true;
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
            this.currentTrack = trackId;
            
            // Handle loading and errors
            this.currentMusic.addEventListener('canplaythrough', () => {
                console.log(`🎵 Music loaded successfully: ${track.name}`);
            });
            
            this.currentMusic.addEventListener('error', (e) => {
                console.error(`🎵 Error loading music: ${track.name}`, e);
            });
            
            // Start playing
            await this.currentMusic.play();
            console.log(`🎵 Now playing: ${track.name}`);
            
            // Update UI
            this.updateMusicUI();
            
        } catch (error) {
            console.error(`🎵 Error playing music: ${track.name}`, error);
        }
    }
    
    /**
     * Stop music
     */
    async stopMusic(fadeOut = true) {
        if (this.currentMusic) {
            if (fadeOut) {
                // Fade out over 1 second
                const fadeInterval = setInterval(() => {
                    if (this.currentMusic.volume > 0.1) {
                        this.currentMusic.volume -= 0.1;
                    } else {
                        this.currentMusic.pause();
                        this.currentMusic = null;
                        this.currentTrack = null;
                        this.updateMusicUI();
                        clearInterval(fadeInterval);
                    }
                }, 100);
            } else {
                this.currentMusic.pause();
                this.currentMusic = null;
                this.currentTrack = null;
                this.updateMusicUI();
            }
        }
    }
    
    /**
     * Set music volume
     */
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        if (this.currentMusic) {
            this.currentMusic.volume = this.musicVolume * this.masterVolume;
        }
        this.saveSettings();
    }
    
    /**
     * Update music UI display
     */
    updateMusicUI() {
        const nowPlayingElement = document.getElementById('now-playing');
        const musicSelect = document.getElementById('music-track-select');
        
        if (nowPlayingElement) {
            if (this.currentTrack) {
                const track = this.musicTracks[this.currentTrack];
                nowPlayingElement.textContent = `♪ ${track.name}`;
                nowPlayingElement.className = 'text-sm text-green-600 font-medium';
            } else {
                nowPlayingElement.textContent = 'No music playing';
                nowPlayingElement.className = 'text-sm text-gray-500';
            }
        }
        
        if (musicSelect) {
            musicSelect.value = this.currentTrack || '';
        }
    }
    
    /**
     * Set up audio control UI
     */
    setupAudioControls() {
        // Check if controls already exist
        if (document.getElementById('audio-controls-container')) return;
        
        // Generate music track options
        const trackOptions = Object.entries(this.musicTracks).map(([id, track]) => 
            `<option value="${id}">${track.name} - ${track.description}</option>`
        ).join('');
        
        const controlsHTML = `
            <div id="audio-controls-container" class="fixed top-4 left-4 z-50">
                <button id="audio-settings-toggle" class="bg-azulBlue text-white p-2 rounded-full shadow-lg hover:bg-opacity-90 transition-colors duration-200" title="Audio Settings">
                    🎵
                </button>
                
                <div id="audio-settings-panel" class="hidden absolute top-12 left-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-96">
                    <h3 class="text-lg font-bold text-azulBlue mb-3">Audio Settings</h3>
                    
                    <!-- Sound Effects -->
                    <div class="mb-4">
                        <label class="flex items-center justify-between">
                            <span class="text-sm font-medium">Sound Effects</span>
                            <input type="checkbox" id="sfx-enabled" ${this.isSfxEnabled ? 'checked' : ''} class="mr-2">
                        </label>
                    </div>
                    
                    <!-- Background Music -->
                    <div class="mb-4">
                        <label class="flex items-center justify-between">
                            <span class="text-sm font-medium">Background Music</span>
                            <input type="checkbox" id="music-enabled" ${this.isMusicEnabled ? 'checked' : ''} class="mr-2">
                        </label>
                    </div>
                    
                    <!-- Music Volume -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Music Volume</label>
                        <input type="range" id="music-volume" min="0" max="100" value="${this.musicVolume * 100}" 
                               class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer">
                    </div>
                    
                    <!-- Music Track Selection -->
                    <div class="mb-4">
                        <label class="block text-sm font-medium mb-2">Music Track</label>
                        <select id="music-track-select" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azulBlue">
                            <option value="">No music</option>
                            ${trackOptions}
                        </select>
                        <div id="now-playing" class="mt-1 text-sm text-gray-500">No music playing</div>
                    </div>
                    
                    <!-- Test Buttons -->
                    <div class="mb-4 pt-3 border-t border-gray-200">
                        <p class="text-sm font-medium mb-2">Test Audio:</p>
                        <div class="flex space-x-2">
                            <button id="test-sfx-btn" class="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 transition-colors">
                                Test SFX
                            </button>
                            <button id="stop-music-btn" class="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors">
                                Stop Music
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', controlsHTML);
        this.bindAudioControlEvents();
        this.updateMusicUI();
    }
    
    /**
     * Bind events for audio controls
     */
    bindAudioControlEvents() {
        // Toggle panel
        const toggleBtn = document.getElementById('audio-settings-toggle');
        const panel = document.getElementById('audio-settings-panel');
        
        toggleBtn?.addEventListener('click', () => {
            panel.classList.toggle('hidden');
            this.playSfx('buttonClick', 0.5);
        });
        
        // Close panel when clicking outside
        document.addEventListener('click', (e) => {
            if (!toggleBtn?.contains(e.target) && !panel?.contains(e.target)) {
                panel?.classList.add('hidden');
            }
        });
        
        // SFX controls
        const sfxEnabled = document.getElementById('sfx-enabled');
        sfxEnabled?.addEventListener('change', (e) => {
            this.isSfxEnabled = e.target.checked;
            this.saveSettings();
            if (e.target.checked) this.playSfx('buttonClick', 0.5);
        });
        
        // Music controls
        const musicEnabled = document.getElementById('music-enabled');
        musicEnabled?.addEventListener('change', (e) => {
            this.isMusicEnabled = e.target.checked;
            if (!e.target.checked) {
                this.stopMusic(true);
            }
            this.saveSettings();
        });
        
        // Music volume
        const musicVolume = document.getElementById('music-volume');
        musicVolume?.addEventListener('input', (e) => {
            this.setMusicVolume(e.target.value / 100);
        });
        
        // Music track selection
        const musicSelect = document.getElementById('music-track-select');
        musicSelect?.addEventListener('change', (e) => {
            if (e.target.value) {
                this.playMusic(e.target.value);
            } else {
                this.stopMusic(true);
            }
        });
        
        // Test buttons
        document.getElementById('test-sfx-btn')?.addEventListener('click', () => {
            this.playSfx('buttonClick');
        });
        
        document.getElementById('stop-music-btn')?.addEventListener('click', () => {
            this.stopMusic(true);
        });
    }
    
    /**
     * Save settings to localStorage
     */
    saveSettings() {
        const settings = {
            isSfxEnabled: this.isSfxEnabled,
            isMusicEnabled: this.isMusicEnabled,
            musicVolume: this.musicVolume,
            currentTrack: this.currentTrack
        };
        localStorage.setItem('azulAudioSettings', JSON.stringify(settings));
    }
    
    /**
     * Load settings from localStorage
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('azulAudioSettings') || '{}');
            this.isSfxEnabled = settings.isSfxEnabled ?? true;
            this.isMusicEnabled = settings.isMusicEnabled ?? true;
            this.musicVolume = settings.musicVolume ?? 0.3;
            
            // Auto-play last track if music was enabled
            if (this.isMusicEnabled && settings.currentTrack) {
                setTimeout(() => {
                    this.playMusic(settings.currentTrack);
                }, 1000);
            }
        } catch (error) {
            console.warn('🎵 Failed to load audio settings from localStorage:', error);
        }
    }
}

// Create and export single instance
const audioManager = new AudioManager();

// Auto-initialize on user interaction
const initializeOnInteraction = () => {
    audioManager.initialize();
    document.removeEventListener('click', initializeOnInteraction);
    document.removeEventListener('keydown', initializeOnInteraction);
};

document.addEventListener('click', initializeOnInteraction);
document.addEventListener('keydown', initializeOnInteraction);

// Export for use throughout the application
export { audioManager };

// Convenient functions for common use
export const playSfx = (soundId, volumeMultiplier) => audioManager.playSfx(soundId, volumeMultiplier);
export const playMusic = (trackId, fadeIn) => audioManager.playMusic(trackId, fadeIn);
export const stopMusic = (fadeOut) => audioManager.stopMusic(fadeOut);
export const isAudioEnabled = () => audioManager.isSfxEnabled || audioManager.isMusicEnabled;