import { renderConfig, groundOptions } from './config.js'; 

const { Body, Bodies, Composites, Detector, Engine, Mouse, MouseConstraint, Render, World, Runner } = Matter;
const engine = Engine.create();
const render = Render.create({
    // canvas: someCanvas
    element: document.querySelector('.game'),
    engine: engine,
    options: {
        width: 900,
        height: 900,
        wireframes: false,
        showPerformance: true,
        background: 'rgba(0,0,0,0)',     
    }
}); 


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
        restitution: 1
    });



    // Create collision detector
    const crashDetector = Detector.create({
        bodies: [ball, groundPlane]
    });

    // Collision array
    const collisions = Detector.collisions(crashDetector);

    console.log(crashDetector);
    console.log(collisions);

    // Mouse
    const mouse = Mouse.create(render.canvas);
    const mouseConstraint = MouseConstraint.create(engine, {
        mouse: mouse,
        constraint: {
            render: { visible: false }
        }
    });
    const mouseSetElement = Mouse.setElement(mouse, document.querySelector('.game'));

    console.log(mouseSetElement);

    const startBtn = document.querySelector('.startBtn');

    //Test function: uses Start button to launch ball upwards
    startBtn.addEventListener('click', () => {
        const bodyAddForce = Body.applyForce(ball, ball.position, { x: 0, y: -0.1 });
        console.log("body add force: ", bodyAddForce);
    })



    World.add(engine.world, [groundPlane, platform, mouseConstraint, stack, ball]);


}

game.run = () => {
    Runner.run(engine);
    Render.run(render);
}



game.addElements();
// game.addDetector();
game.run();