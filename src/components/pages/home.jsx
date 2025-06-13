import React from "react";
import { useReducer, useEffect } from "react";
import Images from '../assets/menuAsset.js';
import images from "../assets/menuAsset.js";

function reducer (state, action){
    let newCount;
    switch (action.type){
        case 'input': 
            return {...state, name: action.payload.value};
        case 'increase': {
            {state.count != 2? (
                newCount = state.count+1
            ):(
                newCount = 0
            )}
            return {...state, count: newCount};
        }
        case 'decrease': {
            {state.count != 0? (
                newCount = state.count-1
            ):(
                newCount = 2
            )}            return {...state, count: newCount};
        }
        default:
            return state;
    }
}

const pageWidth = window.innerWidth;
const pageHeight = window.innerHeight;

export default function Home({ onSubmit }){
    const [state, dispatch] = useReducer(reducer, {name: '', count: 0});

    const handleSubmit = (e) => {
        if (state.name === '')
            window.alert("Please fill out your name");
        else{
            onSubmit(state.name, state.count);
        }
    }

    useEffect(() => {
        console.log (state.name);
        const handleKeyUp = (e) => {
            if (e.key === 'Enter') {
            handleSubmit();
            }
        };

        window.addEventListener('keyup', handleKeyUp);

        return () => {
            window.removeEventListener('keyup', handleKeyUp);
        };
    }, [state]);

    return(
        <div 
            id='homePage'
            style={{
                backgroundImage: `url(${Images.bg.source})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
        >
            <img id= "logoImage" src={Images.logo.source} alt="" />
            <div id="characterPick">
                <img 
                    id="arrowButton"
                    src={Images.leftArrow.source} 
                    alt='previous' 
                    onClick = {()=>dispatch({type: 'increase'})} 
                />
                <img 
                    id="characterImage"
                    src={Images.characters.source[state.count]} 
                    alt="Character" 
                />
                <img 
                    id="arrowButton"
                    src={Images.rightArrow.source} 
                    alt='previous' 
                    onClick= {()=>dispatch({type: 'decrease'})} 
                />            
            </div>
        <input 
            id="nameInput"
            type="text" 
            value={state.name} 
            onChange={(e)=>dispatch({
            type: 'input', 
            payload: {value: e.target.value}
        })}
            placeholder = 'Enter your name...' 
        />
        <img 
            id="startButton"
            src={Images.startButton.source} 
            alt="Start" 
            onClick={handleSubmit}
        />
        </div>
    )
}