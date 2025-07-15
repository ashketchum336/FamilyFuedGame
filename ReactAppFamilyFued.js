import React, { useState, useEffect, useCallback, useRef } from 'react';

// --- Tone.js Setup ---
// The script will now be loaded dynamically by the component itself.
// No need to edit index.html anymore.

// --- Sample Question Data ---
const questionsData = [
    {
        "question": "Name a reason you might be late for work.",
        "answers": [
            { "answer": "Traffic", "points": 35 },
            { "answer": "Overslept", "points": 25 },
            { "answer": "Car Trouble", "points": 15 },
            { "answer": "Kids", "points": 10 },
            { "answer": "Bad Weather", "points": 8 },
            { "answer": "Forgot Something", "points": 7 }
        ]
    },
    {
        "question": "Name something you find in a toolbox.",
        "answers": [
            { "answer": "Hammer", "points": 40 },
            { "answer": "Screwdriver", "points": 30 },
            { "answer": "Wrench", "points": 20 },
            { "answer": "Tape Measure", "points": 5 },
            { "answer": "Pliers", "points": 3 },
            { "answer": "Saw", "points": 2 }
        ]
    },
    {
        "question": "Name a popular pizza topping.",
        "answers": [
            { "answer": "Pepperoni", "points": 50 },
            { "answer": "Mushrooms", "points": 20 },
            { "answer": "Onions", "points": 12 },
            { "answer": "Sausage", "points": 8 },
            { "answer": "Bacon", "points": 6 },
            { "answer": "Extra Cheese", "points": 4 }
        ]
    },
    {
        "question": "Name a famous superhero.",
        "answers": [
            { "answer": "Superman", "points": 45 },
            { "answer": "Batman", "points": 30 },
            { "answer": "Spider-Man", "points": 15 },
            { "answer": "Wonder Woman", "points": 5 },
            { "answer": "Captain America", "points": 3 },
            { "answer": "Iron Man", "points": 2 }
        ]
    },
    {
        "question": "Name something you might see at a circus.",
        "answers": [
            { "answer": "Clowns", "points": 40 },
            { "answer": "Elephants", "points": 25 },
            { "answer": "Acrobats", "points": 15 },
            { "answer": "Lions/Tigers", "points": 10 },
            { "answer": "Trapeze Artists", "points": 5 },
            { "answer": "Popcorn", "points": 5 }
        ]
    },
    {
        "question": "Name a common household chore.",
        "answers": [
            { "answer": "Washing Dishes", "points": 30 },
            { "answer": "Laundry", "points": 25 },
            { "answer": "Vacuuming", "points": 20 },
            { "answer": "Taking out Trash", "points": 15 },
            { "answer": "Dusting", "points": 5 },
            { "answer": "Cleaning Bathroom", "points": 5 }
        ]
    },
    {
        "question": "Name a type of fruit.",
        "answers": [
            { "answer": "Apple", "points": 38 },
            { "answer": "Banana", "points": 27 },
            { "answer": "Orange", "points": 18 },
            { "answer": "Grapes", "points": 10 },
            { "answer": "Strawberry", "points": 5 },
            { "answer": "Watermelon", "points": 2 }
        ]
    },
    {
        "question": "Name something people do on a computer.",
        "answers": [
            { "answer": "Browse Internet", "points": 42 },
            { "answer": "Send Email", "points": 28 },
            { "answer": "Play Games", "points": 15 },
            { "answer": "Work", "points": 8 },
            { "answer": "Watch Videos", "points": 4 },
            { "answer": "Social Media", "points": 3 }
        ]
    }
];


