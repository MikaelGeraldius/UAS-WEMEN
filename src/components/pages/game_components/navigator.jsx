import React, {useState} from "react";
import Icon from "../../assets/iconAsset.js";

export default function Navigator ({onMove}){
    const handlePress = (dir) => (e) => {
        e.preventDefault();
        onMove && onMove(dir, true);
    };
    const handleRelease = (dir) => (e) => {
        e.preventDefault();
        onMove && onMove(dir, false);
    };

    return(
        <div id="navigator">
            <img 
                className="slot navImage slot-2" 
                src={Icon.navigator.up} 
                alt="" 
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                onMouseDown={handlePress('up')}
                onMouseUp={handleRelease('up')}
                onMouseLeave={handleRelease('up')}
                onTouchStart={handlePress('up')}
                onTouchEnd={handleRelease('up')}
                style={{ cursor: 'pointer' }}
            />
            <img 
                className="slot navImage slot-5" 
                src={Icon.navigator.down} 
                alt="" 
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                onMouseDown={handlePress('down')}
                onMouseUp={handleRelease('down')}
                onMouseLeave={handleRelease('down')}
                onTouchStart={handlePress('down')}
                onTouchEnd={handleRelease('down')}
                style={{ cursor: 'pointer' }}
            />
            <img 
                className="slot navImage slot-1" 
                src={Icon.navigator.left} 
                alt="" 
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                onMouseDown={handlePress('left')}
                onMouseUp={handleRelease('left')}
                onMouseLeave={handleRelease('left')}
                onTouchStart={handlePress('left')}
                onTouchEnd={handleRelease('left')}
                style={{ cursor: 'pointer' }}
            />
            <img 
                className="slot navImage slot-3" 
                src={Icon.navigator.right}
                alt="" 
                draggable={false}
                onContextMenu={e => e.preventDefault()}
                onMouseDown={handlePress('right')}
                onMouseUp={handleRelease('right')}
                onMouseLeave={handleRelease('right')}
                onTouchStart={handlePress('right')}
                onTouchEnd={handleRelease('right')}
                style={{ cursor: 'pointer' }}
            />
        </div>
    )
    
}