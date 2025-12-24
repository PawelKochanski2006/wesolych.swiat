import { MusicPlayer } from './audio.js';
import { SceneManager } from './scene.js';

document.addEventListener('DOMContentLoaded', () => {
    // Initialize 3D Scene
    const container = document.getElementById('canvas-container');
    const sceneManager = new SceneManager(container);

    // Initialize Music Player
    const musicPlayer = new MusicPlayer();

    // UI Elements
    const openBtn = document.getElementById('open-wishes-btn');
    const closeBtn = document.getElementById('close-wishes-btn');
    const overlay = document.getElementById('wishes-overlay');
    const audioToggle = document.getElementById('audio-toggle');
    const volumeOnIcon = audioToggle.querySelector('.icon-volume-on');
    const volumeOffIcon = audioToggle.querySelector('.icon-volume-off');

    // UI Logic
    openBtn.addEventListener('click', openSequence);

    // GSAP Animation Timeline
    let tl = gsap.timeline({ paused: true });

    function initAnimation() {
        // Elements from new structure
        const overlay = document.querySelector('.overlay');
        const wrapper = document.querySelector('.envelope-wrapper');
        const flap = document.querySelector('.envelope-flap');
        const letter = document.querySelector('.letter');
        const letterInner = document.querySelector('.letter-inner');
        const pocket = document.querySelector('.envelope-pocket');
        const closeButton = document.querySelector('.close-btn');
        
        // Reset states
        gsap.set(overlay, { autoAlpha: 0 });
        gsap.set(wrapper, { scale: 0.5, opacity: 0 });
        gsap.set(flap, { rotateX: 0, zIndex: 40 }); 
        gsap.set(pocket, { zIndex: 30 });
        gsap.set(letter, { 
            y: 0, 
            opacity: 1, 
            scale: 1,
            zIndex: 20, 
            rotation: 0
        });
        gsap.set(letterInner, { opacity: 0 });
        gsap.set(closeButton, { autoAlpha: 0 });

        tl = gsap.timeline({ paused: true, onReverseComplete: () => {
             overlay.classList.add('hidden');
             // Reset styles for safety on re-open
             gsap.set(letter, { position: "absolute", top: "auto", bottom: 0, left: "15px",  xPercent: 0, yPercent: 0, width: "320px", height: "90%" });
             gsap.set(letterInner, { opacity: 0 });
        }});

        // 1. Show Envelope
        tl.to(overlay, { duration: 0.5, autoAlpha: 1 })
          .to(wrapper, { duration: 0.7, scale: 1, opacity: 1, ease: "back.out(1.2)" }, "-=0.2")
          
        // 2. Open Flap
          .to(flap, { duration: 0.5, rotateX: 180, ease: "power2.inOut" })
          .set(flap, { zIndex: 10 }) // Drop behind

        // 3. Slide Letter Up
          .to(letter, { 
              duration: 0.4, 
              y: -150, 
              ease: "power2.out" 
          })

        // 4. Bring Letter to Front & Fullscreen
          .set(letter, { zIndex: 100 })
          .to(letter, {
              duration: 1.0,
              position: "fixed",
              top: "50%",
              left: "50%",
              xPercent: -50,
              yPercent: -50,
              y: 0, 
              width: "90vw",
              maxWidth: "600px",
              height: "auto",
              minHeight: "50vh",
              maxHeight: "80vh",
              overflow: "auto", 
              scale: 1,
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
              ease: "expo.inOut"
          }, "+=0.1")
          
          // 5. Reveal Text & Close Button
          .to(letterInner, { duration: 1.0, opacity: 1 }, "-=0.3")
          .to(closeButton, { duration: 0.3, autoAlpha: 1 }, "<");
    }

    // Initialize logic
    initAnimation();

    function openSequence() {
        overlay.classList.remove('hidden');
        tl.timeScale(1).play();
        
        // Auto-play music if not already playing and user interaction happened
        if (!isAudioEnabled) {
             // User hasn't enabled audio yet, so we don't force it, or we rely on the toggle
        } else {
             if (!musicPlayer.isPlaying) musicPlayer.play();
        }
    }

    // Close on click outside or X button
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            closeSequence();
        }
    });

    closeBtn.addEventListener('click', closeSequence);

    function closeSequence() {
        tl.timeScale(1.5).reverse();
    }

    // Audio Logic
    let isAudioEnabled = false;

    audioToggle.addEventListener('click', () => {
        isAudioEnabled = !isAudioEnabled;
        updateAudioState();
    });

    function updateAudioState() {
        if (isAudioEnabled) {
            volumeOnIcon.classList.remove('hidden');
            volumeOffIcon.classList.add('hidden');
            musicPlayer.play();
        } else {
            volumeOnIcon.classList.add('hidden');
            volumeOffIcon.classList.remove('hidden');
            musicPlayer.pause();
        }
    }
});
