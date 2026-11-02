import React from "react";
import { useEffect, useRef, useState } from "react";
import Icon from "../../assets/iconAsset.js";

const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const greeting = ['Morning', 'Afternoon', 'Evening', 'Night'];

export default function Info (props){
  const prevCoin = useRef(props.coin);
  const [bump, setBump] = useState(false);
  const [delta, setDelta] = useState(0);

  // Game clock: stops on game over and while a mini game is open
  useEffect(()=>{
    if (props.gameOver || props.paused) return;
    const timeInterval = setInterval(() => {
      props.update({ type: 'updateTime' });
    }, 1000);
    return () => clearInterval(timeInterval);
  }, [props.gameOver, props.paused]);

  // Flash the coin chip with the change amount
  useEffect(()=>{
    const diff = props.coin - prevCoin.current;
    prevCoin.current = props.coin;
    if (diff === 0) return;
    setDelta(diff);
    setBump(false);
    requestAnimationFrame(() => setBump(true));
    const t = setTimeout(() => setDelta(0), 1400);
    return () => clearTimeout(t);
  }, [props.coin]);

  const formattedHour = props.time.hour.toString().padStart(2, '0');
  const formattedMinute = props.time.minute.toString().padStart(2, '0');

  return (
    <div className="hud-top-left">
      <div id="infoSign" className="pixel" style={{ backgroundImage: `url(${Icon.sign})` }}>
        <p>Good {greeting[props.time.greet]}, {props.data}</p>
        <p>Day {props.time.day} | {days[(props.time.day - 1) % 7]}</p>
        <p className="clock">{formattedHour}:{formattedMinute}</p>
      </div>
      <div className="hud-row">
        <div
          id="coinDisplay"
          className={`chip ${bump ? 'bump' : ''}`}
          onAnimationEnd={() => setBump(false)}
          aria-label={`${props.coin} coins`}
        >
          <img className="pixel" src={Icon.coin} alt="" />
          <span>{props.coin}</span>
          {delta !== 0 && (
            <span className="delta" style={{ color: delta > 0 ? '#2e6b1f' : '#8a1c1c' }}>
              {delta > 0 ? '+' : ''}{delta}
            </span>
          )}
        </div>
        <button
          id="FFButton"
          className="img-button"
          aria-label={props.isFastFoward ? 'Normal speed' : 'Fast forward'}
          aria-pressed={props.isFastFoward}
          onClick={() => props.update({type: 'fastFoward'})}
        >
          <img className="pixel" src={props.isFastFoward ? Icon.button.fastFwrd2 : Icon.button.fastFwrd1} alt="" />
        </button>
      </div>
    </div>
  )
}
