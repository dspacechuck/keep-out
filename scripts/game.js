import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Constraint, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Svg, World, Runner } = Matter;

const levels = [
    {
        level: 1,
        ghost: {
            easy: 1,
            mid: 0,
            hard: 0
        },
        ball: {
            radius: 1,
            restitution: 1,
            inertia: 5,
        },
        platforms: 1,
        timer: 60,
        greeting: 'Are you ready to banish some ghosts?',
        completeString: 'Great job!'
    },
    {
        level: 2,
        ghost: {
            easy: 0,
            mid: 1,
            hard: 0
        },
        ball: {
            radius: 1,
            restitution: 1,
            inertia: 5,
        },
        platforms: 3,
        timer: 60,
        greeting: 'Who are you gonna call?',
        completeString: 'Level 2 complete!'
    },
    {
        level: 3,
        ghost: {
            easy: 0,
            mid: 0,
            hard: 1
        },
        ball: {
            radius: 0.5,
            restitution: 1,
            inertia: 5,
        },
        platforms: 5,
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
    platform: null
}

// Define controls
const controls = {
    mouse: null,
    mouseConstraint: null,
    firing: null
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
        platform
    } = bodies;
    
    // Mouse
    mouse = Mouse.create(render.canvas);
    mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            render: { visible: false }
        }
    });

    // Bodies and body-supporting functions
    groundPlane = Bodies.rectangle(150, 890, 300, 20, groundOptions);
    platform = Bodies.rectangle(650, 300, 150, 20, groundOptions);
    ball = Bodies.circle(300, 600, 30, {
        restitution: 1, 
        render: {
            sprite: {
                // texture: './assets/ghost-freepik.png',
                xScale: 0.2,
                yScale: 0.2
            }
        }
    });
    sling = Constraint.create({
        pointA: {x: 300, y: 600},
        bodyB: ball,
        stiffness: 0.02
    });



    
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
                    .map(function(path) { return Matter.Vertices.scale(Svg.pathToVertices(path, 30), 0.2, 0.2); });
    
                const ghost1 = Composite.add(engine.world, Bodies.fromVertices(i +30, i + 30, vertexSets, {
                    render: {
                        fillStyle: 'red',
                        strokeStyle: '#f19648',
                        lineWidth: 1,
                        sprite: {
                            texture: './assets/ghost-freepik.png',
                            xScale: 0.21,
                            yScale: 0.21
                        }
                    }
                }, true));
    
                console.log(ghost1);
            });
        });
    }
    
    addAGhost();
    // addSlingshot();    

    console.log(loadSvg('./assets/ghost-freepik-inkscape-svg.svg'));

 



    // Create collision detector
    const crashDetector = Detector.create({
        bodies: [ball, groundPlane]
    });
    
    // Collision bodies to detect
    const colBodies = Detector.setBodies(crashDetector, [ball, groundPlane]);
    
    // Collision array
    const collisions = Detector.collisions(crashDetector);


    // console.log(crashDetector);
    // console.log(collisions);
    // console.log("collision bodies: ", colBodies);


    const mouseSetElement = Mouse.setElement(mouse, document.querySelector('.game'));

    // console.log(mouseSetElement);

    const startBtn = document.querySelector('.startBtn');

    //Test function: uses Start button to launch ball upwards
    startBtn.addEventListener('click', () => {
        const bodyAddForce = Body.applyForce(bodies.ball, bodies.ball.position, { x: 0, y: -0.1 });
        console.log("body add force: ", bodyAddForce);
        
        // Detects if two objects have collided
        console.log("collision? ", Matter.SAT?.collides(ball, groundPlane).collided);
    })

    //Test function: detects collisions
    // Events.on(engine, 'collisionStart', (e) => {
    //     if (!!SAT.collides(ball, groundPlane)?.collided) {
    //         console.log("collision");
    //     }
    //     // console.log("there is a collision");

    //     let pairs = e.pairs;
    //     console.log(e);

    //     pairs.forEach(pair => {
    //         pair.bodyA.render.fillStyle = '#333';
    //         // pair.bodyB.render.fillStyle = '#333';
    //     })
    // })


    // Events
    Events.on(mouseConstraint, 'enddrag', (e) => {
        if (e.body === ball) {
            firing = true;
        }
    })
    
    Events.on(engine, 'afterUpdate', () => {
        if (firing && Math.abs(ball.position.x - 300) < 40 && Math.abs(ball.position.y - 600) < 40) {
            ball = Bodies.circle(300, 600, 30);
            World.add(engine.world, ball);
            sling.bodyB = ball;
            firing = false;
        }  
    });

    Events.on(engine, 'collisionEnd', (e) => {
        if (!!SAT.collides(ball, groundPlane)?.collided) {
            // console.log("collision");
        }
        // console.log("there is a collision");

        let pairs = e.pairs;
        // console.log(e);

        pairs.forEach(pair => {
            pair.bodyA.render.fillStyle = 'red';
            // pair.bodyB.render.fillStyle = '#333';
        })
    })

    // Events.on(mouseConstraint, 'startDrag', (e) => {
    //     // console.log(e);
    //     if (e.body === ball) {
    //         // console.log("ended drag on a body: ", e.body);
    //         // console.log(e.body);
    //     }
    // })


    // Add items to world
    World.add(engine.world, [groundPlane, ball, platform, mouseConstraint, sling]);
        // ghost[0]]
        // );


}

const runGame = () => {
    Runner.run(engine);
    Render.run(render);
}



addElements();
// addDetector();
runGame();