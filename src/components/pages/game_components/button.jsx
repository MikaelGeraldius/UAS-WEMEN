import React, {useEffect, useRef, useState} from "react";
import Icon from "../../assets/iconAsset.js";

export default function buttons(prop){
    const [ratio, setRatio] = useState({width: 0, height: 0});
    const [image, setImage] = useState({
        button: null,
        info: null,
    });
    const [startSnake, setStartSnake] = useState(false);
    const frameCounterRef = useRef(0);
    const noMoneyInterval = useRef();
    const [noMoney, setNoMoney] = useState(false);

    console.log("canSleep:", prop.canSleep, "canBath:", prop.canBath, "canDodge:", prop.canDodge, "canEat:", prop.canEat, "canSnake:", prop.canSnake);

    useEffect(()=>{
        function resizeCanvas (){
            setRatio({
                width: window.innerWidth,
                height: window.innerHeight
            })
        }
        window.addEventListener('resize', resizeCanvas);
        resizeCanvas();
        
        console.log("load button");
    
        if(prop.action == 'sleep'){
            setImage({
                button: Icon.button.sleep,
                info: null
            });
        }
        else if (prop.action == 'bath'){
            setImage({
                button: Icon.button.bath,
                info: null
            })
        }
        else if (prop.action == 'snake'){
            setImage({
                button: Icon.button.play,
                info: Icon.snake.info
            })
        }
        else if (prop.action == 'eat'){
            setImage({
                button: Icon.button.buy,
                info: Icon.foodMenu
            })
        }
        else {
            setImage({
                button: null,
                info: null
            });
        }
    },[prop.action])

    const noMoneyFrame = ()=>{
        noMoneyInterval.current = setInterval(()=>{
            frameCounterRef.current = frameCounterRef.current++;
            if(frameCounterRef.current == 5)
                frameCounterRef.current = 0;
                setNoMoney(false);
                clearInterval(noMoneyInterval.current);
        }, 1000);
    }

    const handleClick = (index)=>{
        if (prop.action == 'bath')
            prop.update({type: 'takeBath'})
        else if (prop.action == 'snake'){
            if(prop.info.coin >= 50){
                setStartSnake(true);
                prop.setIsSnakeActive(true);
            }
            else{
                setNoMoney(true);
                noMoneyFrame;
            }
        }
        else if (prop.action == 'eat'){
            const price = [80, 150, 250, 200];
            console.log('buy index: ' + index);
            if(prop.info.coin >= price[index])
                prop.buyItem(index);
            else{
                setNoMoney(true);
                noMoneyFrame;
            }
        }
        else if (prop.action == 'sleep'){
            if(prop.info.time.hour >= 20 || prop.info.time.hour < 6 )
                prop.update({type: 'goSleep'})
        }
        else if (prop.gameOver){
            prop.restartGame();
        }
    }
    console.log("Button image src:", image.button, "Action:", prop.action);
    console.log("action:", prop.action, "button image:", image.button);

    return (
        <div>
            {(prop.action == 'sleep' && (prop.info.time.hour < 20 && prop.info.time.hour > 5)) &&
                <img id="warning" src={Icon.warning.sleep}  />
            }
            {(prop.action == 'snake' || prop.action == 'eat') &&
                <img id="information" src={image.info} />
            }
            {prop.action == 'eat'&&(
                <div id="buyButtons">
                    <button style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(0)} src={image.button} alt="Buy">buy</button>
                    <button style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(1)} src={image.button} alt="Buy">buy</button>
                    <button style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(2)} src={image.button} alt="Buy">buy</button>
                    <button style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(3)} src={image.button} alt="Buy">buy</button>
                </div>
            )}
            {image.button && (prop.action != 'dodge' && prop.action != 'eat') && (
                <img id="buttonImage" onClick={handleClick} src={image.button}/> 
            )}
            {noMoney &&( 
                <img id="warning" src={Icon.warning.noMoney}  />
            )}
            {prop.gameOver &&
                <img id='restartButton' src={Icon.button.restart} onClick={handleClick} />
            }
        </div>
    )
}