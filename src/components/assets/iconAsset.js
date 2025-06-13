

const icons = {
    intro: import.meta.env.BASE_URL + "/gameAsset/icon/intro.png",
    sign: import.meta.env.BASE_URL + "/gameAsset/icon/sign.png",
    status:{
        energy:  import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/energy.png",
        hunger:  import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/food.png",
        hygiene:  import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/duck.png",
        mood: {
            happy: import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/happy.png",
            sad: import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/sad.png",
            neutral: import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/neutral.png"
        }
    },
    coin:import.meta.env.BASE_URL + "/gameAsset/icon/coin.png",
    foodMenu: import.meta.env.BASE_URL + "/gameAsset/icon/foodMenu.png",
    button:{
        sleep: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/sleepButton.png",
        bath: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/bathButton.png",
        play: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/playButton.png",
        buy: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/buyButton.png",
        restart: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/restartButton.png",
        fastFwrd1: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/fastFowr1.png",
        fastFwrd2: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/fastFowr2.png",
        restart: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/restartButton.png"
    },
    snake: {
        tutor: import.meta.env.BASE_URL + "/gameAsset/icon/snake/snakeTutor.png",
        info: import.meta.env.BASE_URL + "/gameAsset/icon/snake/snakeInfo.png",
        apple: import.meta.env.BASE_URL + "/gameAsset/icon/snake/apple.png",
        gameOver: import.meta.env.BASE_URL + "/gameAsset/icon/snake/snakeGameOver.png"
    },
    inventory:{
        bread:import.meta.env.BASE_URL + '/gameAsset/icon/inventory/bread.png',
        chicken: import.meta.env.BASE_URL + "/gameAsset/icon/statusBar/food.png",
        steak: import.meta.env.BASE_URL + '/gameAsset/icon/inventory/steak.png',
        drink: import.meta.env.BASE_URL + '/gameAsset/icon/inventory/drink.png',
        bag: import.meta.env.BASE_URL + '/gameAsset/icon/inventory/bag.png'
    },
    warning: {
        sleep: import.meta.env.BASE_URL + '/gameAsset/icon/noSleepSign.png',
        noMoney: import.meta.env.BASE_URL + '/gameAsset/icon/noMoneySign.png'
    },
    navigator: {
        up: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/up.png",
        down : import.meta.env.BASE_URL + "/gameAsset/icon/buttons/down.png",
        left: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/left.png",
        right: import.meta.env.BASE_URL + "/gameAsset/icon/buttons/right.png"
    },
    gameOver: import.meta.env.BASE_URL + '/gameAsset/icon/gameOver.png'
}

export default icons;