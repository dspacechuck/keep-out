import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Constraint, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Sleeping, Svg, World, Runner } = Matter;

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
            k: 0.02
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
                restitution: 0
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
            k: 0.02
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
                restitution: 0.5
            },
            {
                x: 800,
                y: 300,
                width: 150,
                height: 20,
                restitution: 0.5
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
            k: 0.02
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
                restitution: 1
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
    prevBalls: [],
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
    // collisionFilter: {
    //     mask: solid,
    //     category: nextBall
    // },
    render: {
        sprite: {
            // texture: './assets/ghost-freepik.png',
            xScale: 0.2,
            yScale: 0.2
        }
    }
}

const prevBallOptions = {
    restitution: 1, 
    collisionFilter: {
        mask: solid,
        category: nextBall
    },
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
        prevBalls,
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
        // stiffness: slingProps.k,
        stiffness: 0.1,
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
                // pair.bodyB.render.fillStyle = 'red';
            })
        }

    })

    Events.on(mouseConstraint, 'enddrag', (e) => {
        if (e.body === ball) {
            firing = true;
            // console.log("ball");
            // console.log(e.body);
        }

        // // prevent ghost drag but still allow it to respond to the physics engine
        // if(e.body.label === 'ghost') {
        //     e.body.isStatic = false;
        // }
        
        // if(e.body === ball) {
        //     e.body.isStatic = false;
        // }
    })
    Events.on(engine, 'afterUpdate', () => {
         if (firing && Math.abs(ball.position.x - slingProps.x) < 20 && Math.abs(ball.position.y - slingProps.y) < 20) {
            
    
            // ball.collisionFilter.category = nextBall;
            // ball.collisionFilter.mask = nextBall;

            // const oldBall = {...ball};

            // prevBalls.push(oldBall)

            ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

            World.add(engine.world, ball); // 'launches' the ball
            // ball.collisionFilter = { category: solid, mask: solid };

            // nextBall = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);
            sling.bodyB = ball;

            firing = false;

            // World.remove(engine.world, sling);

            // ball.collisionFilter.category = nextBall;

            // ball.collisionFilter.category = nextBall;
        }  
    });

    Events.on(mouseConstraint, 'startdrag', (e) => {
        console.log("e");
        console.log(e);
        
        // // prevent ghost drag but still allow it to respond to the physics engine
        // if (e.body.label === 'ghost') {
        //     console.log("ghost is being dragged")
        //     e.body.isStatic = true;
        //     // e.body.collisionFilter = { category: solid, mask: solid };
        // }

        if(e.body === ball) {
            console.log(e);
        //     e.body.isStatic = true;
        }
    })

    // Events.on(engine, 'collisionEnd', (e) => {
    //     const hasCollided = Matter.Collision.collides(ball, groundPlane);
    //     console.log("has collided? ")
    //     console.log(hasCollided);
    //     console.log(e);


    //     if (!!Matter.Collision.collides(ball, groundPlane)?.collided) {
    //         // console.log("collision");
    //     }
    //     // console.log("there is a collision");

    //     // let pairs = e.pairs;
    //     // console.log(pairs);

    //     // pairs.forEach(pair => {
    //     //     pair.bodyA ? pair.bodyA.render.fillStyle = 'red' : null;
    //     //     // pair.bodyB.render.fillStyle = '#333';
    //     // })
    // })
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
                            // texture: './assets/ghost-freepik.png',
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
    // addSlingshot();    

    console.log(loadSvg('./assets/ghost-freepik-inkscape-svg.svg'));

 



    // // Create collision detector
    // const crashDetector = Detector.create({
    //     bodies: [ball, groundPlane]
    // });
    
    // // Collision bodies to detect
    // const colBodies = Detector.setBodies(crashDetector, [ball, groundPlane]);
    
    // // Collision array
    // const collisions = Detector.collisions(crashDetector);

    // const mouseSetElement = Mouse.setElement(mouse, document.querySelector('.game'));

    // // console.log(mouseSetElement);

    // const startBtn = document.querySelector('.startBtn');

    // //Test function: uses Start button to launch ball upwards
    // startBtn.addEventListener('click', () => {
    //     const bodyAddForce = Body.applyForce(bodies.ball, bodies.ball.position, { x: 0, y: -0.1 });
    //     console.log("body add force: ", bodyAddForce);
        
    //     // Detects if two objects have collided
    //     console.log("collision? ", Matter.SAT?.collides(ball, groundPlane).collided);
    // })

  

    // Events
    // Events.on(mouseConstraint, 'enddrag', (e) => {
    //     if (e.body === ball) {
    //         firing = true;
    //     }
    // })
    
    // Events.on(engine, 'afterUpdate', () => {
    //     if (firing && Math.abs(ball.position.x - 300) < 40 && Math.abs(ball.position.y - 600) < 40) {
    //         ball = Bodies.circle(300, 600, 20);
    //         World.add(engine.world, ball);
    //         sling.bodyB = ball;
    //         firing = false;
    //     }  
    // });

    // Events.on(engine, 'collisionEnd', (e) => {
    //     if (!!Matter.Collision.collides(ball, groundPlane)?.collided) {
    //         // console.log("collision");
    //     }
    //     // console.log("there is a collision");

    //     let pairs = e.pairs;
    //     console.log(pairs);

    //     // pairs.forEach(pair => {
    //     //     pair.bodyA ? pair.bodyA.render.fillStyle = 'red' : null;
    //     //     // pair.bodyB.render.fillStyle = '#333';
    //     // })
    // })

    // Events.on(mouseConstraint, 'startDrag', (e) => {
    //     // console.log(e);
    //     if (e.body === ball) {
    //         // console.log("ended drag on a body: ", e.body);
    //         // console.log(e.body);
    //     }
    // })


    // Add items to world
    World.add(engine.world, [groundPlane]);
        // ghost[0]]
        // );


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