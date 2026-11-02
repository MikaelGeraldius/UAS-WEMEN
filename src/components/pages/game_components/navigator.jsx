import React, { useState } from "react";
import Icon from "../../assets/iconAsset.js";

const PADS = [
    { dir: 'up', slot: 'slot-2' },
    { dir: 'down', slot: 'slot-4' },
    { dir: 'left', slot: 'slot-1' },
    { dir: 'right', slot: 'slot-3' },
];

export default function Navigator ({onMove}){
    const [pressed, setPressed] = useState(null);

    const press = (dir) => (e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture?.(e.pointerId);
        setPressed(dir);
        onMove && onMove(dir, true);
    };
    const release = (dir) => (e) => {
        e.preventDefault();
        setPressed(p => (p === dir ? null : p));
        onMove && onMove(dir, false);
    };

    return(
        <div id="navigator" onContextMenu={e => e.preventDefault()}>
            {PADS.map(({dir, slot}) => (
                <img
                    key={dir}
                    className={`navImage pixel ${slot} ${pressed === dir ? 'pressed' : ''}`}
                    src={Icon.navigator[dir]}
                    alt={dir}
                    draggable={false}
                    onPointerDown={press(dir)}
                    onPointerUp={release(dir)}
                    onPointerCancel={release(dir)}
                    onLostPointerCapture={release(dir)}
                />
            ))}
        </div>
    )
}