// --- Main Application Component ---
export default function App() {
    // --- STATE MANAGEMENT ---
    const [screen, setScreen] = useState('start'); // 'start', 'board', or 'game'
    const [questions, setQuestions] = useState([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(null);

    // Game state
    const [revealedAnswers, setRevealedAnswers] = useState([]);
    const [strikes, setStrikes] = useState(0);
    const [showBigCross, setShowBigCross] = useState(false);

    // Question status tracking
    const [questionStatus, setQuestionStatus] = useState({});

    // --- SOUND EFFECTS SETUP ---
    const sounds = useRef(null);
    const [audioStatus, setAudioStatus] = useState('uninitialized'); // 'uninitialized', 'loading', 'ready', 'error'

    // --- Dynamic Script Loader and Audio Initializer ---
    const initializeAudio = () => {
        if (audioStatus !== 'uninitialized') return;

        setAudioStatus('loading');

        // Check if script is already on the page
        if (document.querySelector('script[src="https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js"]')) {
            if (window.Tone) {
                setupTone();
            }
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/tone/14.7.77/Tone.js';
        script.async = true;

        script.onload = () => {
            console.log("Tone.js script loaded successfully.");
            setupTone();
        };

        script.onerror = () => {
            console.error("Failed to load Tone.js script. Game will proceed without sound.");
            setAudioStatus('error');
            setScreen('board'); // Move to board even if sound fails
        };

        document.body.appendChild(script);
    };

    const setupTone = async () => {
        if (!window.Tone) {
            console.error("Tone.js loaded but window.Tone is not available.");
            setAudioStatus('error');
            setScreen('board');
            return;
        }
        try {
            await window.Tone.start();
            console.log("Audio context started.");

            // Reverted to the original synthesized sounds
            sounds.current = {
                reveal: new window.Tone.Synth({ oscillator: { type: 'sine' }, envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 1 } }).toDestination(),
                strike: new window.Tone.Synth({ oscillator: { type: 'fmsquare', modulationType: 'sawtooth', modulationIndex: 0.5 }, envelope: { attack: 0.05, decay: 0.2, sustain: 0, release: 0.1 } }).toDestination(),
                bigCross: new window.Tone.NoiseSynth({ noise: { type: 'pink' }, envelope: { attack: 0.01, decay: 0.3, sustain: 0, release: 0.1 } }).toDestination()
            };

            setAudioStatus('ready');
            setScreen('board');
        } catch (error) {
            console.error("Could not start audio context:", error);
            setAudioStatus('error');
            setScreen('board'); // Proceed without sound
        }
    };

    // --- DATA FETCHING ---
    useEffect(() => {
        setQuestions(questionsData);
        const initialStatus = {};
        questionsData.forEach((_, index) => {
            initialStatus[index] = 'unasked';
        });
        setQuestionStatus(initialStatus);
    }, []);

    // --- KEYBOARD CONTROLS ---
    const handleKeyDown = useCallback((event) => {
        if (screen !== 'game') return;

        const key = event.key;

        if (key >= '1' && key <= '6') {
            const answerIndex = parseInt(key) - 1;
            if (!revealedAnswers.includes(answerIndex)) {
                setRevealedAnswers(prev => [...prev, answerIndex].sort());
                if(audioStatus === 'ready') sounds.current?.reveal.triggerAttackRelease("C5", "0.2s");
            }
        }

        if (['7', '8', '9'].includes(key)) {
            const newStrikes = key === '7' ? 1 : key === '8' ? 2 : 3;
            if (strikes < newStrikes) {
                if(audioStatus === 'ready') sounds.current?.strike.triggerAttackRelease("G2", "0.3s");
            }
            setStrikes(newStrikes);
        }

        if (key === '0') {
            setShowBigCross(true);
            if(audioStatus === 'ready') sounds.current?.bigCross.triggerAttackRelease("0.4s");
            setTimeout(() => setShowBigCross(false), 4000);
        }

        if (event.keyCode === 8) { // Backspace
            setStrikes(0);
            setShowBigCross(false);
        }

    }, [screen, revealedAnswers, strikes, audioStatus]);

    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [handleKeyDown]);


    // --- GAME LOGIC ---
    const selectQuestion = (index) => {
        setCurrentQuestionIndex(index);
        setScreen('game');
        setRevealedAnswers([]);
        setStrikes(0);
        setShowBigCross(false);
        setQuestionStatus(prev => ({ ...prev, [index]: 'current' }));
    };

    const backToBoard = () => {
        if (currentQuestionIndex !== null) {
            setQuestionStatus(prev => ({ ...prev, [currentQuestionIndex]: 'asked' }));
        }
        setCurrentQuestionIndex(null);
        setScreen('board');
    };

    const currentQuestion = questions[currentQuestionIndex];

    // --- RENDER FUNCTIONS ---
    const renderStartScreen = () => (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 text-yellow-400" style={{fontFamily: "'Georgia', serif"}}>Family Feud</h1>
            <p className="text-xl mb-12 text-gray-300">Welcome!</p>
            <button
                onClick={initializeAudio}
                disabled={audioStatus === 'loading'}
                className="bg-green-500 hover:bg-green-400 text-white font-bold py-4 px-8 rounded-lg shadow-lg text-2xl transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-wait"
            >
                {audioStatus === 'loading' ? 'Loading Sounds...' : 'Start Game & Enable Sound'}
            </button>
        </div>
    );

    const renderQuestionBoard = () => (
        <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gray-900 text-white">
            <h1 className="text-5xl md:text-7xl font-bold mb-4 text-yellow-400" style={{fontFamily: "'Georgia', serif"}}>Family Feud</h1>
            <p className="text-xl mb-12 text-gray-300">Select a Question</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {questions.map((_, index) => {
                    const status = questionStatus[index];
                    let bgColor = 'bg-blue-600 hover:bg-blue-500';
                    let textColor = 'text-white';

                    if (status === 'current') {
                        bgColor = 'bg-yellow-400';
                        textColor = 'text-black';
                    } else if (status === 'asked') {
                        bgColor = 'bg-gray-700';
                        textColor = 'text-gray-500';
                    }

                    return (
                        <button
                            key={index}
                            disabled={status === 'asked'}
                            onClick={() => selectQuestion(index)}
                            className={`w-32 h-32 md:w-40 md:h-40 flex items-center justify-center text-5xl font-bold rounded-lg shadow-lg transition-all duration-300 transform hover:scale-105 ${bgColor} ${textColor} ${status === 'asked' ? 'cursor-not-allowed' : ''}`}
                        >
                            {index + 1}
                        </button>
                    );
                })}
            </div>
        </div>
    );

    const renderGameScreen = () => {
        if (!currentQuestion) return null;

        return (
            <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-8 bg-blue-900 text-white relative overflow-hidden">
                {showBigCross && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 transition-opacity duration-300">
                        <svg className="w-2/3 h-2/3 text-red-600 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                )}
                <div className="w-full flex justify-between items-center">
                    <button onClick={backToBoard} className="bg-yellow-400 text-black font-bold py-2 px-6 rounded-lg shadow-md hover:bg-yellow-300 transition-colors">
                        Board
                    </button>
                    <div className="flex space-x-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className={`w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center transition-all duration-300 ${strikes > i ? 'bg-red-600' : 'bg-gray-700'}`}>
                                {strikes > i && (
                                    <svg className="w-8 h-8 md:w-12 md:h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
                <div className="w-full max-w-4xl text-center my-6">
                    <h2 className="text-3xl md:text-5xl font-bold p-4 bg-black bg-opacity-30 rounded-lg">
                        {currentQuestion.question}
                    </h2>
                </div>
                <div className="w-full max-w-5xl flex-grow grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentQuestion.answers.map((item, index) => {
                        const isRevealed = revealedAnswers.includes(index);
                        return (
                            <div key={index} className="bg-blue-800 rounded-lg shadow-lg flex items-center justify-center p-4 transition-transform duration-500" style={{ transformStyle: 'preserve-3d', transform: isRevealed ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
                                <div className="absolute w-full h-full flex items-center justify-center" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                                    <div className="flex justify-between items-center w-full px-6">
                                        <span className="text-lg md:text-2xl font-semibold">{item.answer}</span>
                                        <span className="text-2xl md:text-4xl font-bold text-yellow-400">{item.points}</span>
                                    </div>
                                </div>
                                <div className="absolute w-full h-full flex items-center justify-center bg-blue-600 rounded-lg" style={{ backfaceVisibility: 'hidden' }}>
                                    <span className="text-4xl md:text-6xl font-bold text-yellow-400">{index + 1}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    // --- MAIN RENDER ---
    const renderContent = () => {
        switch(screen) {
            case 'start':
                return renderStartScreen();
            case 'board':
                return renderQuestionBoard();
            case 'game':
                return renderGameScreen();
            default:
                return renderStartScreen();
        }
    }

    return (
        <main className="w-screen h-screen bg-gray-900 font-sans">
            {renderContent()}
        </main>
    );
}
