import React, { useRef, useEffect, useState, useReducer } from 'react';
import { collisions, map } from '../assets/map.js';
import { player1Images, player2Images, player3Images } from '../assets/player.js';
import icons from '../assets/iconAsset.js';
import Info from './game_components/info';
import StatusBar from './game_components/status'
import Buttons from './game_components/button';
import Inventory from './game_components/inventory.jsx';
import Navigator from './game_components/navigator.jsx';
import SnakeGame from './game_components/snake.jsx';

function reducer (info, action){
  let { greet, day, hour, minute } = info.time;
  let {energy, hunger, hygiene, mood } = info.status;
  let money = info.coin;
  let priceList = [80, 150, 250, 200];
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
      console.log ('dispatch index: ' + action.index);
      if (action.index >= 0)
        money -= priceList[action.index]
      return { ...info, coin: money};
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

const Game = (prop) => {
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
  const animationRef = useRef();
  const introAnimationRef = useRef();
  const endingAnimationRef = useRef();
  const isMovingRef = useRef(false);
  const lastDirectionRef = useRef('down');
  const playerRef = useRef(new window.Image());
  const playerCurrStartRef = useRef(0);
  const playerCurrEndRef = useRef(36);
  const playerOffsetRef = useRef(9);
  const playerIdleFramesRef = useRef(0);
  const playerMovingFramesRef = useRef(0);
  const charsRef = useRef((typeof prop.data.char === 'number' ? prop.data.char : 0) + 1);
  const playerIdleImgsRef = useRef([]);
  const playerRunImgsRef = useRef([]);
  const contextRef = useRef(null);
  const dayRef = useRef(new window.Image());
  const nightRef = useRef(new window.Image());
  const introRef = useRef(new window.Image());
  const gameOverRef = useRef(new window.Image());
  const [snakeGameKey, setSnakeGameKey] = useState(0);
  const [canBath, setCanBath] = useState(false);
  const [canSnake, setCanSnake] = useState(false);
  const [canDodge, setCanDodge] = useState(false);
  const [canEat, setCanEat] = useState(false);
  const [canSleep, setCanSleep] = useState(false);
  const prevFastFowardRef = useRef(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const dayModeRef = useRef(dayMode);
 
  useEffect(() => {
    isSnakeActiveRef.current = isSnakeActive;
  }, [isSnakeActive]);
  
  const TILE_SIZE = 64;
  
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
    coin: 100,
    isFastFoward: false
  })

  const itemIndexRef = useRef(-1);
  function buyItem(itemIndex){
    console.log ('index:' + itemIndex);
    itemIndexRef.current = itemIndex;
    dispatch({
      type: 'buyFood',
      index: itemIndex
    });
  }

  const updateSnakeActive = (val) => {
    setIsSnakeActive(val);
    isSnakeActiveRef.current = val;
    if (val) {
      prevFastFowardRef.current = info.isFastFoward;
      if(info.isFastFoward) dispatch({type: 'fastFoward'});
      setSnakeGameKey(prevKey => prevKey + 1);
    }
    if (!val) {
      if (prevFastFowardRef.current && !info.isFastFoward) dispatch({ type: 'fastFoward' });
      setAction(undefined);
      setCanSnake(false);
      keys.current.w.isPressed = false;
      keys.current.a.isPressed = false;
      keys.current.s.isPressed = false;
      keys.current.d.isPressed = false;
      isMovingRef.current = false;
      const OFFSET = 10;
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
          // Always exit to the right
          playerWorld.current.x = s.position.x + s.width + 9 + OFFSET;
          break;
        }
      }
    }
    if (animationRef.current) {
      requestAnimationFrame(animation);
    }

    requestAnimationFrame(animation);
  };

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
          playerMovingFramesRef.current = 0;
        }
      }
    }
  };

  function animation(now){
    if(!isStartGame) return;
    if(isSnakeActiveRef.current) return;
    if (isGameOver) return;
    
    const canvas = canvasRef.current;
    const c = contextRef.current;
    if (!c) {
      console.error('Canvas context is null');
      return;
    }
    console.log('animation running');
    const day = dayRef.current;
    const night = nightRef.current;
    const player = playerRef.current;
    if (isSnakeActiveRef.current) return;
    const delta = now - lastTime;
    lastTime = now;

    const cameraOffsetX = canvas.width / 2 - playerWorld.current.x;
    const cameraOffsetY = canvas.height / 2 - playerWorld.current.y;

    c.clearRect(0, 0, canvas.width, canvas.height);
    
    const mapImage = dayModeRef.current ? dayRef.current : nightRef.current;
    if (mapImage.complete && mapImage.naturalWidth !== 0) {
      c.drawImage(mapImage, cameraOffsetX, cameraOffsetY);
    }


    const chars = charsRef.current;
    const charIdx = chars - 1;
    const dir = lastDirectionRef.current;
    const dirKey = dir === 'up' ? 'U' : dir === 'down' ? 'D' : dir === 'left' ? 'L' : 'R';
    
    let playerImg;
    if (!isMovingRef.current) {
      playerImg = playerIdleImgsRef.current[charIdx][dirKey];
    } else {
      playerImg = playerRunImgsRef.current[charIdx][dirKey];
    }
    console.log('playerImg', playerImg.complete, playerImg.naturalWidth);

    const playerIdleFrames = playerIdleFramesRef.current;
    const playerMovingFrames = playerMovingFramesRef.current;
    let playerOffset = playerOffsetRef.current;
    
    if (playerImg.complete && playerImg.naturalWidth !== 0) {
      c.drawImage(
        playerImg,
        playerCurrStartRef.current,
        0,
        playerCurrEndRef.current,
        playerImg.height || 48,
        canvas.width/2 - playerOffsetRef.current,
        canvas.height/2 - (playerImg.height || 48)/2,
        playerCurrEndRef.current,
        playerImg.height || 48
      );
    }

    const playerBox = {
      left: playerWorld.current.x - playerOffset,
      right: playerWorld.current.x - playerOffset + 36,
      top: playerWorld.current.y - (player.height || 48) / 2,
      bottom: playerWorld.current.y - (player.height || 48) / 2 + (player.height || 48)
    };

    let localCanBath = false;
    let localCanSnake = false;
    let localCanDodge = false;
    let localCanEat = false;
    let localCanSleep = false;

    for(let i = 0; i < bath.length; i++){
      const bathDetect = bath[i];
      if(
        playerBox.right > bathDetect.position.x &&
        playerBox.left < bathDetect.position.x + bathDetect.width &&
        playerBox.top < bathDetect.position.y + bathDetect.height &&
        playerBox.bottom > bathDetect.position.y
      ){
        localCanBath = true;
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
        localCanSnake = true;
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
        localCanDodge = true;
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
        localCanEat = true;
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
        localCanSleep = true;
        break;
      }
    }

    setCanBath(localCanBath);
    setCanSnake(localCanSnake);
    setCanDodge(localCanDodge);
    setCanEat(localCanEat);
    setCanSleep(localCanSleep);


    if (canSleep){
      setAction("sleep");
    }
    else if(canEat){
      setAction("eat");
    }
    else if (canBath){
      setAction('bath');
    }
    else if (canSnake && !isSnakeActiveRef.current) {
      currentAction = "snake";
    }
    else {
      setAction(null);
    }

    if(!isMovingRef.current){
      if(lastDirectionRef.current == 'up'){
          if(chars == 1){
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 104;
                  playerCurrEndRef.current = 40;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 2){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 104;
                  playerCurrEndRef.current = 40;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 3){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 32;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 64;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 96;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
          }
      }
      else if(lastDirectionRef.current == 'down'){
          if(chars == 1){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 104;
                  playerCurrEndRef.current = 40;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 2){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 104;
                  playerCurrEndRef.current = 40;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 3){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 32;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 64;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 96;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
          }
      }
      else if(lastDirectionRef.current == 'left'){
          if(chars == 1){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 32;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 60;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 92;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 2){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 32;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 60;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 92;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
          }else if(chars == 3){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 28;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 56;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 84;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 11;
              }
          }
      }
      else if(lastDirectionRef.current == 'right'){
          if (chars == 1){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 96;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
          }else if (chars == 2){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 36;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 68;
                  playerCurrEndRef.current = 28 ;
                  playerOffsetRef.current = 7;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 96;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
          }else if (chars == 3){
              
              if(playerIdleFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 11;
              }
              else if (playerIdleFrames == 1){
                  playerCurrStartRef.current = 32;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 2){
                  playerCurrStartRef.current = 60;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
              }
              else if (playerIdleFrames == 3){
                  playerCurrStartRef.current = 88;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 9;
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

            playerMovingFramesRef.current = 0;

            if (lastDirectionRef.current === 'up') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              }
            } else if (lastDirectionRef.current === 'down') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              }
            } else if (lastDirectionRef.current === 'left') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              }
            } else if (lastDirectionRef.current === 'right') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 150;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              } else if (chars === 3) {
                playerCurrStartRef.current = 152;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              }
            }
            break;
          }
        }
        if(isMovingRef.current){
            playerWorld.current.y -= speed.current * (delta / 16.67);
        }
        if(chars == 1){
          if(playerMovingFrames == 0){
            playerCurrStartRef.current = 0;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 1){
            playerCurrStartRef.current = 34;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 12;
          }
          else if(playerMovingFrames == 2){
            playerCurrStartRef.current = 68;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 3){
            playerCurrStartRef.current = 102;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
          }
          else if (playerMovingFrames == 4){
            playerCurrStartRef.current = 136;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 8;
          }
          else if (playerMovingFrames == 5){
            playerCurrStartRef.current = 170;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
          }
        }else if(chars == 2){
          if(playerMovingFrames == 0){
            playerCurrStartRef.current = 0;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 1){
            playerCurrStartRef.current = 34;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 12;
          }
          else if(playerMovingFrames == 2){
            playerCurrStartRef.current = 68;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 3){
            playerCurrStartRef.current = 102;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
          }
          else if (playerMovingFrames == 4){
            playerCurrStartRef.current = 136;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 8;
          }
          else if (playerMovingFrames == 5){
            playerCurrStartRef.current = 170;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
          }
        }
        else if(chars == 3){
          if(playerMovingFrames == 0){
            playerCurrStartRef.current = 0;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 1){
            playerCurrStartRef.current = 34;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 12;
          }
          else if(playerMovingFrames == 2){
            playerCurrStartRef.current = 68;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 11;
          }
          else if(playerMovingFrames == 3){
            playerCurrStartRef.current = 102;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
          }
          else if (playerMovingFrames == 4){
            playerCurrStartRef.current = 136;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 8;
          }
          else if (playerMovingFrames == 5){
            playerCurrStartRef.current = 170;
            playerCurrEndRef.current = 34;
            playerOffsetRef.current = 9;
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

            playerMovingFramesRef.current = 0;

            if (lastDirectionRef.current === 'up') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              }
            } else if (lastDirectionRef.current === 'down') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              }
            } else if (lastDirectionRef.current === 'left') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              }
            } else if (lastDirectionRef.current === 'right') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 150;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              } else if (chars === 3) {
                playerCurrStartRef.current = 152;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              }
            }
            break;
          }
        }
        if(isMovingRef.current){
              playerWorld.current.y += speed.current * (delta / 16.67);
        }
        if(chars == 1){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 30;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 62; 
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 92;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 124;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 156;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
          }else if(chars == 2){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 30;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 62; 
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 92;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 124;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 156;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
          }else if(chars == 3){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 30;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 62; 
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 92;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 124;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 156;
                  playerCurrEndRef.current = 32;
                  playerOffsetRef.current = 9;
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

            playerMovingFramesRef.current = 0;

            if (lastDirectionRef.current === 'up') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              }
            } else if (lastDirectionRef.current === 'down') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              }
            } else if (lastDirectionRef.current === 'left') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              }
            } else if (lastDirectionRef.current === 'right') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 150;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              } else if (chars === 3) {
                playerCurrStartRef.current = 152;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              }
            }
            break;
          }
        }
        if(isMovingRef.current){
              playerWorld.current.x -= speed.current * (delta / 16.67);
        }
        
        if(chars == 1){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 7;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 24;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 54;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 90;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 120;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 148;
                  playerCurrEndRef.current = 26;
                  playerOffsetRef.current = 7;
              }
          }else if(chars == 2){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 7;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 24;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 54;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 90;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 120;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 148;
                  playerCurrEndRef.current = 26;
                  playerOffsetRef.current = 7;
              }
          }else if(chars == 3){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 7;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 24;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 54;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 90;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 120;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 148;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7; 
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

            playerMovingFramesRef.current = 0;

            if (lastDirectionRef.current === 'up') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 34;
                playerOffsetRef.current = 11;
              }
            } else if (lastDirectionRef.current === 'down') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 30;
                playerOffsetRef.current = 9;
              }
            } else if (lastDirectionRef.current === 'left') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              } else if (chars === 3) {
                playerCurrStartRef.current = 0;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 7;
              }
            } else if (lastDirectionRef.current === 'right') {
              if (chars === 1 || chars === 2) {
                playerCurrStartRef.current = 150;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              } else if (chars === 3) {
                playerCurrStartRef.current = 152;
                playerCurrEndRef.current = 24;
                playerOffsetRef.current = 5;
              }
            }
            break;
          }
        }
        if(isMovingRef.current){
              playerWorld.current.x += speed.current * (delta / 16.67);
        }
        
        if(chars == 1){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 150;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 5;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 120;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 84;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 54;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 26;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 26;
                  playerOffsetRef.current = 7;
              }
          }else if(chars == 2){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 150;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 5;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 120;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 84;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 54;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 26;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 26;
                  playerOffsetRef.current = 7;
              }
          }else if(chars == 3){
  
              if(playerMovingFrames == 0){
                  playerCurrStartRef.current = 152;
                  playerCurrEndRef.current = 24;
                  playerOffsetRef.current = 5;
              }
              else if(playerMovingFrames == 1){
                  playerCurrStartRef.current = 122;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if(playerMovingFrames == 2){
                  playerCurrStartRef.current = 86;
                  playerCurrEndRef.current = 36;
                  playerOffsetRef.current = 11;
              }
              else if(playerMovingFrames == 3){
                  playerCurrStartRef.current = 56;
                  playerCurrEndRef.current = 30;
                  playerOffsetRef.current = 9;
              }
              else if (playerMovingFrames == 4){
                  playerCurrStartRef.current = 28;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
              }
              else if (playerMovingFrames == 5){
                  playerCurrStartRef.current = 0;
                  playerCurrEndRef.current = 28;
                  playerOffsetRef.current = 7;
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

    animationRef.current = requestAnimationFrame(animation);
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

    const allImages = [
      dayRef.current,
      nightRef.current,
      introRef.current,
      gameOverRef.current,
      playerRef.current,
      // Idle
      playerIdleImgs[0].U, playerIdleImgs[0].D, playerIdleImgs[0].L, playerIdleImgs[0].R,
      playerIdleImgs[1].U, playerIdleImgs[1].D, playerIdleImgs[1].L, playerIdleImgs[1].R,
      playerIdleImgs[2].U, playerIdleImgs[2].D, playerIdleImgs[2].L, playerIdleImgs[2].R,
      // Run
      playerRunImgs[0].U, playerRunImgs[0].D, playerRunImgs[0].L, playerRunImgs[0].R,
      playerRunImgs[1].U, playerRunImgs[1].D, playerRunImgs[1].L, playerRunImgs[1].R,
      playerRunImgs[2].U, playerRunImgs[2].D, playerRunImgs[2].L, playerRunImgs[2].R,
    ];

    let imagesLoaded = 0;
    const totalImages = allImages.length;

    function checkAllLoaded() {
      imagesLoaded++;
      console.log('Image loaded', imagesLoaded);
      tryStartGame();
    }

    allImages.forEach(img => {
      img.onload = checkAllLoaded;
    });

    dayRef.current.src = map.day.source;
    nightRef.current.src = map.night.source;
    introRef.current.src = icons.intro;
    gameOverRef.current.src = icons.gameOver
    playerRef.current.src = player1Images.idle.D;
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

    playerIdleImgsRef.current = playerIdleImgs;
    playerRunImgsRef.current = playerRunImgs;

    playerCurrStartRef.current = 0;
    playerCurrEndRef.current = 36;
    playerOffsetRef.current = 9;
    playerIdleFramesRef.current = 0;
    playerMovingFramesRef.current = 0;
    charsRef.current = (typeof prop.data.char === 'number' ? prop.data.char : 0) + 1;

    let userClicked = false;

    function tryStartGame() {
      console.log('tryStartGame', { userClicked, imagesLoaded });
      if (userClicked && imagesLoaded === totalImages) {
        console.log('Calling startGame');
        startGame();
      }
    }

    function onUserClick() {
      userClicked = true;
      console.log('User clicked');
      tryStartGame();
    }

    dayRef.current.onload = checkAllLoaded;
    nightRef.current.onload = checkAllLoaded;
    playerRef.current.onload = checkAllLoaded;
    gameOverRef.current.onload = checkAllLoaded;
    introRef.current.onload = () => {
      checkAllLoaded();
      introAnimationRef.current = requestAnimationFrame(introAnimation);
      window.addEventListener('click', onUserClick, { once: true });
    };

    introRef.current.src = icons.intro;
    gameOverRef.current.src = icons.gameOver;
    playerRef.current.src = player1Images.idle.D;

    if (dayRef.current.complete) checkAllLoaded();
    if (nightRef.current.complete) checkAllLoaded();
    if (playerRef.current.complete) checkAllLoaded();
    if (gameOverRef.current.complete) checkAllLoaded();
    if (introRef.current.complete) {
      checkAllLoaded();
      introAnimationRef.current = requestAnimationFrame(introAnimation);
      window.addEventListener('click', onUserClick, { once: true });
    }

    
    function resizeCanvas() {
      const canvas = canvasRef.current;
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
    
    const canvas = canvasRef.current;
    if (canvas) {
      contextRef.current = canvas.getContext('2d');
    }

    let idleInterval;
    
    idleInterval = setInterval(() => {
        playerIdleFramesRef.current = (playerIdleFramesRef.current + 1) % 4;
    }, 150);

    function introAnimation(){
      const canvas = canvasRef.current;
      const c = contextRef.current;
      const intro = introRef.current;
      c.fillStyle = '#A6B04F';
      c.fillRect(0,0,canvas.width,canvas.height)
      c.drawImage(intro, canvas.width*0.15, canvas.height*0.15, canvas.width*0.7, canvas.width*0.7*0.46)
      introAnimationRef.current = requestAnimationFrame(introAnimation);
    }

    function startGame() {
      console.log('startGame called');
      const canvas = canvasRef.current;
      const c = contextRef.current;
      if (introAnimationRef.current) {
        cancelAnimationFrame(introAnimationRef.current);
        introAnimationRef.current = null;
      }
      c.clearRect(0, 0, canvas.width, canvas.height);
      setIsStartGame(true);
    }
  
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
    }

    function handleKeyUp(e) {
        if (isSnakeActiveRef.current) return;
        const key = e.key.toLowerCase();
        if(key === 'w' || key === 'arrowup') keys.current.w.isPressed = false;
        if(key === 's' || key === 'arrowdown') keys.current.s.isPressed = false;
        if(key === 'a' || key === 'arrowleft') keys.current.a.isPressed = false;
        if(key === 'd' || key === 'arrowright') keys.current.d.isPressed = false;

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

  useEffect(() => {
    dayModeRef.current = dayMode;
  }, [dayMode]);

  useEffect(() => {
    if (info.time.hour >= 18 || info.time.hour < 6) {
      setDayMode(false);
      console.log('Night mode');
    } else {
      setDayMode(true);
    }
  }, [info.time.hour]);

  useEffect(() => {
    if (info.isFastFoward) {
      speed.current = 6;
      sprintInterval.current = 50;
    } else {
      speed.current = 3;
      sprintInterval.current = 100;
    }
    if (movingInterval.current) clearInterval(movingInterval.current);
    movingInterval.current = setInterval(() => {
      playerMovingFramesRef.current = (playerMovingFramesRef.current + 1) % 6;
    }, sprintInterval.current);
  }, [info.isFastFoward]);

  useEffect(() => {
    if (isStartGame) {
      animationRef.current = requestAnimationFrame(animation);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isStartGame]);

  useEffect(()=>{
    dispatch({type: 'changeHour'});
  }, [info.time.hour])

  function endingAnimation (){
    const canvas = canvasRef.current;
    const c = contextRef.current;
    const gameOverImage = gameOverRef.current;
    let x = canvas.width*0.1;
    let y;
    const score = info.time.day*100 + info.coin*5;
    if (canvas.width > 400) y = canvas.height*0.4;
    else y = canvas.height*0.45;
    c.drawImage(gameOverImage, x, y, canvas.width*0.8, canvas.width*0.8*0.12);
    c.fillStyle = '#3b2216';
    c.font = '30px monospace';
    c.fillText ("Score: " + score,  550, 30);
    endingAnimationRef.current = requestAnimationFrame(endingAnimation);
  }

  useEffect(()=>{
    if (info.status.energy == 0 ||
        info.status.hunger == 0 ||
        info.status.hygiene == 0 ||
        info.status.mood == 0 || 
        info.time.day == 10
    ){
      setIsGameOver(true);
      if(animationRef.current){
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setCanBath(false);
      setCanDodge(false);
      setCanEat(false);
      setCanSleep(false);
      setCanSnake(false);
      console.log('load ending');
      endingAnimationRef.current = requestAnimationFrame(endingAnimation);
    }
  }, [info.status])

  let currentAction = null;
  if (canSleep) currentAction = "sleep";
  else if (canEat) currentAction = "eat";
  else if (canBath) currentAction = "bath";
  else if (canSnake && !isSnakeActiveRef.current) currentAction = "snake";

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas ref={canvasRef} id="game" style={{ display: 'block', background: '#A6B04F'}} />
      {isStartGame && (
        <div>
          <div id='coinDisplay'>
            <img src={icons.coin} alt="Coin" />
            <p>{info.coin}</p>
          </div>
          <Info 
            data = {prop.data.name} 
            time = {info.time} 
            update = {dispatch} 
            isFastFoward = {info.isFastFoward}
            gameOver = {isGameOver}
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
          {(canSleep || canBath || canDodge || canEat || canSnake || isGameOver) && 
            <Buttons 
              action = {currentAction} 
              update = {dispatch} 
              buyItem = {buyItem} 
              info = {info}
              setIsSnakeActive = {updateSnakeActive}
              canSleep={canSleep}
              canBath={canBath}
              canDodge={canDodge}
              canEat={canEat}
              canSnake={canSnake}
              gameOver = {isGameOver}
              restartGame = {prop.restartGame}
            />
          }
          <Navigator onMove={handleNavigatorMove}/>
        </div>
      )}
      {isSnakeActive && (
        <SnakeGame
          key={snakeGameKey}
          update={dispatch}
          setIsSnakeActive={updateSnakeActive}
        />
      )}
    </div>
  );
};

export default Game;
