import React from "react";
import { useReducer, useEffect, useState } from "react";
import Images from '../assets/menuAsset.js';

const CHAR_COUNT = Images.characters.source.length;

function reducer (state, action){
    switch (action.type){
        case 'input':
            return {...state, name: action.payload.value};
        case 'increase':
            return {...state, count: (state.count + 1) % CHAR_COUNT};
        case 'decrease':
            return {...state, count: (state.count - 1 + CHAR_COUNT) % CHAR_COUNT};
        default:
            return state;
    }
}

export default function Home({ onSubmit }){
    const [state, dispatch] = useReducer(reducer, {name: '', count: 0});
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [swapKey, setSwapKey] = useState(0);

    const handleSubmit = (e) => {
        e && e.preventDefault();
        const name = state.name.trim();
        if (name === '') {
            setError('Please fill out your name');
            setShake(false);
            requestAnimationFrame(() => setShake(true));
            return;
        }
        onSubmit(name, state.count);
    }

    const changeChar = (type) => {
        dispatch({type});
        setSwapKey(k => k + 1);
    }

    // Arrow keys cycle characters when the name field isn't focused
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.target.tagName === 'INPUT') return;
            if (e.key === 'ArrowLeft') changeChar('decrease');
            if (e.key === 'ArrowRight') changeChar('increase');
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    return(
        <div
            id='homePage'
            style={{ backgroundImage: `url(${Images.bg.source})` }}
        >
            <img id="logoImage" className="pixel" src={Images.logo.source} alt="Wemen" />
            <div id="characterPick">
                <button
                    type="button"
                    className="img-button arrowButton"
                    aria-label="Previous character"
                    onClick={() => changeChar('decrease')}
                >
                    <img className="pixel" src={Images.leftArrow.source} alt="" />
                </button>
                <img
                    key={swapKey}
                    id="characterImage"
                    className={`pixel ${swapKey ? 'swap' : ''}`}
                    src={Images.characters.source[state.count]}
                    alt={`Character ${state.count + 1}`}
                />
                <button
                    type="button"
                    className="img-button arrowButton"
                    aria-label="Next character"
                    onClick={() => changeChar('increase')}
                >
                    <img className="pixel" src={Images.rightArrow.source} alt="" />
                </button>
            </div>
            <div className="char-dots" aria-hidden="true">
                {Images.characters.source.map((_, i) => (
                    <span key={i} className={i === state.count ? 'active' : ''} />
                ))}
            </div>
            <form id="nameForm" onSubmit={handleSubmit} noValidate>
                <input
                    id="nameInput"
                    className={shake ? 'shake' : ''}
                    type="text"
                    maxLength={14}
                    autoComplete="off"
                    enterKeyHint="go"
                    aria-label="Your name"
                    aria-invalid={!!error}
                    value={state.name}
                    onChange={(e) => {
                        setError('');
                        dispatch({type: 'input', payload: {value: e.target.value}});
                    }}
                    onAnimationEnd={() => setShake(false)}
                    placeholder='Enter your name...'
                />
                <p className="form-error" role="alert">{error}</p>
                <button id="startButton" type="submit" className="img-button" aria-label="Start game">
                    <img className="pixel" src={Images.startButton.source} alt="" />
                </button>
            </form>
            <p className="hint">Use ← → to pick a character, Enter to start</p>
        </div>
    )
}
