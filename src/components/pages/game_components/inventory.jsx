import React, { useEffect, useState } from "react";
import Icon from "../../assets/iconAsset.js";

export default function Inventory(prop) {
    const [items, setItems] = useState([
        {name: 'Bread', count: 0, source: Icon.inventory.bread},
        {name: 'Chicken', count: 0, source: Icon.inventory.chicken},
        {name: 'Steak', count: 0, source: Icon.inventory.steak},
        {name: 'Energy drink', count: 0, source:Icon.inventory.drink}
    ]);
    const [collapsed, setCollapsed] = useState(false);

    const handleItemClick = (index) => {
        if (items[index].count <= 0) return;
        setItems((prevItems) => {
            return prevItems.map((item, i) =>
                i === index && item.count > 0
                ? { ...item, count: item.count - 1 }
                : item
            );
        });
        prop.update({
            type:'eatFood',
            index: index
        })
    };

    const addItem = (index) => {
        setItems((prevItems) => {
            return prevItems.map((item, i) =>
                i === index
                ? { ...item, count: item.count + 1 }
                : item
            );
        });
        setCollapsed(false);
        prop.restartIndex(-1);
    };

    useEffect(()=>{
        if (prop.itemIndex != -1)
            addItem(prop.itemIndex);
    }, [prop.itemIndex])

    const owned = items.filter(item => item.count > 0);
    const total = owned.reduce((sum, item) => sum + item.count, 0);

    return (
        <div id='inventory' className={collapsed ? 'collapsed' : ''}>
            <button
                type="button"
                className='heading'
                aria-expanded={!collapsed}
                onClick={() => setCollapsed(c => !c)}
            >
                <img className="pixel" src={Icon.inventory.bag} alt="" />
                Inventory{collapsed && total > 0 ? ` (${total})` : ''}
                <span className="caret" aria-hidden="true">▾</span>
            </button>
            <ul>
                {owned.length === 0 ? (
                    <li className="empty">No items</li>
                ) : (
                    items.map((item, index) =>
                        item.count > 0 && (
                            <li key={index}>
                                <button type="button" onClick={() => handleItemClick(index)} title={`Eat ${item.name}`}>
                                    <img className="pixel" src={item.source} alt="" />
                                    <span>{item.name}</span>
                                    <span>x{item.count}</span>
                                </button>
                            </li>
                        )
                    )
                )}
            </ul>
        </div>
    );
}
