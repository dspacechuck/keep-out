
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

export const ghostTypes = [
    {   name: 'Rufus',
        path: 'assets/ghost-freepik.png',
        difficulty: easy
    },
    {
        name: 'Twinko',
        path: 'assets/ghost-freepik-yellow.png',
        difficulty: mid
    },
    {
        name: 'Drako',
        path: 'assets/ghost-freepik-green.png',
        difficulty: hard
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
                y: 300
            },
            // {
            //     x: 300,
            //     y: 200
            // }
        ],
        mid: [],
        hard: []
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
    currentLevel: true,
    setCurrLevel: function() {this.currentLevel = true} 
},
{
    level: 2,
    ghost: {
        easy: 0,
        mid: [
            {
                x: 250,
                y: 300
            }
        ],
        hard: 0
    },
    slingProps: {
        x: 300,
        y: 500,
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
            y: 300,
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
    currentLevel: false,
    setCurrLevel: function() {this.currentLevel = true} 
},
{
    level: 3,
    ghost: {
        easy: 0,
        mid: 0,
        hard: [
            {
                x: 650,
                y: 300
            }
        ],
    },
    slingProps: {
        x: 20,
        y: 200,
        k: 0.1
    },
    ball: {
        radius: 0.5,
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
    currentLevel: false,
    setCurrLevel: function() {this.currentLevel = true} 
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
    currScore: 0,
    totalScore: 0,
    inSession: false
}