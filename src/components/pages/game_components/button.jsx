import React, { useEffect, useRef, useState } from "react";
import Icon from "../../assets/iconAsset.js";

const PRICES = [80, 150, 250, 200];
const FOOD_NAMES = ['Bread', 'Chicken', 'Steak', 'Energy drink'];
// Vertical bands (in % of the menu image) for each food row
const MENU_ROWS = [
    { top: 25, height: 13 },
    { top: 39, height: 15 },
    { top: 55, height: 15 },
    { top: 71, height: 16 },
];
const SNAKE_COST = 50;

export default function Buttons(prop){
    const [noMoney, setNoMoney] = useState(false);
    const noMoneyTimeout = useRef();

    useEffect(() => () => clearTimeout(noMoneyTimeout.current), []);

    const showNoMoney = () => {
        setNoMoney(true);
        clearTimeout(noMoneyTimeout.current);
        noMoneyTimeout.current = setTimeout(() => setNoMoney(false), 1800);
    }

    const canSleepNow = prop.info.time.hour >= 20 || prop.info.time.hour < 6;

    let buttonImage = null;
    if (prop.action == 'sleep') buttonImage = Icon.button.sleep;
    else if (prop.action == 'bath') buttonImage = Icon.button.bath;
    else if (prop.action == 'snake') buttonImage = Icon.button.play;

    const handleClick = ()=>{
        if (prop.action == 'bath')
            prop.update({type: 'takeBath'})
        else if (prop.action == 'snake'){
            if(prop.info.coin >= SNAKE_COST)
                prop.setIsSnakeActive(true);
            else
                showNoMoney();
        }
        else if (prop.action == 'sleep'){
            if(canSleepNow)
                prop.update({type: 'goSleep'})
        }
    }

    const handleBuy = (index) => {
        if (prop.info.coin >= PRICES[index])
            prop.buyItem(index);
        else
            showNoMoney();
    }

    // Keyboard shortcut: E / Enter triggers the current action
    useEffect(() => {
        if (!buttonImage) return;
        const onKey = (e) => {
            if (e.key === 'e' || e.key === 'E' || e.key === 'Enter') handleClick();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    });

    return (
        <>
            {(prop.action == 'sleep' && !canSleepNow) &&
                <img className="warning pixel" src={Icon.warning.sleep} alt="You can only sleep between 20:00 and 06:00" />
            }
            {prop.action == 'snake' && (
                <div className="info-card">
                    <img className="pixel" src={Icon.snake.info} alt="Snake: costs 50 coins, earn coins per apple" />
                </div>
            )}
            {prop.action == 'eat' && (
                <div className="info-card">
                    <img className="pixel" src={Icon.foodMenu} alt="Food menu" />
                    {MENU_ROWS.map((row, i) => (
                        <button
                            key={i}
                            type="button"
                            className={`menu-row ${prop.info.coin < PRICES[i] ? 'cant-afford' : ''}`}
                            style={{ top: `${row.top}%`, height: `${row.height}%` }}
                            aria-label={`Buy ${FOOD_NAMES[i]} for ${PRICES[i]} coins`}
                            title={`Buy ${FOOD_NAMES[i]} (${PRICES[i]})`}
                            onClick={() => handleBuy(i)}
                        />
                    ))}
                    <div className="menu-hint">Tap an item to buy</div>
                </div>
            )}
            {buttonImage && (
                <button
                    id="actionButton"
                    className="img-button"
                    onClick={handleClick}
                    aria-label={prop.action}
                    title="Press E"
                >
                    <img className="pixel" src={buttonImage} alt="" />
                </button>
            )}
            {noMoney && (
                <img className="warning pixel" src={Icon.warning.noMoney} alt="Not enough money" />
            )}
        </>
    )
}
