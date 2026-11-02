import React, { useRef, useEffect, useState, useCallback } from "react";
import Icon from "../../assets/iconAsset.js";

const COLS = 20;
const ROWS = 20;
const COST = 50;
const COINS_PER_APPLE = 10;
const BASE_TICK = 140; // ms per step at score 0
const MIN_TICK = 65;   // speed cap
const BEST_KEY = 'wemen-snake-best';

const DIRS = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
};
const KEY_TO_DIR = {
    w: 'up', W: 'up', ArrowUp: 'up',
    s: 'down', S: 'down', ArrowDown: 'down',
    a: 'left', A: 'left', ArrowLeft: 'left',
    d: 'right', D: 'right', ArrowRight: 'right',
};

const readBest = () => {
    try { return Number(localStorage.getItem(BEST_KEY)) || 0; } catch { return 0; }
};
const writeBest = (v) => {
    try { localStorage.setItem(BEST_KEY, String(v)); } catch { /* storage unavailable */ }
};

const tickFor = (score) => Math.max(MIN_TICK, BASE_TICK - score * 4);

function freshState() {
    const snake = [{ x: 7, y: 10 }, { x: 6, y: 10 }, { x: 5, y: 10 }];
    return {
        snake,
        prevSnake: snake.map(p => ({ ...p })),
        dir: DIRS.right,
        queue: [],
        apple: { x: 14, y: 10 },
        score: 0,
        acc: 0,
        particles: [],
        popups: [],
        dead: false,
    };
}

function randomFreeCell(snake) {
    const taken = new Set(snake.map(p => p.y * COLS + p.x));
    const free = [];
    for (let i = 0; i < COLS * ROWS; i++) if (!taken.has(i)) free.push(i);
    const idx = free[Math.floor(Math.random() * free.length)];
    return { x: idx % COLS, y: Math.floor(idx / COLS) };
}

const lerp = (a, b, t) => a + (b - a) * t;

