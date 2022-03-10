import { canvasProps, startBtnProps, renderConfig, groundOptions, moveModes, levels, ghostLevels, ghostTypes, saveData } from './config.js'; 

const { Body, Bodies, Common, Composite, Composites, Constraint, Detector, Engine, Events, Mouse, MouseConstraint, Render, SAT, Sleeping, Svg, World, Runner } = Matter;

// Setup game
const gameCanvas = document.querySelector('.game');
const engine = Engine.create();
const render = Render.create({
    // canvas: someCanvas
    element: gameCanvas,
    engine: engine,
    options: {
        width: canvasProps.width,
        height: canvasProps.height,
        wireframes: false,
        showPerformance: true,
        background: 'rgba(0,0,0,0)',     
    }
}); 

// Define bodies
const bodies = {
    sling: null,
    ball: null, 
    groundPlane: [],
    platforms: [],
    ghost: null
}

// Cache DOM element selectors
const startBtn = document.querySelector('.startBtn');
const timerBar = document.querySelector('.timerDiv');
const currTimeEl = document.querySelector('.myTime');

// Define controls
const controls = {
    mouse: null,
    mouseConstraint: null,
    firing: false, 
    startState: false,
    toggleState: function() {controls.startState = !controls.startState}
}

// Define level states 
const levelStates = {
    currLevel: 0,
    timeAtStart: 30,
    timeLeft: null,
    timerHandle: null
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

// Tracks current level
const currLevelObj = levels.find((level) => {return level.currentLevel === true});

// TODO: no need to use this after refactoring
const checkGameStatus = (timeLeft) => {
    if(timeLeft <= 0) {
        console.log("Game lost");
        clearInterval(levelStates.timerHandle);
    }
}

// Helper function to count down the timer
function countTimer() {
	let timeLeft = levelStates.timeAtStart - Math.floor((tween.progress()*levelStates.timeAtStart));
	// $('#count').text(timeLeft + 's');
    currTimeEl.innerHTML=`${timeLeft}s`;
}

// GSAP timer update function
const tween = gsap.from(timerBar, levelStates.timeAtStart, {
    width: '100%',
    ease: Linear.easeNone,
    paused: true,
    // onStart: function() {
    //     tween.ticker.fps(1);
    // },
    onUpdate: countTimer,
    onComplete: function(){ 
    //   timerBar.addClass("complete");
    }
});


// Starts/pauses countdown timer
const countdownTimerMgr = () => {
    
    // Find current level
    console.log(currLevelObj);

    // If game state is ON, start timer
    if (controls.startState) {
        if (levelStates.timeLeft > 1) {
            
            World.add(engine.world, [controls.mouseConstraint]);
            Events.on(controls.mouseConstraint, 'enddrag', (e) => {
                if (e.body === bodies.ball) {
                    controls.firing = true;
                }
            })
            
            levelStates.timerHandle = setInterval(() => {
                levelStates.timeLeft -= 1;
                console.log(levelStates.timeLeft);
                checkGameStatus(levelStates.timeLeft); // check to see if game is won or not
            }, 1000);  
            tween.play();
        }
    } else {
        // pause timer
        if (levelStates.timeLeft > 1) {
            Events.off(controls.mouseConstraint);
            World.remove(engine.world, [controls.mouseConstraint]);
            clearInterval(levelStates.timerHandle);
        }
        tween.pause();
    }
   
}

const toggleStartButtonState = () => {
    if (controls.startState) {
        startBtn.innerHTML=startBtnProps.pauseString;
        startBtn.classList.add('btnAltProps');
    } else {
        startBtn.innerHTML=startBtnProps.startString;
        startBtn.classList.remove('btnAltProps');
    }
}

// Add start button event listener
// onClick => change button text to "pause" and start game
const addUIListeners = () => {
    startBtn.addEventListener('click', (e) => {
        
        controls.toggleState();
        countdownTimerMgr();

        // 1) Add/remove mouse constraint
        // 2) Toggle button text
        toggleStartButtonState();

    });
}

// Detect scoring
// param: ghostObj destructured into velocity, angle, and position
const scoreDetector = (ghostObj) => {

    

    if (ghostObj) {
        const {velocity, angle, position} = ghostObj;
        // console.log(velocity, angle, position)
    
        const notMoving = (velocity.x === 0 && velocity.y === 0);
    
        // console.log('not moving? ', notMoving);
    
        const isOffCanvas = position.x > canvasProps.width || position.y > canvasProps.height || position.x < 0 || position.y < 0;
    
        // If ghost has stopped moving OR if ghost has left the canvas (and no longer upright in both cases)
        if ((notMoving && angle > 0.1) || isOffCanvas && angle > 0.1) {
            console.log("You won!");
        }

    }
}

// Function to add a sling to the world and setup mouse constraint
const createSling = (levelParam) => {  
    // let { 
    //     mouse, 
    //     mouseConstraint, 
    //     firing 
    // } = controls;

    // let {
    //     sling,
    //     ball,
    //     groundPlane,
    //     platforms,
    //     ghost 
    // } = bodies;
    
    const ballProps = levelParam.ball;
    const slingProps = levelParam.slingProps;

    // Mouse
    controls.mouse = Mouse.create(render.canvas);
    controls.mouseConstraint = MouseConstraint.create(engine, {
        mouse: controls.mouse,
        collisionFilter: {
            category: nextBall
        },
        constraint: {
            render: { visible: false }
        }
    });

    console.log(controls.mouseConstraint);

    // Bodies and body-supporting functions
    bodies.ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

    console.log("ball created");
    console.log(bodies.ball);
    bodies.sling = Constraint.create({
        pointA: {x: slingProps.x, y: slingProps.y},
        bodyB: bodies.ball,
        stiffness: slingProps.k,
        length: 0,
    });
    

    Events.on(engine, 'collisionEnd', (e) => {

        const pairs = e.pairs;
       
        pairs?.forEach(pair => {
            // pair.bodyB.label === 'ghost' 
            console.log(pair);
            if (pair.bodyA.label === 'ghost' || pair.bodyB.label === 'ghost') {
                console.log('ghost was hit')
                console.log(bodies.ghost);
                saveData.ghostHits++;
                console.log(saveData.ghostHits);
                // World.remove(engine.world, bodies.ghost);
            }
        })

        // Has ghost been pushed off the platform and/or off the screen?
        // If yes > remove ghost (with animation) from engine.world.
        
        // Scenario 1: ghost has been hit but came to a stop no longer upright
        // bodies.ghost.velocity = { x: 0, y: 0} && ghost has been hit && ghost angle > 0.1
        // OR
        
        // Scenario 2: ghost has been hit, is no longer upright, and is off the x and y extents of the canvas


    })

    // Events.on(controls.mouseConstraint, 'enddrag', (e) => {
    //     if (e.body === bodies.ball) {
    //         controls.firing = true;
    //     }
    // })

    Events.on(engine, 'afterUpdate', () => {
         if (controls.firing && Math.abs(bodies.ball.position.x - slingProps.x) < 20 && Math.abs(bodies.ball.position.y - slingProps.y) < 20) {
            
            bodies.ball.collisionFilter.category = solid;
            bodies.ball.collisionFilter.mask = solid;

            bodies.ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

            World.add(engine.world, bodies.ball); // 'launches' the ball
            bodies.sling.bodyB = bodies.ball;
            controls.firing = false;

            console.log(controls.firing);
        }  

        scoreDetector(bodies.ghost);

    });

    // World.add(engine.world, [bodies.ball, controls.mouseConstraint, bodies.sling]);
    World.add(engine.world, [bodies.ball, bodies.sling]);
}

// Function to add platforms to the world
const addPlatforms = (levelParam) => {
    // let {
    //     platforms
    // } = bodies

    const platformsArr = levelParam.platforms;

    // Creates one platform for each array entry in platformsArr,
    // then pushes this array of created platforms to bodies.platforms
    platformsArr.forEach(({x, y, width, height, restitution}) => {
        const currPlatform = Bodies.rectangle(x, y, width, height, groundOptions);
        bodies.platforms.push(currPlatform);
    })

    World.add(engine.world, bodies.platforms);
}

// Function to animate game objects (.i.e: after game starts)
// Use this after addPlatforms
// *******Finish this function later (WIP)
const animateObjs = (levelParam) => {
    // let {
    //     platforms
    // } = bodies

    console.log(bodies.platforms);
}



// Function to add elements to the world
const addElements = (levelParam) => {
    // let { 
    //     mouse, 
    //     mouseConstraint, 
    //     firing 
    // } = controls;

    // let {
    //     sling,
    //     ball,
    //     groundPlane,
    //     platforms,
    //     ghost
    // } = bodies;
    const groundPlanes = levelParam.groundPlanes;
    const currLvlGhosts = levelParam.ghost;


    createSling(levelParam);

    console.log("addElements levelParam: ", levelParam);
    
    groundPlanes.forEach((ground, i) => {
        bodies.groundPlane[i] = Bodies.rectangle(ground.x, ground.y, ground.width, ground.height, ground.options);
        console.log(bodies.groundPlane[i]);
    });



    // Bodies and body-supporting functions
    // bodies.groundPlane = Bodies.rectangle(150, 890, 1600, 20, groundOptions);
    
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


    // currLvlGhosts
    // Gets each ghost in the currLevlGhosts object

    // for (const diffLvl in currLvlGhosts) {
    //     console.log(`${diffLvl}: ${object[diffLvl]}`);
    //   }


    // This function can be used to load any SVG into an object in the game
    const addGhost = () => {
        ([
            './assets/ghost-freepik-inkscape-svg.svg', 
        ]).forEach(function(path, i) { 
            console.log("Path and i below");
            console.log(path);
            console.log(i);
           
            loadSvg(path).then(function(root) {
     
                const vertexSets = select(root, 'path')
                    .map(function(path) { return Matter.Vertices.scale(Svg.pathToVertices(path, 30), 0.15, 0.15); });
    
                bodies.ghost = Bodies.fromVertices(i + 650, i + 200, vertexSets, {
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
    
                World.add(engine.world, [bodies.ghost]);

                bodies.ghost.collisionFilter = { category: solid, mask: solid };

                console.log(bodies.ghost);
            });
        });
    }
    
    addGhost();

    addPlatforms(levelParam);

    console.log(bodies.ghost);

    console.log(loadSvg('./assets/ghost-freepik-inkscape-svg.svg'));
 
    // Add items to world
    World.add(engine.world, [...bodies.groundPlane]);


}

// Gets level timer
const loadLevelTimer = () => {
    levelStates.timeLeft = currLevelObj.timer; // Load timer value
    levelStates.timeAtStart = currLevelObj.timer; // Load time-at-start value
}

const runEngine = () => {
    Runner.run(engine);
    Render.run(render);
}

console.log("level 1");
console.log(levels[0]);

// params: x, y, radius, restitution, inertia
// createSling(levels[0]);
// addElements(levels[0]);
// addDetector();

// add all objects to the world
runEngine();

$(document).ready(() => {
    console.log('game is loaded!');
    addUIListeners();
    addElements(levels[0]);
    loadLevelTimer();
    // Have a splash screen (arcade game style screen)
    // 1) Await Start button click 
    // 2) Show instructions + animate slingshot movement
    // 3) Await user click of OK to dismiss splash screen
    // 4) Show 3, 2, 1 countdown 
    // 5) run game
        // 5.1 (start countdown clock) 
       // 5.2 (i.e.: animate any objects as necessary)


    const testBtn = document.querySelector('.testBtn');

    // button to debug game
    testBtn.addEventListener('click', () => {
        console.log(bodies.ghost);
        scoreDetector(bodies.ghost);
    });


});