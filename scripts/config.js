
export const startBtnProps = {
    startString: 'START',
    pauseString: 'PAUSE'
};

export const canvasProps = {
    width: 900,
    height: 900
}

export const renderConfig = {
    // options: {
    //     width: 800,
    //     height: 800,
    //     wireframes: false,
    //     background: '#ff0000'
    // }
};

export const groundOptions = {
    isStatic: true
}

export const ballOptions = {
    restitution: 1, 
    render: {
        sprite: {
            // texture: './assets/ghost-freepik.png',
            xScale: 0.2,
            yScale: 0.2
        }
    },
    label: 'ball'
    // isSensor: true
}

export const sensorOptions = {
    restitution: 1, 
    render: {
        sprite: {
            // texture: './assets/ghost-freepik.png',
            xScale: 0.2,
            yScale: 0.2
        }
    },
    isSensor: true
}

// contains detials on scoreing
// "Tap" is a ghost hit
// "Score" is if a ghost is knocked down
export const scoreData = {
    scoreBasis: 20, // number of points to award per each second of time left in game
    rufusScoreBasis: 150, // for each Rufus ghost banished
    rufusTapBasis: 25,
    
    twinkoScoreBasis: 300, // for each Twinko ghost banished
    twinkoTapBasis: 50,

    drakoScoreBasis: 600, // for each Drako ghost banished
    drakoTapBasis: 100,
    
    perLevelBonus: 70, // for each level won (i.e.: level 2 will award 2 x 50 points)
    livesLeftBonus: 100 // for each life remaining after level won 
}

export const ghostTypes = [
    {   name: 'Rufus',
        pngPath: './assets/ghost-freepik.png',
        svgPath: './assets/ghost-freepik-inkscape-svg.svg',
        difficulty: 'easy',
        perTapPoints: scoreData.rufusTapBasis,
        points: scoreData.rufusScoreBasis // points for defeating this ghost
    },
    {
        name: 'Twinko',
        pngPath: './assets/ghost-freepik-yellow.png',
        svgPath: './assets/ghost-freepik-inkscape-svg.svg',
        difficulty: 'mid',
        perTapPoints: scoreData.twinkoTapBasis,
        points: scoreData.twinkoScoreBasis // points for defeating this ghost
    },
    {
        name: 'Drako',
        pngPath: './assets/ghost-freepik-green.png',
        svgPath: './assets/ghost-freepik-inkscape-svg.svg',
        difficulty: 'hard',
        perTapPoints: scoreData.drakoTapBasis,
        points: scoreData.drakoScoreBasis // points for defeating this ghost
    }
]

//  Define different movement modes for game objects
//  Easing method and types are for GSAP motion library use: https://greensock.com/docs/v3/Eases
export const moveModes = [{
    id: 1,
    movement: 'xLimitsAlternate',  // shuffle horizontally from edge to edge of screen width,
    easing: 'power1',   // movement easing method
    type: 'inOut'   // movement easing type
},
{
    id: 2,
    movement: 'sinosodalSmall',  // moves horizontally in a low amplitude sinusodal pattern from edge to edge of screen width
    easing: 'power1',   // movement easing method
    type: 'inOut'   // movement easing type
},
{
    id: 3,
    movement: 'randomAppear',  // appears and dissappears sporadically at random horizontal locations on the screen
    easing: 'power1',   // movement easing method
    type: 'inOut'   // movement easing type
}
];

