import React, { useEffect, useState } from "react";
import Icon from "../../assets/iconAsset.js";

export default function Inventory(prop) {
    const [items, setItems] = useState([
        {name: 'Bread', count: 0, source: Icon.inventory.bread},
        {name: 'Chicken', count: 0, source: Icon.inventory.chicken},
        {name: 'Steak', count: 0, source: Icon.inventory.steak},
        {name: 'Energy drink', count: 0, source:Icon.inventory.drink}
    ]);

    const handleItemClick = (index) => {
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
        prop.restartIndex(-1);
    };

    useEffect(()=>{
        console.log("calling")
        if (prop.itemIndex != -1)
            addItem(prop.itemIndex);
    }, [prop.itemIndex])

    return (
        <div id = 'inventory'>
        <div id = 'heading'>
            <img src={Icon.inventory.bag}/>
            Inventory
        </div>
            <ul style={{ listStyle: "none", padding: 0 }}>
                {
                    items.filter(item => item.count > 0).length === 0 ? (
                        <li style={{ opacity: 0.6, fontStyle: "italic" }}>No items</li>
                    ) : (
                        items.map((item, index) =>
                            item.count > 0 && (
                                <li
                                    key={index}
                                    onClick={() => handleItemClick(index)}
                                    style={{
                                        cursor: "pointer",
                                        padding: "0.3rem 0",
                                        borderBottom: "1px solid #444",
                                    }}
                                >
                                    <img src={item.source} />
                                    {item.name} x{item.count}
                                </li>
                            )
                        )
                    )
                }
            </ul>
        </div>
    );
}
