const images = {
    bg: {
        source: import.meta.env.BASE_URL + '/menuAsset/menubg.png',
    },
    startButton:{
        source: import.meta.env.BASE_URL + '/menuAsset/startb.png',

    },
    leftArrow: {
        source: import.meta.env.BASE_URL + '/menuAsset/arrowkiri.png',
    },
    rightArrow: {
        source: import.meta.env.BASE_URL + '/menuAsset/arrowkanan.png',
    },
    characters: {
        source: [
            import.meta.env.BASE_URL + '/menuAsset/player1.png',   
            import.meta.env.BASE_URL + '/menuAsset/player2.png',
            import.meta.env.BASE_URL + '/menuAsset/player3.png'
        ],
    }
}

export default images;