export const levels = [
{
    level: 1,
    ghost: {
        easy: [
            {
                x: 650,
                y: 100
                // y: 600
            },
            // {
            //     x: 200,
            //     y: 300
            // }
        ],
        // mid: [
        //     {
        //         x: 100,
        //         y: 300
        //     },
        // ],
        // hard: [
        //     {
        //         x: 550,
        //         y: 300
        //     },
        // ]
    },
    slingProps: {
        x: 300,
        y: 700,
        k: 0.1
    },
    ball: {
        radius: 20,
        restitution: 1,
        inertia: 5,
    },
    platforms: [
        {
            x: 650,
            y: 300,
            width: 100,
            height: 20,
            restitution: 0,
            hasGhost: true,
            canMove: {
                mode: moveModes[0],
                xTorque: 1,
                yTorque: 0
            }
        }
    ],
    groundPlanes: [
        {
            x: 150,
            y: 890,
            width: 1600,
            height: 20,
            restitution: 0,
            hasGhost: false,
            options: groundOptions
        }
    ],
    timer: 30,
    greeting: 'Are you ready to banish some ghosts?',
    completeString: 'Great job!',
    // currentLevel: true,
    // setCurrLevel: function() {this.currentLevel = true} 
},
{
    level: 2,
    ghost: {
        easy: [
            {
                x: 800,
                y: 100
            }
        ],
        mid: [
            {
                x: 250,
                y: 100
            }
        ],
    },
    slingProps: {
        x: 500,
        y: 700,
        k: 0.1
    },
    ball: {
        radius: 20,
        restitution: 1,
        inertia: 5,
    },
    platforms: [
        {
            x: 250,
            y: 500,
            width: 150,
            height: 20,
            restitution: 0.5,
            hasGhost: true,
            canMove: true
        },
        {
            x: 800,
            y: 300,
            width: 150,
            height: 20,
            restitution: 0.5,
            hasGhost: false,
            canMove: true
        }
    ],
    groundPlanes: [
        {
            x: 150,
            y: 890,
            width: 1600,
            height: 20,
            restitution: 0,
            hasGhost: false,
            options: groundOptions
        }
    ],
    timer: 30,
    greeting: 'Who are you gonna call?',
    completeString: 'Level 2 complete!',
    // currentLevel: false,
    // setCurrLevel: function() {this.currentLevel = true} 
},
{
    level: 3,
    ghost: {
        hard: [
            {
                x: 650,
                y: 300
            }
        ],
    },
    slingProps: {
        x: 150,
        y: 250,
        k: 0.1
    },
    ball: {
        radius: 20,
        restitution: 1,
        inertia: 5,
    },
    platforms: [
        {
            x: 650,
            y: 300,
            width: 150,
            height: 20,
            restitution: 1,
            hasGhost: true,
            canMove: true
        },
        {
            x: 150,
            y: 350,
            width: 250,
            height: 20,
            restitution: 1,
            hasGhost: false,
            canMove: true
        },
        {
            x: 350,
            y: 250,
            width: 150,
            height: 20,
            restitution: 1,
            hasGhost: false,
            canMove: true
        }
    ],
    groundPlanes: [
        {
            x: 150,
            y: 890,
            width: 1600,
            height: 20,
            restitution: 0,
            hasGhost: false,
            options: groundOptions
        }
    ],
    timer: 30,
    greeting: 'Not so easy now!',
    completeString: 'Well Done!',
    // currentLevel: false,
    // setCurrLevel: function() {this.currentLevel = true} 
}
];

export const ghostLevels = [
{
    level: 1,
    label: 'easy',
    ghostName: 'Rufus',
    hitsRequired: 1,
    restitution: 1,
    reactiveLevel: 0,
    canMove: false, 
    copyInterval: -1,
    vanishCounts: -1,
    taunt: `Can't get me!`,
    imgPath: './assets/ghost-freepik.png',
    svgPath: './assets/ghost-freepik-inkscape-svg.svg',
},
{
    level: 2,
    label: 'mid',
    ghostName: 'Twinko',
    hitsRequired: 2,
    restitution: 1,
    reactiveLevel: 0,
    canMove: false, 
    copyInterval: 20,
    vanishCounts: -1,
    help: 'Twinko the ghost requires two hits to banish and has a secret trick up its sleeve.',
    taunt: `Can't get me!`,
    imgPath: './assets/ghost-freepik-yellow.png',
    svgPath: './assets/ghost-freepik-inkscape-svg.svg',
},
{
    level: 3,
    label: 'hard',
    ghostName: 'Drako',
    hitsRequired: 3,
    restitution: 1,
    reactiveLevel: 1,
    canMove: true, 
    copyInterval: 0,
    vanishCounts: 3, 
    taunt: `Drako the ghost requires three hits to banish. Watch out for this sneaky ghost!`,
    imgPath: './assets/ghost-freepik-green.png',
    svgPath: './assets/ghost-freepik-inkscape-svg.svg',
},
];

// contains save data for currrent game
export const saveData = {
    playerName: '',
    date: 0,
    currLevel: 0,
    bumpLevel: function() {this.currLevel ++},
    // bumpLevel: function() {this.currentLevel = true}, 
    timeLeftAtEnd: 0, 
    totalLives: 3,
    livesLeft: 3,
    ghostHits: 0,
    totalPowerUps: 0,
    powerUpsLeft: 0,
    currScore: 0, // score for this level
    totalScore: 0,
    inSession: false
}