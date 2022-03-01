import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Svg, World, Runner } = Matter;

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
        imgPath: '',
        svgPath: '',
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
        imgPath: '',
        svgPath: '',
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
        imgPath: '',
        svgPath: '',
    },
];



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

// let ctx = gameCanvas.getContext("2d");
// ctx.beginPath();
// ctx.arc(95, 50, 40, 0, 2 * Math.PI);
// ctx.stroke();

const addElements = (param) => {

    if (param == 'setup') {

    }

    // Bodies and body-supporting functions
    const groundPlane = Bodies.rectangle(150, 890, 300, 20, groundOptions);
    const platform = Bodies.rectangle(650, 300, 150, 20, groundOptions);
    const stack = Composites.stack(640, 50, 1, 4, 0, 0, (x, y) => {
        return Bodies.polygon(x, y, 4, 20, {
            restitution: 1
        });
    })
    const ball = Bodies.circle(200, 300, 30, {
        restitution: 1, 
        render: {
            sprite: {
                // texture: './assets/soccer-ball.png',
                // texture: './assets/ghost-freepik.png',
                xScale: 0.2,
                yScale: 0.2
            }
        }
    });

    console.log(ball);

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
    
    console.log(loadSvg('./assets/ghost-freepik-inkscape-svg.svg'));

 

    



    // console.log(ghost);



    // console.log("stack: ", stack);


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

    // Mouse
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            render: { visible: false }
        }
    });
    const mouseSetElement = Mouse.setElement(mouse, document.querySelector('.game'));

    // console.log(mouseSetElement);

    const startBtn = document.querySelector('.startBtn');

    //Test function: uses Start button to launch ball upwards
    startBtn.addEventListener('click', () => {
        const bodyAddForce = Body.applyForce(ball, ball.position, { x: 0, y: -0.1 });
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

    Events.on(mouseConstraint, 'startDrag', (e) => {
        // console.log(e);
        if (e.body === ball) {
            // console.log("ended drag on a body: ", e.body);
            // console.log(e.body);
        }
    })

    // console.log(Events);

    World.add(engine.world, [groundPlane, platform, mouseConstraint, stack]);
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