export default function SnakeGame(prop) {
    const canvasRef = useRef(null);
    const boardRef = useRef(null);
    const game = useRef(freshState());
    const phaseRef = useRef('ready');
    const rafRef = useRef();
    const lastRef = useRef(0);
    const sizeRef = useRef({ px: 0, dpr: 1 });
    const appleImg = useRef(null);
    const touchStart = useRef(null);

    // ready | playing | paused | over
    const [phase, setPhaseState] = useState('ready');
    const [score, setScore] = useState(0);
    const [best, setBest] = useState(readBest);
    const [newBest, setNewBest] = useState(false);
    const [shake, setShake] = useState(false);
    const [coins, setCoins] = useState(prop.coin ?? COST);

    const setPhase = (p) => {
        phaseRef.current = p;
        setPhaseState(p);
    };

    const queueDir = useCallback((name) => {
        const g = game.current;
        if (phaseRef.current === 'ready') startGame();
        if (phaseRef.current !== 'playing') return;
        const next = DIRS[name];
        const last = g.queue.length ? g.queue[g.queue.length - 1] : g.dir;
        // Ignore no-ops and 180° turns, checked against the last queued move
        if (next === last || (next.x === -last.x && next.y === -last.y)) return;
        if (g.queue.length < 3) g.queue.push(next);
    }, []);

    function startGame() {
        game.current = freshState();
        game.current.apple = randomFreeCell(game.current.snake);
        setScore(0);
        setNewBest(false);
        lastRef.current = performance.now();
        setPhase('playing');
    }

    const togglePause = () => {
        if (phaseRef.current === 'playing') setPhase('paused');
        else if (phaseRef.current === 'paused') {
            lastRef.current = performance.now();
            setPhase('playing');
        }
    };

    // Settle this run's coins with the main game
    const settle = () => {
        prop.update({ type: 'playSnake', score: game.current.score });
        return coins + game.current.score * COINS_PER_APPLE - COST;
    };

    const exitToMap = () => {
        if (phaseRef.current === 'over') settle();
        prop.setIsSnakeActive(false);
    };

    const playAgain = () => {
        setCoins(settle());
        startGame();
    };

    function step() {
        const g = game.current;
        if (g.queue.length) g.dir = g.queue.shift();
        const head = g.snake[0];
        const newHead = { x: head.x + g.dir.x, y: head.y + g.dir.y };
        const eating = newHead.x === g.apple.x && newHead.y === g.apple.y;
        // The tail moves away this tick unless we grow, so it's not a collision
        const body = eating ? g.snake : g.snake.slice(0, -1);
        const hitWall = newHead.x < 0 || newHead.x >= COLS || newHead.y < 0 || newHead.y >= ROWS;
        const hitSelf = body.some(p => p.x === newHead.x && p.y === newHead.y);

        if (hitWall || hitSelf) {
            g.dead = true;
            g.prevSnake = g.snake.map(p => ({ ...p }));
            setShake(true);
            setPhase('over');
            if (navigator.vibrate) navigator.vibrate(120);
            if (g.score > readBest()) {
                writeBest(g.score);
                setBest(g.score);
                setNewBest(true);
            }
            return;
        }

        g.prevSnake = g.snake.map(p => ({ ...p }));
        if (eating) {
            g.prevSnake.push({ ...g.prevSnake[g.prevSnake.length - 1] });
            g.snake = [newHead, ...g.snake];
            g.score++;
            setScore(g.score);
            for (let i = 0; i < 10; i++) {
                const a = Math.random() * Math.PI * 2;
                const s = 0.04 + Math.random() * 0.08;
                g.particles.push({ x: g.apple.x + 0.5, y: g.apple.y + 0.5, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 });
            }
            g.popups.push({ x: g.apple.x + 0.5, y: g.apple.y, life: 1 });
            if (g.snake.length < COLS * ROWS) g.apple = randomFreeCell(g.snake);
        } else {
            g.snake = [newHead, ...g.snake.slice(0, -1)];
        }
    }

    function draw(t, alpha) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const c = canvas.getContext('2d');
        const { px, dpr } = sizeRef.current;
        if (!px) return;
        const cell = px / COLS;
        const g = game.current;
        c.setTransform(dpr, 0, 0, dpr, 0, 0);

        // Checkerboard
        for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
                c.fillStyle = (x + y) % 2 ? '#2b4f26' : '#305a2a';
                c.fillRect(x * cell, y * cell, cell + 0.5, cell + 0.5);
            }
        }

        // Apple with a gentle bob
        const bob = 1 + Math.sin(t / 220) * 0.08;
        const as = cell * bob;
        const ax = g.apple.x * cell + (cell - as) / 2;
        const ay = g.apple.y * cell + (cell - as) / 2;
        c.fillStyle = 'rgba(0,0,0,0.25)';
        c.beginPath();
        c.ellipse(g.apple.x * cell + cell / 2, g.apple.y * cell + cell * 0.9, cell * 0.32, cell * 0.1, 0, 0, Math.PI * 2);
        c.fill();
        if (appleImg.current && appleImg.current.complete) {
            c.imageSmoothingEnabled = false;
            c.drawImage(appleImg.current, ax, ay, as, as);
        } else {
            c.fillStyle = '#d33';
            c.fillRect(ax, ay, as, as);
        }

        // Snake, interpolated between the previous and current step
        const a = g.dead ? 1 : alpha;
        const n = g.snake.length;
        const pts = g.snake.map((p, i) => {
            const q = g.prevSnake[i] || p;
            return { x: lerp(q.x, p.x, a), y: lerp(q.y, p.y, a) };
        });
        for (let i = n - 1; i >= 0; i--) {
            const p = pts[i];
            const k = n > 1 ? i / (n - 1) : 0;
            const pad = cell * (0.06 + k * 0.1);
            const light = Math.round(lerp(62, 38, k));
            c.fillStyle = g.dead ? `hsl(0, 45%, ${light}%)` : `hsl(${lerp(96, 110, k)}, 62%, ${light}%)`;
            roundRect(c, p.x * cell + pad, p.y * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.3);
            // Bridge to the next segment so the body looks continuous
            if (i < n - 1) {
                const nx = pts[i + 1];
                const mx = (p.x + nx.x) / 2, my = (p.y + nx.y) / 2;
                roundRect(c, mx * cell + pad, my * cell + pad, cell - pad * 2, cell - pad * 2, cell * 0.25);
            }
        }

        // Eyes look where the snake is heading
        const h = pts[0];
        const d = g.queue[0] && !g.dead ? g.queue[0] : g.dir;
        const cx = h.x * cell + cell / 2, cy = h.y * cell + cell / 2;
        const ex = -d.y, ey = d.x; // perpendicular
        const eo = cell * 0.2, ef = cell * 0.12;
        [1, -1].forEach(sgn => {
            const x = cx + ex * eo * sgn + d.x * ef;
            const y = cy + ey * eo * sgn + d.y * ef;
            c.fillStyle = '#fff';
            c.beginPath(); c.arc(x, y, cell * 0.12, 0, Math.PI * 2); c.fill();
            c.fillStyle = '#111';
            if (g.dead) {
                c.fillRect(x - cell * 0.08, y - cell * 0.015, cell * 0.16, cell * 0.03);
            } else {
                c.beginPath(); c.arc(x + d.x * cell * 0.04, y + d.y * cell * 0.04, cell * 0.06, 0, Math.PI * 2); c.fill();
            }
        });

        // Particles and "+10" popups
        g.particles.forEach(pt => {
            c.globalAlpha = Math.max(0, pt.life);
            c.fillStyle = '#ffd34d';
            c.fillRect(pt.x * cell - cell * 0.08, pt.y * cell - cell * 0.08, cell * 0.16, cell * 0.16);
        });
        c.font = `bold ${Math.max(10, cell * 0.7)}px 'Courier Prime', monospace`;
        c.textAlign = 'center';
        g.popups.forEach(pp => {
            c.globalAlpha = Math.max(0, pp.life);
            c.fillStyle = '#ffe27a';
            c.fillText(`+${COINS_PER_APPLE}`, pp.x * cell, (pp.y - (1 - pp.life) * 1.5) * cell);
        });
        c.globalAlpha = 1;
    }

    function roundRect(c, x, y, w, h, r) {
        c.beginPath();
        c.roundRect ? c.roundRect(x, y, w, h, r) : c.rect(x, y, w, h);
        c.fill();
    }

    // Main loop: fixed-step logic, interpolated rendering
    useEffect(() => {
        const loop = (now) => {
            const g = game.current;
            const dt = Math.min(100, now - (lastRef.current || now));
            lastRef.current = now;
            const tick = tickFor(g.score);
            if (phaseRef.current === 'playing') {
                g.acc += dt;
                while (g.acc >= tick && phaseRef.current === 'playing') {
                    g.acc -= tick;
                    step();
                }
            }
            const frames = dt / 16.7;
            g.particles = g.particles.filter(p => {
                p.x += p.vx * frames; p.y += p.vy * frames; p.life -= 0.04 * frames;
                return p.life > 0;
            });
            g.popups = g.popups.filter(p => (p.life -= 0.025 * frames) > 0);
            draw(now, phaseRef.current === 'playing' ? Math.min(1, g.acc / tick) : 1);
            rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
        return () => cancelAnimationFrame(rafRef.current);
    }, []);

    // Crisp canvas at any size / pixel ratio
    useEffect(() => {
        const img = new Image();
        img.src = Icon.snake.apple;
        appleImg.current = img;

        const board = boardRef.current;
        const resize = () => {
            const px = board.clientWidth;
            const dpr = Math.min(window.devicePixelRatio || 1, 2);
            const canvas = canvasRef.current;
            canvas.width = Math.round(px * dpr);
            canvas.height = Math.round(px * dpr);
            sizeRef.current = { px, dpr };
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(board);
        return () => ro.disconnect();
    }, []);

    // Keyboard
    useEffect(() => {
        const onKey = (e) => {
            const dir = KEY_TO_DIR[e.key];
            if (dir) {
                e.preventDefault();
                e.stopPropagation();
                queueDir(dir);
                return;
            }
            if (e.key === ' ' || e.key === 'p' || e.key === 'P') {
                e.preventDefault();
                if (phaseRef.current === 'ready') startGame();
                else togglePause();
            }
            if (e.key === 'Enter' && phaseRef.current === 'ready') startGame();
            if (e.key === 'Escape') {
                if (phaseRef.current === 'playing') togglePause();
                else if (phaseRef.current === 'ready') exitToMap();
            }
        };
        // Pause automatically if the tab loses focus
        const onBlur = () => { if (phaseRef.current === 'playing') setPhase('paused'); };
        const onNav = (e) => queueDir(e.detail);
        window.addEventListener('keydown', onKey, true);
        window.addEventListener('blur', onBlur);
        window.addEventListener('snake-navigator', onNav);
        return () => {
            window.removeEventListener('keydown', onKey, true);
            window.removeEventListener('blur', onBlur);
            window.removeEventListener('snake-navigator', onNav);
        };
    }, [coins]);

    // Swipe controls on the board
    const onPointerDown = (e) => {
        touchStart.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e) => {
        const s = touchStart.current;
        if (!s) return;
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        queueDir(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        touchStart.current = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => { touchStart.current = null; };

    const padPress = (dir) => (e) => { e.preventDefault(); queueDir(dir); };
    const earned = score * COINS_PER_APPLE;
    const net = earned - COST;
    const canReplay = coins + net >= COST;

    return (
        <div className="snake-modal" role="dialog" aria-modal="true" aria-label="Snake mini game">
            <div className="snake-shell">
                <div className="snake-bar">
                    <div className="chip" aria-label={`Score ${score}`}>
                        <img className="pixel" src={Icon.snake.apple} alt="" />
                        <span>{score}</span>
                    </div>
                    <div className="chip" aria-label={`Coins earned ${earned}`}>
                        <img className="pixel" src={Icon.coin} alt="" />
                        <span>+{earned}</span>
                    </div>
                    <span className="spacer" />
                    <span>Best {Math.max(best, score)}</span>
                    {(phase === 'playing' || phase === 'paused') && (
                        <button className="icon-btn" onClick={togglePause} aria-label={phase === 'paused' ? 'Resume' : 'Pause'}>
                            {phase === 'paused' ? '▶' : '❚❚'}
                        </button>
                    )}
                </div>

                <div
                    ref={boardRef}
                    className={`snake-board ${shake ? 'shake' : ''}`}
                    onAnimationEnd={() => setShake(false)}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                >
                    <canvas ref={canvasRef} />

                    {phase === 'ready' && (
                        <div className="snake-screen">
                            <div className="panel">
                                <h2>SNAKE</h2>
                                <p>Eat apples, avoid the walls and your own tail.</p>
                                <p>Each apple = {COINS_PER_APPLE} coins. Entry costs {COST}.</p>
                                <p>
                                    <span className="kbd">W</span><span className="kbd">A</span><span className="kbd">S</span><span className="kbd">D</span> / arrows / swipe
                                    {' '}· <span className="kbd">Space</span> pause
                                </p>
                                <p>The snake speeds up as it grows!</p>
                            </div>
                            <div className="actions">
                                <button className="wood-button" onClick={exitToMap}>Back</button>
                                <button className="wood-button primary" onClick={startGame} autoFocus>Start</button>
                            </div>
                        </div>
                    )}

                    {phase === 'paused' && (
                        <div className="snake-screen">
                            <div className="panel"><h2>PAUSED</h2><p>Press Space or ▶ to resume</p></div>
                            <div className="actions">
                                <button className="wood-button primary" onClick={togglePause} autoFocus>Resume</button>
                            </div>
                        </div>
                    )}

                    {phase === 'over' && (
                        <div className="snake-screen">
                            <img className="gameover-img pixel" src={Icon.snake.gameOver} alt="Game over" />
                            <div className="panel">
                                {newBest && <p style={{ color: '#2e6b1f' }}>New best score!</p>}
                                <p>Apples: {score} · Earned: {earned} coins</p>
                                <p style={{ color: net >= 0 ? '#2e6b1f' : '#8a1c1c' }}>
                                    Net: {net >= 0 ? '+' : ''}{net} coins
                                </p>
                            </div>
                            <div className="actions">
                                <button className="wood-button" onClick={playAgain} disabled={!canReplay}>
                                    Play again (-{COST})
                                </button>
                                <button className="wood-button primary" onClick={exitToMap} autoFocus>Collect</button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="snake-pad" aria-hidden="true">
                    <button className="up" onPointerDown={padPress('up')}>▲</button>
                    <button className="left" onPointerDown={padPress('left')}>◀</button>
                    <button className="down" onPointerDown={padPress('down')}>▼</button>
                    <button className="right" onPointerDown={padPress('right')}>▶</button>
                </div>
            </div>
        </div>
    );
}
