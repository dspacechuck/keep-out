import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Svg, World, Runner } = Matter;

// Common.setDecomp();

// Common.setDecomp('poly-decomp');

// console.log(Common.setDecomp)

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

const game = {};


game.addElements = () => {
    // Bodies
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

    // Maps SVG ghost to body
    const ghost = [...document.querySelectorAll("svg > path")]
        .map(path => {
        const body = Matter.Bodies.fromVertices(
        100, 80, Matter.Svg.pathToVertices(path), {
                restitution: 0, 
                render: {
                    sprite: {
                        texture: './assets/ghost-freepik.png',
                        // texture: './assets/soccer-ball.png',
                        xScale: 0.21,
                        yScale: 0.21
                    }
                },
                wireframes: true
            },
            true
        );
        Matter.Body.scale(body, 0.2, 0.2);
        console.log(body)
        return body;
    })

    // const bodyVertices = [
    //     { x: 9, y: 72 },
    //     { x: 3, y: 78 },
    //     { x: 4, y: 93 },
    //     { x: 18, y: 98 },
    //     { x: 33, y: 98 },
    //     { x: 17, y: 77 },
    //     { x: 293, y: 59 },
    //     { x: 286, y: 56 },
    //     { x: 293, y: 64 },
    //     { x: 319, y: 94 },
    //     { x: 297, y: 72 },
    //     { x: 269, y: 99 },
    //     { x: 319, y: 98 },
    //     { x: 20, y: 65 },
    //     { x: 17, y: 77 },
    //     { x: 33, y: 98 },
    //     { x: 85, y: 103 },
    //     { x: 145, y: 102 },
    //     { x: 26, y: 63 },
    //     { x: 315, y: 77 },
    //     { x: 309, y: 73 },
    //     { x: 297, y: 72 },
    //     { x: 316, y: 91 },
    //     { x: 124, y: 9 },
    //     { x: 108, y: 36 },
    //     { x: 145, y: 102 },
    //     { x: 240, y: 13 },
    //     { x: 217, y: 5 },
    //     { x: 189, y: 1 },
    //     { x: 155, y: 2 },
    //     { x: 137, y: 5 },
    //     { x: 32, y: 54 },
    //     { x: 26, y: 63 },
    //     { x: 145, y: 102 },
    //     { x: 108, y: 36 },
    //     { x: 97, y: 35 },
    //     { x: 78, y: 37 },
    //     { x: 48, y: 45 },
    //     { x: 269, y: 99 },
    //     { x: 297, y: 72 },
    //     { x: 269, y: 33 },
    //     { x: 263, y: 31 },
    //     { x: 145, y: 102 },
    //     { x: 218, y: 103 },
    //     { x: 293, y: 64 },
    //     { x: 286, y: 56 },
    //     { x: 297, y: 72 },
    //     { x: 240, y: 13 },
    //     { x: 145, y: 102 },
    //     { x: 263, y: 31 },
    //     { x: 253, y: 22 },
    //     { x: 145, y: 102 },
    //     { x: 154, y: 105 },
    //     { x: 201, y: 105 },
    //     { x: 201, y: 103 },
    //   ];

    // const ghost = Matter.Bodies.fromVertices(
    //     80, 280, bodyVertices, {
    //             restitution: 0, 
    //             render: {
    //                 sprite: {
    //                     // texture: './assets/ghost-freepik.png'
    //                 }
    //             },
    //             wireframes: true
    //         },
    //         true
    //     );

    



    console.log(ghost);



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

    World.add(engine.world, [groundPlane, platform, mouseConstraint, stack, ball, ghost[0]]);


}

game.run = () => {
    Runner.run(engine);
    Render.run(render);
}



game.addElements();
// game.addDetector();
game.run();