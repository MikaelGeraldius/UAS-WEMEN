import React from "react";
import { useState, useRef, useEffect } from "react";
import Icon from "../../assets/iconAsset.js";

export default function status (props){
const canvasRef = useRef(null);
const animationRef = useRef();
const timeInterval = useRef();
const [x, setX] = useState();
const [y,setY] = useState();

useEffect(()=>{
    const canvas = canvasRef.current;
    const c = canvas.getContext('2d');
    let fontSize;
    
    function resizeCanvas() {
        if (window.innerWidth > 400){
            if (window.innerWidth < 600){
                canvas.width = 95;
            }
            else canvas.width = 300;
            setY(window.innerHeight *0.02);
        }
        else{
            canvas.width = 95;
            setY(85);
        }
        fontSize = Math.max(12,canvas.height*0.1);
        setX(window.innerWidth - canvas.width*1.01);
        canvas.height = window.innerHeight * 0.27
    }
    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const energyImage = new Image();
    energyImage.src = Icon.status.energy;
    
    const hungerImage = new Image();
    hungerImage.src = Icon.status.hunger;
    
    const hygieneImage = new Image();
    hygieneImage.src = Icon.status.hygiene;
    
    const moodImage = new Image();
    if (props.value.mood > 70){
        moodImage.src = Icon.status.mood.happy;
    }
    else if (props.value.mood > 30){
        moodImage.src = Icon.status.mood.neutral;
    }
    else {
        moodImage.src = Icon.status.mood.sad;
    }
    const animation = ()=>{
        c.clearRect(0,0, canvas.width, canvas.height);

        c.drawImage(energyImage, 0, 0, canvas.height*0.15, canvas.height*0.15);
        c.drawImage(hungerImage, 0, canvas.height*0.20, canvas.height*0.15, canvas.height*0.15);
        c.drawImage(hygieneImage, 0, canvas.height*0.4, canvas.height*0.15, canvas.height*0.15);
        c.drawImage(moodImage, 0, canvas.height*0.6, canvas.height*0.15, canvas.height*0.15);

        if(window.innerWidth > 600){
            c.fillStyle ='#3b2216';
            c.fillRect(canvas.width*0.3, 0, canvas.width*0.6, canvas.height*0.15);
            c.fillRect(canvas.width*0.3, canvas.height*0.2, canvas.width*0.6, canvas.height*0.15);
            c.fillRect(canvas.width*0.3, canvas.height*0.4, canvas.width*0.6, canvas.height*0.15);
            c.fillRect(canvas.width*0.3, canvas.height*0.6, canvas.width*0.6, canvas.height*0.15);

            c.fillStyle = '#8c4b0e';
            c.fillRect (canvas.width*0.3+canvas.width*0.008, canvas.height*0.015,canvas.width*0.584*props.value.energy/100, canvas.height*0.12);
            c.fillStyle = '#730101';
            c.fillRect (canvas.width*0.3+canvas.width*0.008, canvas.height*0.2+canvas.height*0.015,canvas.width*0.584*props.value.hunger/100, canvas.height*0.12);
            c.fillStyle = '#000275';
            c.fillRect (canvas.width*0.3+canvas.width*0.008, canvas.height*0.4+canvas.height*0.015,canvas.width*0.584*props.value.hygiene/100, canvas.height*0.12);
            c.fillStyle = '#6b016b';
            c.fillRect (canvas.width*0.3+canvas.width*0.008, canvas.height*0.6+canvas.height*0.015,canvas.width*0.584*props.value.mood/100, canvas.height*0.12);
        }

        c.fillStyle = '#3b2216';
        c.font = `bold ${fontSize}px monospace`;
        c.fillText(props.value.energy + '/100', canvas.height*0.15+canvas.height*0.06, canvas.height *0.1);
        c.fillText(props.value.hunger + '/100', canvas.height*0.15+canvas.height*0.06, canvas.height *0.3);
        c.fillText(props.value.hygiene + '/100', canvas.height*0.15+canvas.height*0.06, canvas.height *0.5);
        c.fillText(props.value.mood + '/100', canvas.height*0.15+canvas.height*0.06, canvas.height *0.7);

        animationRef.current = requestAnimationFrame(animation);
    }

    let imagesLoaded = 0;
    function checkAllLoaded() {
        imagesLoaded++;
        console.log('images: ' +imagesLoaded);
        if (imagesLoaded === 4) {
        requestAnimationFrame(animation);
        }
    }
    
    energyImage.onload = checkAllLoaded;
    hungerImage.onload = checkAllLoaded;
    hygieneImage.onload = checkAllLoaded;
    moodImage.onload = checkAllLoaded;

    return ()=> {
        removeEventListener('resize',resizeCanvas);
        cancelAnimationFrame(animationRef.current);
    }
}, [props.value]);


return (
    <canvas 
        ref={canvasRef}
        style={{
            position: 'absolute',
            left: x,
            top: y,
    }}
    />
)
}