import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Constraint, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Sleeping, Svg, World, Runner } = Matter;

//  Define different movement modes for game objects
//  Easing method and types are for GSAP motion library use: https://greensock.com/docs/v3/Eases
const moveModes = [{
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

const levels = [
    {
        level: 1,
        ghost: {
            easy: [
                {
                    x: 650,
                    y: 300
                }
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
        timer: 60,
        greeting: 'Are you ready to banish some ghosts?',
        completeString: 'Great job!'
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
        timer: 60,
        greeting: 'Who are you gonna call?',
        completeString: 'Level 2 complete!'
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
        timer: 60,
        greeting: 'Not so easy now!',
        completeString: 'Well Done!'
    }
];

const ghostLevels = [
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

// Setup game
const gameCanvas = document.querySelector('.game');
const engine = Engine.create();
const render = Render.create({
    // canvas: someCanvas
    element: gameCanvas,
    engine: engine,
    options: {
        width: 900,
        height: 900,
        wireframes: false,
        showPerformance: true,
        background: 'rgba(0,0,0,0)',     
    }
}); 

// Define bodies
const bodies = {
    sling: null,
    ball: null, 
    groundPlane: null,
    platforms: [],
    ghost: null
}

// Define controls
const controls = {
    mouse: null,
    mouseConstraint: null,
    firing: null
}

// Setup bitmasks for collision filter
const solid = 0x0001;
const nextBall = 0x0004;

// Options for ball
const ballOptions = {
    restitution: 1, 
    render: {
        sprite: {
            // texture: './assets/ghost-freepik.png',
            xScale: 0.2,
            yScale: 0.2
        }
    }
}

// Function to add a sling to the world and setup mouse constraint
const createSling = (levelParam) => {
    let { 
        mouse, 
        mouseConstraint, 
        firing 
    } = controls;

    let {
        sling,
        ball,
        groundPlane,
        platforms,
        ghost 
    } = bodies;
    
    const ballProps = levelParam.ball;
    const slingProps = levelParam.slingProps;

    // Mouse
    mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        collisionFilter: {
            category: nextBall
        },
        constraint: {
            render: { visible: false }
        }
    });

    console.log(mouseConstraint);

    // Bodies and body-supporting functions
    ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

    console.log("ball created");
    console.log(ball);
    sling = Constraint.create({
        pointA: {x: slingProps.x, y: slingProps.y},
        bodyB: ball,
        stiffness: slingProps.k,
        length: 0,
    });
    
    console.log(sling);

    Events.on(engine, 'collisionEnd', (e) => {
        // console.log(e);
        // if (!!SAT.collides(ball, groundPlane)?.collided) {
        //     // console.log("collision");
        // }

        const pairs = e.pairs;

        // bodyB is the object that got hit by the ball
        if (pairs) {
            console.log("there is a collision");
                pairs.forEach(pair => {
                pair.bodyA.render.fillStyle = 'red';
                console.log(pair.bodyB);
            })
        }

    })

    Events.on(mouseConstraint, 'enddrag', (e) => {
        if (e.body === ball) {
            firing = true;
        }
    })

    Events.on(engine, 'afterUpdate', () => {
         if (firing && Math.abs(ball.position.x - slingProps.x) < 20 && Math.abs(ball.position.y - slingProps.y) < 20) {
            
            ball.collisionFilter.category = solid;
            ball.collisionFilter.mask = solid;

            ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

            World.add(engine.world, ball); // 'launches' the ball
            sling.bodyB = ball;
            firing = false;

        }  
    });

    World.add(engine.world, [ball, mouseConstraint, sling]);
}

// Function to add platforms to the world
const addPlatforms = (levelParam) => {
    let {
        platforms
    } = bodies

    const platformsArr = levelParam.platforms;

    // Creates one platform for each array entry in platformsArr,
    // then pushes this array of created platforms to bodies.platforms
    platformsArr.forEach(({x, y, width, height, restitution}) => {
        const currPlatform = Bodies.rectangle(x, y, width, height, groundOptions);
        platforms.push(currPlatform);
    })

    World.add(engine.world, platforms);
}

// Function to animate game objects (.i.e: after game starts)
// Use this after addPlatforms
// *******Finish this function later (WIP)
const animateObjs = (levelParam) => {
    let {
        platforms
    } = bodies

    console.log({platforms});
}



// Function to add elements to the world
const addElements = () => {
    let { 
        mouse, 
        mouseConstraint, 
        firing 
    } = controls;

    let {
        sling,
        ball,
        groundPlane,
        platforms,
        ghost
    } = bodies;
    
    // Bodies and body-supporting functions
    groundPlane = Bodies.rectangle(150, 890, 1600, 20, groundOptions);
    
    // load a svg file and parse it with image/svg+xml params
    const loadSvg = (filePath) => {
        return fetch(filePath)
            .then((res) => { return res.text(); })
            .then((raw) => { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
    };

    // 
    var select = function(root, selector) {
        console.log(Array.prototype.slice.call(root.querySelectorAll(selector)))
        return Array.prototype.slice.call(root.querySelectorAll(selector));
    };

    const addAGhost = () => {
        ([
            './assets/ghost-freepik-inkscape-svg.svg', 
        ]).forEach(function(path, i) { 
            console.log("Path and i below");
            console.log(path);
            console.log(i);
           
            loadSvg(path).then(function(root) {
     
                const vertexSets = select(root, 'path')
                    .map(function(path) { return Matter.Vertices.scale(Svg.pathToVertices(path, 30), 0.15, 0.15); });
    
                ghost = Bodies.fromVertices(i + 650, i + 200, vertexSets, {
                    label: 'ghost',
                    render: {
                        fillStyle: 'yellow',
                        strokeStyle: '#f19648',
                        lineWidth: 1,
                        sprite: {
                            texture: './assets/ghost-freepik.png',
                            xScale: 0.15,
                            yScale: 0.15
                        }
                    }
                }, true);
    
                World.add(engine.world, [ghost]);

                ghost.collisionFilter = { category: solid, mask: solid };

                console.log(ghost);
            });
        });
    }
    
    addAGhost();

    console.log(loadSvg('./assets/ghost-freepik-inkscape-svg.svg'));
 
    // Add items to world
    World.add(engine.world, [groundPlane]);


}

// Function to add all generated items to the world
const addObjs = () => {
    // let { 
    //     mouse, 
    //     mouseConstraint, 
    //     firing 
    // } = controls;

    // let {
    //     sling,
    //     ball,
    //     groundPlane,
    //     platform
    // } = bodies;
    // World.add(engine.world, [groundPlane, ball, platform, mouseConstraint, sling]);
}

const runGame = () => {
    Runner.run(engine);
    Render.run(render);
}

console.log("level 1");
console.log(levels[0]);

// params: x, y, radius, restitution, inertia
createSling(levels[0]);
addPlatforms(levels[0]);

// params: 
addElements();
// addDetector();

// add all objects to the world
addObjs();
runGame();

$(document).ready(() => {
    console.log('game is loaded!');

    // Have a splash screen (arcade game style screen)
    // 1) Await Start button click 
    // 2) Show instructions + animate slingshot movement
    // 3) Await user click of OK to dismiss splash screen
    // 4) Show 3, 2, 1 countdown 
    // 5) run game
        // 5.1 (start countdown clock) 
       // 5.2 (i.e.: animate any objects as necessary)

});