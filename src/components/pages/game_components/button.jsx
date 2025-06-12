import React, {useEffect, useState} from "react";
import Icon from "../../assets/iconAsset.js";
import Snake from "./snake.jsx";

export default function buttons(prop){
    const [ratio, setRatio] = useState({width: 0, height: 0});
    const [image, setImage] = useState({
        button: 'null',
        info:'null',
    });
    const [startSnake, setStartSnake] = useState(false);

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

    },[prop.action])

    const handleClick = (index)=>{
        if (prop.action == 'bath')
            prop.update({type: 'takeBath'})
        else if (prop.action == 'snake'){
            setStartSnake(true);
            prop.setIsSnakeActive(true);
        }
        else if (prop.action == 'eat')
            prop.buyItem(index);
        else if (prop.action == 'sleep'){
            if(prop.info.time.hour >= 20 || prop.info.time.hour < 6 )
                prop.update({type: 'goSleep'})
        }
    }

    return (
        <div>
            {(prop.action == 'sleep' && prop.info.time.hour < 20 && prop.info.time.hour > 5) &&
                <img id="warning" src={Icon.warning.sleep}  />
            }
            {(prop.action == 'snake' || prop.action == 'eat') &&
                <img id="information" src={image.info} />
            }
            {prop.action == 'eat'&&(
                <div id="buyButtons">
                    <button id='buttons' style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(0)} src={image.button} alt="Buy">buy</button>
                    <button id='buttons' style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(1)} src={image.button} alt="Buy">buy</button>
                    <button id='buttons' style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(2)} src={image.button} alt="Buy">buy</button>
                    <button id='buttons' style={{opacity: '0', cursor:'pointer'}} onClick={()=>handleClick(3)} src={image.button} alt="Buy">buy</button>
                </div>
            )}
            {(prop.action != 'dodge' && prop.action != 'eat') && (
                <img id="buttonImage" onClick={handleClick} src={image.button}/> 
            )}
            {startSnake && <Snake update = {prop.update} setIsSnakeActive = {prop.setIsSnakeActive}/>}
        </div>
    )
}