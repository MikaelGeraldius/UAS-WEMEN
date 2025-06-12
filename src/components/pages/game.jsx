import React, { useRef, useEffect, useState, useReducer } from 'react';
import { collisions, map } from '../assets/map.js';
import { player1Images, player2Images, player3Images } from '../assets/player.js';
import icons from '../assets/iconAsset.js';
import Info from './game_components/info';
import StatusBar from './game_components/status'
import Buttons from './game_components/button';
import Inventory from './game_components/inventory.jsx';
import Navigator from './game_components/navigator.jsx';

function reducer (info, action){
  let { greet, day, hour, minute } = info.time;
  let {energy, hunger, hygiene, mood } = info.status;
  let money = info.coin;
  switch (action.type){
    case 'updateTime':{
      if(info.isFastFoward)
        minute =(minute + (4-minute%4))%60;
      else
        minute = (minute+2)%60;
      if (minute == 0){
        hour = (hour+1)%24;
      }
      if (hour == 0 && minute == 0) day++;
      return {...info, time: {greet, day, hour, minute}};
    }
    case 'changeHour': {
      if (hour >= 6 && hour <12)
        greet = 0; 
      else if (hour >= 12 && hour < 18 )
        greet = 1; 
      else if (hour >= 18 && hour < 21)
        greet = 2;
      else 
        greet = 3;
      energy = Math.max(0, energy-5);
      hunger = Math.max(0, hunger-5);
      hygiene = Math.max(0, hygiene-10);
      mood = Math.max(0, mood-5);
      return {...info, time:{...info.time, greet: greet}, status: {energy, hunger, hygiene, mood}};
    }
    case 'goSleep' : {
      if (hour >= 20) day++;
      hour = 8;
      minute = 0;
      energy = 100;
      hunger = 80;
      mood = 100;
      return{...info, time: {greet, day, hour, minute}, status: {energy, hunger, hygiene, mood}};
    }
    case 'takeBath' : {
      hygiene = 100;
      return{...info, status:{...info.status, hygiene: hygiene}};
    }
    case 'eatFood':{
      const foodList = [
        { hunger: 20, energy: 5 },
        { hunger: 50, energy: 10 },
        { hunger: 80, energy: 30 },
        { hunger: 0, energy: 100 },
      ];
      const selected = foodList[action.index];
      hunger = Math.min(hunger + selected.hunger, 100);
      energy = Math.min(energy + selected.energy, 100);
      return {
        ...info,
        status: { ...info.status, hunger:hunger, energy:energy }
      };
    }
    case 'buyFood':{
      const priceList = [80, 150, 250, 200];
      const cost = priceList[action.index];

      if (money >= cost) {
        return { ...info, coin: money - cost };
      } else {
        return { ...info, noMoney: true }; 
      }
    } 
    case 'playSnake':{
      money += ((10*action.score)-50);
      mood = Math.min(mood + 50, 100);
      hunger = Math.max(0, hunger - 5);
      energy = Math.max(0, energy - 5);
      return{...info, status:{energy, hunger, hygiene, mood}, coin: money};
    }
    case 'fastFoward': {
      return{...info, isFastFoward: !info.isFastFoward}
    }
  }
}

let canBath = false;
let canSnake = false;
let canDodge = false;
let canEat = false;
let canSleep = false;

