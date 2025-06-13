import React from "react";
import { useState } from "react";
import Home from "./components/pages/home.jsx";
import Game from "./components/pages/game.jsx";

const App = props => {
    const [startGame, setStartGame] = useState(false);
    const [data, setData] = useState({name: '', char: 1});

    const nextPage = (name, count) => {
        setData({name: name, char: count});
        setStartGame(true);
    };

    function restartGame (){
        console.log('restartGame');
        setStartGame(false);
        setData({name: null, char: 1});
    }

    return (
        <>
            {startGame ? (
                <Game data={data} restartGame = {restartGame} />
            ) : (
                <Home onSubmit={nextPage} />
            )}
        </>
    );
};

export default App;