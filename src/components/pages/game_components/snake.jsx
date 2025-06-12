import React, { useRef, useEffect, useState } from "react";
import Icon from "../../assets/iconAsset.js";

export default function SnakeGame(prop) {
    const canvasRef = useRef(null);
    const snakeRef = useRef([{ x: 5, y: 5 }]);
    const directionRef = useRef({ x: 0, y: 0 });
    const appleRef = useRef({ x: 10, y: 10 });
    const sizeRef = useRef();
    const scoreRef = useRef(0);
    const intervalRef = useRef();
    const rows = 20;
    const cols = 20;

    const [position, setPosition] = useState({ x: 0, y: 0 });

    const handleKeyDown = (e) => {
        const dir = directionRef.current;
        if (e.key === "w" && dir.y === 0) directionRef.current = { x: 0, y: -1 };
        if (e.key === "s" && dir.y === 0) directionRef.current = { x: 0, y: 1 };
        if (e.key === "a" && dir.x === 0) directionRef.current = { x: -1, y: 0 };
        if (e.key === "d" && dir.x === 0) directionRef.current = { x: 1, y: 0 };
    };

    const randomizeApple = () => {
        appleRef.current = {
        x: Math.floor(Math.random() * cols),
        y: Math.floor(Math.random() * rows),
        };
    };

    useEffect(() => {
        const canvas = canvasRef.current;
        const c = canvas.getContext("2d");
        
        const backToMenu = ()=>{
            prop.setIsSnakeActive(false);
            console.log('back to menu');
            clearInterval(intervalRef.current);
            c.clearRect (0,0,canvas.width,canvas.height);
            prop.update({type: 'playSnake', score: scoreRef.current})
            return;
        }

        function gameOver(){
            prop.setIsSnakeActive(false);
            c.drawImage(gameOverText, canvas.width/20, canvas.height/4, canvas.width*0.9, 50);
            c.fillStyle = 'white';
            c.font = '15px monospace'
            c.fillText("You received " + scoreRef.current * 10 + " Coins", canvas.width/20, canvas.height*0.8);
            c.fillText("Click screen to continue...", canvas.width/20, canvas.height*0.9);
            window.addEventListener('click', backToMenu, {once:true});
            clearInterval(intervalRef.current);
        }
        

        function resizeCanvas() {
            let size = Math.max(12, window.innerWidth * 0.015);
            canvas.width = size * cols;
            canvas.height = size * rows;
            sizeRef.current = size;
            setPosition({
                x: (window.innerWidth - canvas.width) / 2,
                y: (window.innerHeight - canvas.height) / 2,
            });
        }
            
        resizeCanvas();
        window.addEventListener("resize", resizeCanvas);
        window.addEventListener("keydown", handleKeyDown);
        
        const appleImage = new Image();
        appleImage.src = Icon.snake.apple;

        const gameOverText = new Image();
        gameOverText.src = Icon.snake.gameOver;

        const tutorText = new Image();
        tutorText.src = Icon.snake.tutor;

        const update = () => {
            console.log('start');
            const snake = [...snakeRef.current];
            const dir = directionRef.current;
            const apple = appleRef.current;
            let score = scoreRef.current;
            
            const newHead = {
                x: snake[0].x + dir.x,
                y: snake[0].y + dir.y,
            };
            
            
            if (newHead.x === apple.x && newHead.y === apple.y) {
                snake.unshift(newHead);
                score++;
                randomizeApple();
            } else {
                snake.pop();
                snake.unshift(newHead);
            }
            
            snakeRef.current = snake;
            scoreRef.current = score;
            
            // Draw
            let size = sizeRef.current;
            c.fillStyle = "black";
            c.fillRect(0, 0, canvas.width, canvas.height);
            
            c.drawImage(
                appleImage,
                apple.x * sizeRef.current,
                apple.y * sizeRef.current,
                sizeRef.current,
                sizeRef.current
            );
            c.fillStyle = "green";
            snake.forEach((part) => {
                c.fillRect(
                    part.x * sizeRef.current,
                    part.y * sizeRef.current,
                    sizeRef.current,
                    sizeRef.current
                );
            });
            
            c.fillStyle = 'yellow';
            c.font = `${size*1.3}px Courier New`;
            c.fillText(scoreRef.current, 0, sizeRef.current);
            
            if (
                newHead.x < 0 || newHead.x >= cols ||
                newHead.y < 0 || newHead.y >= rows
            ) {
                gameOver();
            }
            
            for (let i = 1; i < snake.length; i++) {
                if (snake[i].x === newHead.x && snake[i].y === newHead.y) {
                    gameOver();
                }
            }
        };

        tutorText.onload = ()=>{
            c.drawImage(tutorText, 0 ,0, canvas.width, canvas.height);
            window.addEventListener('click', ()=>{
                intervalRef.current = setInterval(update, 100);
            }, {once:true});
        }

        const handleNavigator = (e) => {
            const dir = directionRef.current;
            if ((e.detail === "up" || e.detail === "down") && dir.y === 0) {
                if (e.detail === "up") directionRef.current = { x: 0, y: -1 };
                if (e.detail === "down") directionRef.current = { x: 0, y: 1 };
            }
            if ((e.detail === "left" || e.detail === "right") && dir.x === 0) {
                if (e.detail === "left") directionRef.current = { x: -1, y: 0 };
                if (e.detail === "right") directionRef.current = { x: 1, y: 0 };
            }
        };
        window.addEventListener("snake-navigator", handleNavigator);

        return () => {
            window.removeEventListener("resize", resizeCanvas);
            window.removeEventListener("keydown", handleKeyDown);
            prop.setIsSnakeActive(false);
            window.removeEventListener("snake-navigator", handleNavigator);
        };
    }, []);

    return (
        <canvas
        ref={canvasRef}
        style={{
            position: "absolute",
            left: position.x,
            top: position.y,
        }}
        />
    );
} 