const Game = (data) => {
  const canvasRef = useRef(null);
  const [isStartGame, setIsStartGame] =  useState(false);
  const [context, setContext] = useState(null);
  const [dayMode, setDayMode] = useState(true);
  const mapX = useRef(-511);
  const mapY = useRef(-567);
  const speed = useRef(3);
  const movingInterval = useRef();
  const sprintInterval = useRef(100);
  const [isSnakeActive, setIsSnakeActive] = useState(false);
  const isSnakeActiveRef = useRef(isSnakeActive);
  const wasInSnakeAreaRef = useRef(false);
  const animationRef = useRef();
  const introAnimationRef = useRef();
  const isMovingRef = useRef(false);
  const lastDirectionRef = useRef('down');
 
  useEffect(() => {
    isSnakeActiveRef.current = isSnakeActive;
  }, [isSnakeActive]);
  
  const TILE_SIZE = 64;
  const MAP_WIDTH = 60;
  const MAP_HEIGHT = 57;
  
  const playerWorld = useRef({
    x: 13 * TILE_SIZE,
    y: 13 * TILE_SIZE
  })
  
  //boundary
  const collisionsMap = []
  for (let i = 0; i < collisions.length; i += 60){
    collisionsMap.push(collisions.slice(i, i + 60));
  }
  
  class Boundary {
    constructor({position}){
      this.position = position
      this.width = 64
      this.height = 64
    }
  }
  
  const boundaries = [];
  const sleep = [];
  const bath = [];
  const snake = [];
  const eat = [];
  const dodge = [];
  const [action, setAction] = useState();

  const [info, dispatch] = useReducer(reducer,{
    time:{
      greet: 0,
      day: 1,
      hour: 15,
      minute:0
    }, 
    status: {
      energy: 55,
      hunger: 55,
      hygiene:60,
      mood: 55
    },
    coin: 10000,
    noMoney: false,
    isFastFoward: false
  })
  const frameCounterRef = useRef(0);

  const itemIndexRef = useRef(-1);
  function buyItem(itemIndex){
    itemIndexRef.current = itemIndex;
   dispatch({
      type: 'buyFood',
      index: itemIndex
    });
  }

  const updateSnakeActive = (val) => {
    setIsSnakeActive(val);
    isSnakeActiveRef.current = val;
    if (!val) {
      setAction(undefined);
      wasInSnakeAreaRef.current = false;
      for (let i = 0; i < snake.length; i++) {
        const s = snake[i];
        const playerBox = {
          left: playerWorld.current.x - 9,
          right: playerWorld.current.x - 9 + 36,
          top: playerWorld.current.y - 24,
          bottom: playerWorld.current.y - 24 + 48
        };
        if (
          playerBox.right > s.position.x &&
          playerBox.left < s.position.x + s.width &&
          playerBox.top < s.position.y + s.height &&
          playerBox.bottom > s.position.y
        ) {
          const distTop = Math.abs(playerBox.top - (s.position.y + s.height));
          const distBottom = Math.abs(playerBox.bottom - s.position.y);
          const distLeft = Math.abs(playerBox.left - (s.position.x + s.width));
          const distRight = Math.abs(playerBox.right - s.position.x);

          const minDist = Math.min(distTop, distBottom, distLeft, distRight);

          if (minDist === distTop) {
            // Move above
            playerWorld.current.y = s.position.y + s.height + 24;
          } else if (minDist === distBottom) {
            // Move below
            playerWorld.current.y = s.position.y - 24;
          } else if (minDist === distLeft) {
            // Move left
            playerWorld.current.x = s.position.x + s.width + 9;
          } else if (minDist === distRight) {
            // Move right
            playerWorld.current.x = s.position.x - 36 + 9;
          }
          break;
        }
      }
      if (animationRef.current) requestAnimationFrame(animationRef.current);
    }
  }

  collisionsMap.forEach((row, i) => {
    row.forEach((column, j) => {
        if(column == 207){
          boundaries.push(
            new Boundary({
              position: {
                x: j * TILE_SIZE + 66 * 2,
                y: i * TILE_SIZE + 92 * 2
              }
            })
          )
        }
        else if(column == 208){
            bath.push(
                new Boundary({
                    position: {
                        x: j * TILE_SIZE + 66 * 2,
                        y: i * TILE_SIZE + 92 * 2
                    }
                }
            ))
        } else if(column == 209){
            snake.push(
                new Boundary({
                    position: {
                        x: j * TILE_SIZE + 66 * 2,
                        y: i * TILE_SIZE + 92 * 2
                    }
                }
            ))
        } else if(column == 210){
            dodge.push(
                new Boundary({
                    position: {
                        x: j * TILE_SIZE + 66 * 2,
                        y: i * TILE_SIZE + 92 * 2
                    }
                }
            ))
        }else if(column == 211){
            eat.push(
                new Boundary({
                    position: {
                        x: j * TILE_SIZE + 66 * 2,
                        y: i * TILE_SIZE + 92 * 2
                    }
                }
            ))
        }else if(column == 212){
            sleep.push(
                new Boundary({
                    position: {
                        x: j * TILE_SIZE + 66 * 2,
                        y: i * TILE_SIZE + 92 * 2
                    }
                }
            ))
        }
    })
  })

  let predict = 3;
  let lastTime = performance.now();
  
  const keys = useRef({
    w: {
        isPressed: false
    },
    s: {
        isPressed: false
    },
    a: {
        isPressed: false
    },
    d: {
        isPressed: false
    }
  });

  const handleNavigatorMove = (direction, pressed) => {
    if (isSnakeActiveRef.current) {
      window.dispatchEvent(new CustomEvent("snake-navigator", { detail: direction }));
      return;
    }
    let key;
    if (direction === 'up') key = 'w';
    if (direction === 'down') key = 's';
    if (direction === 'left') key = 'a';
    if (direction === 'right') key = 'd';

    if (key) {
      keys.current[key].isPressed = pressed;
      if (pressed) {
        isMovingRef.current = true;
        lastDirectionRef.current = direction;
      } else {
        if (
          !keys.current.w.isPressed &&
          !keys.current.a.isPressed &&
          !keys.current.s.isPressed &&
          !keys.current.d.isPressed
        ) {
          isMovingRef.current = false;
        }
      }
    }
  };
  
  useEffect(() => {
    const playerIdleImgs = [
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() },
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() },
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() }
    ];
    const playerRunImgs = [
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() },
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() },
      { U: new window.Image(), D: new window.Image(), L: new window.Image(), R: new window.Image() }
    ];
    playerIdleImgs[0].U.src = player1Images.idle.U;
    playerIdleImgs[0].D.src = player1Images.idle.D;
    playerIdleImgs[0].L.src = player1Images.idle.L;
    playerIdleImgs[0].R.src = player1Images.idle.R;
    playerIdleImgs[1].U.src = player2Images.idle.U;
    playerIdleImgs[1].D.src = player2Images.idle.D;
    playerIdleImgs[1].L.src = player2Images.idle.L;
    playerIdleImgs[1].R.src = player2Images.idle.R;
    playerIdleImgs[2].U.src = player3Images.idle.U;
    playerIdleImgs[2].D.src = player3Images.idle.D;
    playerIdleImgs[2].L.src = player3Images.idle.L;
    playerIdleImgs[2].R.src = player3Images.idle.R;

    playerRunImgs[0].U.src = player1Images.run.U;
    playerRunImgs[0].D.src = player1Images.run.D;
    playerRunImgs[0].L.src = player1Images.run.L;
    playerRunImgs[0].R.src = player1Images.run.R;
    playerRunImgs[1].U.src = player2Images.run.U;
    playerRunImgs[1].D.src = player2Images.run.D;
    playerRunImgs[1].L.src = player2Images.run.L;
    playerRunImgs[1].R.src = player2Images.run.R;
    playerRunImgs[2].U.src = player3Images.run.U;
    playerRunImgs[2].D.src = player3Images.run.D;
    playerRunImgs[2].L.src = player3Images.run.L;
    playerRunImgs[2].R.src = player3Images.run.R;

    const canvas = canvasRef.current;
    const c = canvas.getContext('2d');
    setContext(c);

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    const intro = new Image();
    intro.src = icons.intro;
    
    const day = new Image();
    day.src = map.day.source;
  
    const night = new Image();
    night.src = map.night.source;

    const player = new Image();
    player.src = player1Images.idle.D;

    let playerCurrStart = 0;
    let playerCurrEnd = 36;
    let playerOffset = 9;
    let playerIdleFrames = 0;
    let playerMovingFrames = 0;
    let chars = (typeof data.char === 'number' ? data.char : 0) + 1;

    let idleInterval;
    
    idleInterval = setInterval(() => {
        playerIdleFrames = (playerIdleFrames + 1) % 4;
    }, 150);

    function startSprint() {
      if (movingInterval.current) clearInterval(movingInterval.current);
      movingInterval.current = setInterval(() => {
        playerMovingFrames = (playerMovingFrames + 1) % 6; // Use correct frame count for your animation
      }, sprintInterval.current);
    }
    startSprint();
    
    function animation(now){
      console.log(playerWorld.current);
      if (isSnakeActiveRef.current) return;
      const delta = now - lastTime;
      lastTime = now;

      chars = (typeof data.char === 'number' ? data.char : 0) + 1;

      const cameraOffsetX = canvas.width / 2 - playerWorld.current.x;
      const cameraOffsetY = canvas.height / 2 - playerWorld.current.y;

      c.clearRect(0, 0, canvas.width, canvas.height);

      if (dayMode)
        c.drawImage(day, cameraOffsetX, cameraOffsetY);
      else 
        c.drawImage(night, cameraOffsetX, cameraOffsetY);

      const charIdx = chars - 1;
      const dir = lastDirectionRef.current;
      let playerImg;

      const dirKey = dir === 'up' ? 'U' : dir === 'down' ? 'D' : dir === 'left' ? 'L' : 'R';

      if (!isMovingRef.current) {
        playerImg = playerIdleImgs[charIdx][dirKey];
      } else {
        playerImg = playerRunImgs[charIdx][dirKey];
      }
      
      c.drawImage(
        playerImg,
        playerCurrStart,
        0,
        playerCurrEnd,
        playerImg.height || 48,
        canvas.width/2 - playerOffset,
        canvas.height/2 - playerImg.height/2,
        playerCurrEnd,
        playerImg.height || 48
      );

        c.save();
        c.strokeStyle = 'red';
        boundaries.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
        c.save();
        c.strokeStyle = 'green';
        snake.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
        c.save();
        c.strokeStyle = 'brown';
        dodge.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
        c.save();
        c.strokeStyle = 'white';
        sleep.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
        c.save();
        c.strokeStyle = 'blue';
        bath.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
        c.save();
        c.strokeStyle = 'yellow';
        eat.forEach(boundary => {
            c.strokeRect(
                boundary.position.x + cameraOffsetX,
                boundary.position.y + cameraOffsetY,
                boundary.width,
                boundary.height
            );
        });
        c.restore();
      
      

      if (canSleep){
        setAction("sleep");
      }
      else if(canEat){
        setAction("eat");
      }
      else if (canBath){
        setAction('bath');
      }
      if (canSnake &&
          !wasInSnakeAreaRef.current &&
          action !== 'snake' &&
          !isSnakeActiveRef.current)
      {
        setAction('snake');
      }
      wasInSnakeAreaRef.current = canSnake;

      if(!isMovingRef.current){
        if(lastDirectionRef.current == 'up'){
            if(chars == 1){
                player.src = player1Images.idle.U
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 104;
                    playerCurrEnd = 40;
                    playerOffset = 11;
                }
            }else if(chars == 2){
                player.src = player2Images.idle.U
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 104;
                    playerCurrEnd = 40;
                    playerOffset = 11;
                }
            }else if(chars == 3){
                player.src = player3Images.idle.U
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 32;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 64;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 96;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
            }
        }
        else if(lastDirectionRef.current == 'down'){
            if(chars == 1){
                player.src = player1Images.idle.D
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 104;
                    playerCurrEnd = 40;
                    playerOffset = 11;
                }
            }else if(chars == 2){
                player.src = player2Images.idle.D
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 104;
                    playerCurrEnd = 40;
                    playerOffset = 11;
                }
            }else if(chars == 3){
                player.src = player3Images.idle.D
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 32;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 64;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 96;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
            }
        }
        else if(lastDirectionRef.current == 'left'){
            if(chars == 1){
                player.src = player1Images.idle.L
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 32;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 60;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 92;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
            }else if(chars == 2){
                player.src = player2Images.idle.L
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 32;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 60;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 92;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
            }else if(chars == 3){
                player.src = player3Images.idle.L
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 28;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 56;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 84;
                    playerCurrEnd = 32;
                    playerOffset = 11;
                }
            }
        }
        else if(lastDirectionRef.current == 'right'){
            if (chars == 1){
                player.src = player1Images.idle.R
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 96;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
            }else if (chars == 2){
                player.src = player2Images.idle.R
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 36;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 68;
                    playerCurrEnd = 28 ;
                    playerOffset = 7;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 96;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
            }else if (chars == 3){
                player.src = player3Images.idle.R
                if(playerIdleFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 32;
                    playerOffset = 11;
                }
                else if (playerIdleFrames == 1){
                    playerCurrStart = 32;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 2){
                    playerCurrStart = 60;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
                else if (playerIdleFrames == 3){
                    playerCurrStart = 88;
                    playerCurrEnd = 28;
                    playerOffset = 9;
                }
            }
        }
      }
      else {
        const playerBox = {
          left: playerWorld.current.x - playerOffset,
          right: playerWorld.current.x - playerOffset + 36,
          top: playerWorld.current.y - (player.height || 48) / 2,
          bottom: playerWorld.current.y - (player.height || 48) / 2 + (player.height || 48)
        };

        if(keys.current.w.isPressed && lastDirectionRef.current === 'up'){
          isMovingRef.current = true;
          const nextTop = playerBox.top - speed.current * (delta / 16.67);
          const nextBottom = playerBox.bottom - speed.current * (delta / 16.67);
          for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i];
            if(
              playerBox.right > boundary.position.x &&
              playerBox.left < boundary.position.x + boundary.width &&
              nextTop < boundary.position.y + boundary.height &&
              nextBottom > boundary.position.y
            ){
              isMovingRef.current = false;
              break;
            }
          }
          canBath = canSnake = canDodge = canEat = canSleep = false;
          for(let i = 0; i < bath.length; i++){
            const bathDetect = bath[i];
            if(
                playerBox.right > bathDetect.position.x &&
                playerBox.left < bathDetect.position.x + bathDetect.width &&
                playerBox.top < bathDetect.position.y + bathDetect.height &&
                playerBox.bottom > bathDetect.position.y
            ){
                canBath = true;
                break;
            }
          }
          for(let i = 0; i < bath.length; i++){
            const bathDetect = bath[i];
            if(
              playerBox.right > bathDetect.position.x &&
              playerBox.left < bathDetect.position.x + bathDetect.width &&
              playerBox.top < bathDetect.position.y + bathDetect.height &&
              playerBox.bottom > bathDetect.position.y
            ){
              canBath = true;
              break;
            }
          }
          for(let i = 0; i < snake.length; i++){
            const snakeDetect = snake[i];
            if(
              playerBox.right > snakeDetect.position.x &&
              playerBox.left < snakeDetect.position.x + snakeDetect.width &&
              playerBox.top < snakeDetect.position.y + snakeDetect.height &&
              playerBox.bottom > snakeDetect.position.y
            ){
              canSnake = true;
              break;
            }
          }
          for(let i = 0; i < dodge.length; i++){
            const dodgeDetect = dodge[i];
            if(
              playerBox.right > dodgeDetect.position.x &&
              playerBox.left < dodgeDetect.position.x + dodgeDetect.width &&
              playerBox.top < dodgeDetect.position.y + dodgeDetect.height &&
              playerBox.bottom > dodgeDetect.position.y
            ){
              canDodge = true;
              break;
            }
          }
          for(let i = 0; i < eat.length; i++){
            const eatDetect = eat[i];
            if(
              playerBox.right > eatDetect.position.x &&
              playerBox.left < eatDetect.position.x + eatDetect.width &&
              playerBox.top < eatDetect.position.y + eatDetect.height &&
              playerBox.bottom > eatDetect.position.y
            ){
              canEat = true;
              break;
            }
          }
          for(let i = 0; i < sleep.length; i++){
            const sleepDetect = sleep[i];
            if(
              playerBox.right > sleepDetect.position.x &&
              playerBox.left < sleepDetect.position.x + sleepDetect.width &&
              playerBox.top < sleepDetect.position.y + sleepDetect.height &&
              playerBox.bottom > sleepDetect.position.y
            ){
              canSleep = true;
              break;
            }
          }
          if(isMovingRef.current){
              playerWorld.current.y -= speed.current * (delta / 16.67);
          }
          if(chars == 1){
            player.src = player1Images.run.U;
            if(playerMovingFrames == 0){
              playerCurrStart = 0;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 1){
              playerCurrStart = 34;
              playerCurrEnd = 34;
              playerOffset = 12;
            }
            else if(playerMovingFrames == 2){
              playerCurrStart = 68;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 3){
              playerCurrStart = 102;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
            else if (playerMovingFrames == 4){
              playerCurrStart = 136;
              playerCurrEnd = 34;
              playerOffset = 8;
            }
            else if (playerMovingFrames == 5){
              playerCurrStart = 170;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
          }else if(chars == 2){
            player.src = player2Images.run.U;
            if(playerMovingFrames == 0){
              playerCurrStart = 0;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 1){
              playerCurrStart = 34;
              playerCurrEnd = 34;
              playerOffset = 12;
            }
            else if(playerMovingFrames == 2){
              playerCurrStart = 68;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 3){
              playerCurrStart = 102;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
            else if (playerMovingFrames == 4){
              playerCurrStart = 136;
              playerCurrEnd = 34;
              playerOffset = 8;
            }
            else if (playerMovingFrames == 5){
              playerCurrStart = 170;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
          }
          else if(chars == 3){
            player.src = player3Images.run.U;
            if(playerMovingFrames == 0){
              playerCurrStart = 0;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 1){
              playerCurrStart = 34;
              playerCurrEnd = 34;
              playerOffset = 12;
            }
            else if(playerMovingFrames == 2){
              playerCurrStart = 68;
              playerCurrEnd = 34;
              playerOffset = 11;
            }
            else if(playerMovingFrames == 3){
              playerCurrStart = 102;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
            else if (playerMovingFrames == 4){
              playerCurrStart = 136;
              playerCurrEnd = 34;
              playerOffset = 8;
            }
            else if (playerMovingFrames == 5){
              playerCurrStart = 170;
              playerCurrEnd = 34;
              playerOffset = 9;
            }
          }
        }
        else if(keys.current.s.isPressed && lastDirectionRef.current === 'down'){
          isMovingRef.current = true;
          const nextTop = playerBox.top + speed.current * (delta / 16.67);
          const nextBottom = playerBox.bottom + speed.current * (delta / 16.67);
          for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i];
            if(
              playerBox.right > boundary.position.x &&
              playerBox.left < boundary.position.x + boundary.width &&
              nextTop < boundary.position.y + boundary.height &&
              nextBottom > boundary.position.y
            ){
              isMovingRef.current = false;
              break;
            }
          }
          canBath = canSnake = canDodge = canEat = canSleep = false;
          for(let i = 0; i < bath.length; i++){
            const bathDetect = bath[i];
            if(
              playerBox.right > bathDetect.position.x &&
              playerBox.left < bathDetect.position.x + bathDetect.width &&
              playerBox.top < bathDetect.position.y + bathDetect.height &&
              playerBox.bottom > bathDetect.position.y
            ){
              canBath = true;
              break;
            }
          }
          for(let i = 0; i < snake.length; i++){
            const snakeDetect = snake[i];
            if(
              playerBox.right > snakeDetect.position.x &&
              playerBox.left < snakeDetect.position.x + snakeDetect.width &&
              playerBox.top < snakeDetect.position.y + snakeDetect.height &&
              playerBox.bottom > snakeDetect.position.y
            ){
              canSnake = true;
              break;
            }
          }
          for(let i = 0; i < dodge.length; i++){
            const dodgeDetect = dodge[i];
            if(
              playerBox.right > dodgeDetect.position.x &&
              playerBox.left < dodgeDetect.position.x + dodgeDetect.width &&
              playerBox.top < dodgeDetect.position.y + dodgeDetect.height &&
              playerBox.bottom > dodgeDetect.position.y
            ){
              canDodge = true;
              break;
            }
          }
          for(let i = 0; i < eat.length; i++){
            const eatDetect = eat[i];
            if(
              playerBox.right > eatDetect.position.x &&
              playerBox.left < eatDetect.position.x + eatDetect.width &&
              playerBox.top < eatDetect.position.y + eatDetect.height &&
              playerBox.bottom > eatDetect.position.y
            ){
              canEat = true;
              break;
            }
          }
          for(let i = 0; i < sleep.length; i++){
            const sleepDetect = sleep[i];
            if(
              playerBox.right > sleepDetect.position.x &&
              playerBox.left < sleepDetect.position.x + sleepDetect.width &&
              playerBox.top < sleepDetect.position.y + sleepDetect.height &&
              playerBox.bottom > sleepDetect.position.y
            ){
              canSleep = true;
              break;
            }
          }
          if(isMovingRef.current){
                playerWorld.current.y += speed.current * (delta / 16.67);
          }
          if(chars == 1){
                player.src = player1Images.run.D;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 30;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 62; 
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 92;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 124;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 156;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
            }else if(chars == 2){
                player.src = player2Images.run.D;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 30;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 62; 
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 92;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 124;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 156;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
            }else if(chars == 3){
                player.src = player3Images.run.D;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 30;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 62; 
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 92;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 124;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 156;
                    playerCurrEnd = 32;
                    playerOffset = 9;
                }
            }
        }
        else if(keys.current.a.isPressed && lastDirectionRef.current === 'left'){
          isMovingRef.current = true;
          const nextLeft = playerBox.left - speed.current * (delta / 16.67);
          const nextRight = playerBox.right - speed.current * (delta / 16.67);
          for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i];
            if(
              nextRight > boundary.position.x &&
              nextLeft < boundary.position.x + boundary.width &&
              playerBox.top < boundary.position.y + boundary.height &&
              playerBox.bottom > boundary.position.y
            ){
              isMovingRef.current = false;
              break;
            }
          }
          canBath = canSnake = canDodge = canEat = canSleep = false;
          for(let i = 0; i < bath.length; i++){
            const bathDetect = bath[i];
            if(
              playerBox.right > bathDetect.position.x &&
              playerBox.left < bathDetect.position.x + bathDetect.width &&
              playerBox.top < bathDetect.position.y + bathDetect.height &&
              playerBox.bottom > bathDetect.position.y
            ){
              canBath = true;
              break;
            }
          }
          for(let i = 0; i < snake.length; i++){
            const snakeDetect = snake[i];
            if(
              playerBox.right > snakeDetect.position.x &&
              playerBox.left < snakeDetect.position.x + snakeDetect.width &&
              playerBox.top < snakeDetect.position.y + snakeDetect.height &&
              playerBox.bottom > snakeDetect.position.y
            ){
              canSnake = true;
              break;
            }
          }
          for(let i = 0; i < dodge.length; i++){
            const dodgeDetect = dodge[i];
            if(
              playerBox.right > dodgeDetect.position.x &&
              playerBox.left < dodgeDetect.position.x + dodgeDetect.width &&
              playerBox.top < dodgeDetect.position.y + dodgeDetect.height &&
              playerBox.bottom > dodgeDetect.position.y
            ){
              canDodge = true;
              break;
            }
          }
          for(let i = 0; i < eat.length; i++){
            const eatDetect = eat[i];
            if(
              playerBox.right > eatDetect.position.x &&
              playerBox.left < eatDetect.position.x + eatDetect.width &&
              playerBox.top < eatDetect.position.y + eatDetect.height &&
              playerBox.bottom > eatDetect.position.y
            ){
              canEat = true;
              break;
            }
          }
          for(let i = 0; i < sleep.length; i++){
            const sleepDetect = sleep[i];
            if(
              playerBox.right > sleepDetect.position.x &&
              playerBox.left < sleepDetect.position.x + sleepDetect.width &&
              playerBox.top < sleepDetect.position.y + sleepDetect.height &&
              playerBox.bottom > sleepDetect.position.y
            ){
              canSleep = true;
              break;
            }
          }
          if(isMovingRef.current){
                playerWorld.current.x -= speed.current * (delta / 16.67);
          }
          
          if(chars == 1){
                player.src = player1Images.run.L;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 24;
                    playerOffset = 7;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 24;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 54;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 90;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 120;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 148;
                    playerCurrEnd = 26;
                    playerOffset = 7;
                }
            }else if(chars == 2){
                player.src = player2Images.run.L;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 24;
                    playerOffset = 7;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 24;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 54;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 90;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 120;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 148;
                    playerCurrEnd = 26;
                    playerOffset = 7;
                }
            }else if(chars == 3){
                player.src = player3Images.run.L;
                if(playerMovingFrames == 0){
                    playerCurrStart = 0;
                    playerCurrEnd = 24;
                    playerOffset = 7;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 24;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 54;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 90;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 120;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 148;
                    playerCurrEnd = 28;
                    playerOffset = 7; 
                }
            }
        }
        else if(keys.current.d.isPressed && lastDirectionRef.current === 'right'){
          isMovingRef.current = true;
          const nextLeft = playerBox.left + speed.current * (delta / 16.67);
          const nextRight = playerBox.right + speed.current * (delta / 16.67);
          for(let i = 0; i < boundaries.length; i++){
            const boundary = boundaries[i];
            if(
              nextRight > boundary.position.x &&
              nextLeft < boundary.position.x + boundary.width &&
              playerBox.top < boundary.position.y + boundary.height &&
              playerBox.bottom > boundary.position.y
            ){
              isMovingRef.current = false;
              break;
            }
          }
          canBath = canSnake = canDodge = canEat = canSleep = false;
          for(let i = 0; i < bath.length; i++){
            const bathDetect = bath[i];
            if(
              playerBox.right > bathDetect.position.x &&
              playerBox.left < bathDetect.position.x + bathDetect.width &&
              playerBox.top < bathDetect.position.y + bathDetect.height &&
              playerBox.bottom > bathDetect.position.y
            ){
              canBath = true;
              break;
            }
          }
          for(let i = 0; i < snake.length; i++){
            const snakeDetect = snake[i];
            if(
              playerBox.right > snakeDetect.position.x &&
              playerBox.left < snakeDetect.position.x + snakeDetect.width &&
              playerBox.top < snakeDetect.position.y + snakeDetect.height &&
              playerBox.bottom > snakeDetect.position.y
            ){
              canSnake = true;
              break;
            }
          }
          for(let i = 0; i < dodge.length; i++){
            const dodgeDetect = dodge[i];
            if(
              playerBox.right > dodgeDetect.position.x &&
              playerBox.left < dodgeDetect.position.x + dodgeDetect.width &&
              playerBox.top < dodgeDetect.position.y + dodgeDetect.height &&
              playerBox.bottom > dodgeDetect.position.y
            ){
              canDodge = true;
              break;
            }
          }
          for(let i = 0; i < eat.length; i++){
            const eatDetect = eat[i];
            if(
              playerBox.right > eatDetect.position.x &&
              playerBox.left < eatDetect.position.x + eatDetect.width &&
              playerBox.top < eatDetect.position.y + eatDetect.height &&
              playerBox.bottom > eatDetect.position.y
            ){
              canEat = true;
              break;
            }
          }
          for(let i = 0; i < sleep.length; i++){
            const sleepDetect = sleep[i];
            if(
              playerBox.right > sleepDetect.position.x &&
              playerBox.left < sleepDetect.position.x + sleepDetect.width &&
              playerBox.top < sleepDetect.position.y + sleepDetect.height &&
              playerBox.bottom > sleepDetect.position.y
            ){
              canSleep = true;
              break;
            }
          }
          if(isMovingRef.current){
                playerWorld.current.x += speed.current * (delta / 16.67);
          }
          
          if(chars == 1){
                player.src = player1Images.run.R;
                if(playerMovingFrames == 0){
                    playerCurrStart = 150;
                    playerCurrEnd = 24;
                    playerOffset = 5;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 120;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 84;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 54;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 26;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 0;
                    playerCurrEnd = 26;
                    playerOffset = 7;
                }
            }else if(chars == 2){
                player.src = player2Images.run.R;
                if(playerMovingFrames == 0){
                    playerCurrStart = 150;
                    playerCurrEnd = 24;
                    playerOffset = 5;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 120;
                    playerCurrEnd = 30;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 84;
                    playerCurrEnd = 36;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 54;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 26;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 0;
                    playerCurrEnd = 26;
                    playerOffset = 7;
                }
            }else if(chars == 3){
                player.src = player3Images.run.R;
                if(playerMovingFrames == 0){
                    playerCurrStart = 152;
                    playerCurrEnd = 24;
                    playerOffset = 5;
                }
                else if(playerMovingFrames == 1){
                    playerCurrStart = 122;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if(playerMovingFrames == 2){
                    playerCurrStart = 86;
                    playerCurrEnd = 36;
                    playerOffset = 11;
                }
                else if(playerMovingFrames == 3){
                    playerCurrStart = 56;
                    playerCurrEnd = 30;
                    playerOffset = 9;
                }
                else if (playerMovingFrames == 4){
                    playerCurrStart = 28;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
                else if (playerMovingFrames == 5){
                    playerCurrStart = 0;
                    playerCurrEnd = 28;
                    playerOffset = 7;
                }
            }
        }
      }

      if(keys.current.w.isPressed == false && 
        keys.current.a.isPressed == false && 
        keys.current.s.isPressed == false && 
        keys.current.d.isPressed == false)
      {
        isMovingRef.current = false;
      }

      requestAnimationFrame(animation);
    };

    function introAnimation(){
      c.fillStyle = 'white';
      c.fillRect(0,0,canvas.width,canvas.height)
      c.drawImage(intro, canvas.width*0.15, canvas.height*0.15, canvas.width*0.7, canvas.width*0.7*0.46)
      requestAnimationFrame(introAnimation);
    }

    animationRef.current = requestAnimationFrame(animation);

    const startGame = ()=>{
      console.log('start');
      requestAnimationFrame(introAnimation);
      window.addEventListener('click', ()=>{
        cancelAnimationFrame(introAnimation);
        requestAnimationFrame(animation);
        setIsStartGame(true)
      }, {once: true});
    }

    let imagesLoaded = 0;
    function checkAllLoaded() {
      imagesLoaded++;
      if (imagesLoaded === 4) {
        startGame;
      }
    }

    intro.onload = startGame;
  
    function handleKeyDown(e) {
        if (isSnakeActiveRef.current) return;
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') {
            keys.current.w.isPressed = true;
            isMovingRef.current = true;
            lastDirectionRef.current = 'up';
        }
        else if(key === 's' || key === 'arrowdown') {
            keys.current.s.isPressed = true;
            isMovingRef.current = true;
            lastDirectionRef.current = 'down';
        }
        else if(key === 'a' || key === 'arrowleft') {
            keys.current.a.isPressed = true;
            isMovingRef.current = true;
            lastDirectionRef.current = 'left';
        }
        else if(key === 'd' || key === 'arrowright') {
            keys.current.d.isPressed = true;
            isMovingRef.current = true;
            lastDirectionRef.current = 'right';
        }
        else if(key === 'shift'){
          if (speed.current !== 6) {
            speed.current = 6;
            sprintInterval.current = 50;
            startSprint();
          }
        }
    }

    function handleKeyUp(e) {
        if (isSnakeActiveRef.current) return;
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') keys.current.w.isPressed = false;
        if(key === 's' || key === 'arrowdown') keys.current.s.isPressed = false;
        if(key === 'a' || key === 'arrowleft') keys.current.a.isPressed = false;
        if(key === 'd' || key === 'arrowright') keys.current.d.isPressed = false;
        if(key === 'shift') {
          if (speed.current !== 3) {
            speed.current = 3;
            sprintInterval.current = 100;
            startSprint();
          }
        }

        if (keys.current.w.isPressed) lastDirectionRef.current = 'up';
        else if (keys.current.s.isPressed) lastDirectionRef.current = 'down';
        else if (keys.current.a.isPressed) lastDirectionRef.current = 'left';
        else if (keys.current.d.isPressed) lastDirectionRef.current = 'right';
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    
    
    return () => {
      clearInterval(idleInterval);
      clearInterval(movingInterval.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(()=>{
    dispatch({type: 'changeHour'});
  }, [info.time.hour])

  return (
    <div>
      <canvas ref={canvasRef} id="game" style={{ display: 'block', background: '#A6B04F' }} />
      {isStartGame && (
        <div>
          <div id='coinDisplay'>
            <img src={icons.coin} alt="Coin" />
            <p>{info.coin}</p>
          </div>
          <Info 
            data = {data.name} 
            time = {info.time} 
            update = {dispatch} 
            isFastFoward = {info.isFastFoward}
          />
          <StatusBar 
            value = {info.status} 
            time = {info.time}
          />
          <Inventory 
            itemIndex = {itemIndexRef.current} 
            restartIndex = {buyItem} 
            update = {dispatch}
          />
          {(canSleep || canBath || canDodge || canEat || canSnake) && 
            <Buttons 
              action = {action} 
              update = {dispatch} 
              buyItem = {buyItem} 
              info = {info}
              setIsSnakeActive = {updateSnakeActive}/>
          }
          <Navigator onMove={handleNavigatorMove}/>
        </div>
      )}
    </div>
  );
};

export default Game;
