import React from "react";
import { useState, useRef, useEffect } from "react";
import Icon from "../../assets/iconAsset.js";

export default function Info (props){
  const canvasRef = useRef(null);
  const animationRef = useRef();
  const timeInterval = useRef();
  const [x, setX] = useState();
  const [image, setImage] = useState(Icon.button.fastFwrd1);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const greeting = ['Morning', 'Afternoon', 'Evening', 'Night'];

  function handleClick(){
    props.update({type: 'fastFoward'});
  };

  useEffect(()=>{
    if (props.isFastFoward)
      setImage(Icon.button.fastFwrd2);
    else
      setImage(Icon.button.fastFwrd1);
  }, [props.isFastFoward])

  useEffect(()=>{
    if (timeInterval.current) {
        clearInterval(timeInterval.current);
        timeInterval.current = null;
    }
  }, [props.gameOver])

  useEffect(()=>{
    const canvas = canvasRef.current;
    const c = canvas.getContext('2d');
    let fontSize;

    const formattedHour = props.time.hour.toString().padStart(2, '0');
    const formattedMinute = props.time.minute.toString().padStart(2, '0');

    function resizeCanvas() {
        canvas.width = Math.max(250, window.innerWidth*0.27);
        canvas.height = Math.max(80,canvas.width*0.3);
        console.log (canvas.width);
        fontSize = canvas.width *0.07;
        if ( window.innerWidth < 400)
          setX((window.innerWidth/2) -canvas.width/2);   
        else 
          setX(window.innerWidth *0.01);
    }

    timeInterval.current = setInterval(() => {
        props.update({ 
          type: 'updateTime',
        });
    }, 1000);  
        
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();  

    const signImage = new Image();
    signImage.src = Icon.sign;
    
    const animation = ()=>{
      c.clearRect(0,0, canvas.width, canvas.height);

      c.drawImage (signImage, 0, 0, canvas.width, canvas.height);

      c.fillStyle = '#3b2216';
      c.font = `${fontSize}px monospace`;
      c.fillText('Good ' + greeting[props.time.greet] + ', ' + props.data, canvas.width*0.05, canvas.height *0.26)
      c.fillText('Day ' + props.time.day + ' | ' + days[props.time.day%7-1],canvas.width*0.05, canvas.height*0.57)
      c.fillText (formattedHour+ ':' + formattedMinute, canvas.width*0.05, canvas.height*0.85);

      animationRef.current = requestAnimationFrame(animation);
    }
    signImage.onload = ()=>{
        animation();
    }

  return ()=> {
        cancelAnimationFrame(animationRef.current);
        clearInterval(timeInterval.current);
        removeEventListener('resize', resizeCanvas);
    }
  }, [props.time]);

  return (
    <div>
        <canvas 
          ref={canvasRef}
          style={{
              position: 'absolute',
              left: x,
              top: window.innerHeight * -0.01,
        }}
        />
        <img id="FFButton" src={image} onClick={handleClick}/>
      </div>
  )
}