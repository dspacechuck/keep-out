import { canvasProps, startBtnProps, renderConfig, ballOptions, sensorOptions, groundOptions, moveModes, levels, ghostLevels, ghostTypes, saveData, scoreData } from './config.js'; 

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
    // ghost: null,
    ghost: []
}

// Cache DOM element selectors
const startBtn = document.querySelector('.startBtn');
const timerBar = document.querySelector('.timerDiv');
const currTimeEl = document.querySelector('.myTime');
const scoreEl = document.querySelector('.myScore');
const startGameBtn = document.querySelector('.startGameBtn');
const instructionsBtn = document.querySelector('.instructionsBtn');
const modalContainer = document.querySelector('.modalContainer');

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

// Tracks current level
const currLevelObj = levels[saveData.currLevel];

// Setup bitmasks for collision filter
const solid = 0x0001;
const nextBall = 0x0004;

// Tracks if ghost has been hit (to analyze if ghost has been toppled)
let analyzingHit = false;

// Toggles mouse control ON/OFF
const activateMouse = (status) => {
    if (status) {
        World.add(engine.world, [controls.mouseConstraint]);
        Events.on(controls.mouseConstraint, 'enddrag', (e) => {
            if (e.body === bodies.ball) {
                controls.firing = true;
            }
        })
    } else {
        Events.off(controls.mouseConstraint);
        World.remove(engine.world, [controls.mouseConstraint]);
    }
}

// Tracks current level
// const currLevelObj = levels.find((level) => {return level.currentLevel === true});
// const currLevelObj = levels[saveData.currLevel];
// const currLevelObj = levels[2];

// Function to show scores to UI
const showScores = (currScore) => {
    // TODO: Use gsap to animate score count up to awarded score
    saveData.currScore = currScore;
    scoreEl.innerHTML = currScore;
}

// Calculate Scores at game end
const finalizeScores = (timeRem) => {
    const {
        scoreBasis,
        perLevelBonus,
        livesLeftBonus
    } = scoreData;
    
    console.log(bodies.ghost);

    const baseScore = timeRem * scoreBasis;

    // const ghostScore = bodies.ghost
    //     .map((type) => type.points)
    //     .reduce((prevVal, currVal) => prevVal + currVal, 0); // creates an array of all ghost names to match

    const levelScore = perLevelBonus * (saveData.currLevel + 1);
    const livesLeftScore = livesLeftBonus * saveData.livesLeft;    
    // const score = baseScore + ghostScore + levelScore + livesLeftScore + saveData.currScore;
    const score = baseScore + levelScore + livesLeftScore + saveData.currScore;

    // console.log("Points awarded: ", {baseScore}, {ghostScore}, {levelScore}, {livesLeftScore});
    console.log("Points awarded: ", {baseScore}, {levelScore}, {livesLeftScore});
    console.log("Your final score is: ", score);

    // Save score to saveData file


    return score;
}

// Helper function to count down the timer
// Param saveTime is used to save time left into the save file
function countTimer(saveTime = false) {
	let timeLeft = levelStates.timeAtStart - Math.floor((tween.progress()*levelStates.timeAtStart));
    currTimeEl.innerHTML=`${timeLeft}s`;
    if (saveTime) {
        currLevelObj.timeLeftAtEnd = timeLeft;
        console.log("time left at end of game: ", currLevelObj.timeLeftAtEnd);
        showScores(finalizeScores(timeLeft));
    }
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
        invokeGameLost();
    }
});


// Starts/pauses countdown timer
const countdownTimerMgr = () => {
    
    // Find current level
    console.log(currLevelObj);

    // If game state is ON, start timer
    if (controls.startState) {
        activateMouse(true);
        tween.play();
    } else {
        // pause timer
        activateMouse(false);
        tween.pause();
    }
   
}

// TODO: consider removing or refactoring this later
const toggleStartButtonState = () => {
    if (controls.startState) {
        startBtn.innerHTML=startBtnProps.pauseString;
        startBtn.classList.add('btnAltProps');
    } else {
        startBtn.innerHTML=startBtnProps.startString;
        startBtn.classList.remove('btnAltProps');
    }
}

// Toggles start button state & launches countdown timer
const startBtnOps = () => {
    controls.toggleState();
    countdownTimerMgr();
    toggleStartButtonState();    
}

// Add/remove start button event listener
// onClick => change button text to "pause" and start game
const activateStartBtn = (listenerOn) => {
    return new Promise((resolve, reject) => {
        if(listenerOn) {
            startBtn.addEventListener('click', startBtnOps);
            resolve();
        } else {
            startBtn.removeEventListener('click', startBtnOps);
            resolve();
        }
    })
}


// Declares game lost 
// Cleans up event handlers
// Prevents ball launch
// Pauses timer
// Disable start button

// Awards scores
// Saves data
const invokeGameLost = () => {
    console.log('Game Lost!');
    controls.startState=false;
    activateEngineListeners(false);
    activateMouse(false);
    tween.pause();
    activateStartBtn(false);
}

// Declares game won sequence
// Cleans up event handlers
// Prevents ball launch
// Pauses timer
// Disable start button
// Awards scores
// Saves data
// Advance to next level
const invokeGameWon = () => {
    console.log('Game Won!');
    controls.startState=false;
    activateEngineListeners(false);
    activateMouse(false);
    tween.pause();
    activateStartBtn(false);

    countTimer(true);
    saveData.bumpLevel(); // advance to next level
    console.log('current level: ', saveData.currLevel);
}

// Awards the player for knocking the ghost over
// const awardGhostHit = (ghostArr, index) => {
//     // ghostArr[index].defeated=true;
//     console.log("Ghost down!");
//     saveData.currScore += ghostArr[index].points;
//     showScores(saveData.currScore);
//     startBtn.innerHTML = `ghost ${index}`;
// }

// Shows summary at end of level (time out or won)
const showResultsModal = () => {
    
}


const awardGhostHit = (id) => {
    // ghostArr[index].defeated=true;

    bodies.ghost.filter((ghost) => ghost.id === id)
        .forEach((g) => {
            saveData.currScore += g.points;
            showScores(saveData.currScore);
            // startBtn.innerHTML = `ghost ${index}`;
        })

    // checkGameWon();

    // If game is won, display modal to advance to next level, 
    // otherwise, display modal to ask if the player wishes to retry current level
    if (checkGameWon()) {
        showResultsModal();
    }
}

// Detect scoring
// param: ghostObj destructured into velocity, angle, and position
// const scoreDetector = (ghostObj) => {
const scoreDetector = (ghostArr) => {

    // for each ghostObj in ghostArr, do the following:

    if (controls.startState) {
        ghostArr?.forEach((ghost, index) => {
            const {velocity, angle, position} = ghost;
       
            // Version 2= If ghost has toppled over clockwise or counterclockwise:
            // if ((angle < -1.6 || angle > 1.1) && !ghost.defeated) {
            if ((angle < -1.4 || angle > 1) && !ghost.bonusCounted) {
                
                saveData.currScore += ghost.points;
                ghost.bonusCounted = true;
                console.log('bonus awarded: ', ghost.points);
                showScores(saveData.currScore);

            } 
  
        });
    
    }

}

// Checks status of ghost(s)
// Find all non-defeated ghost that have stopped moving and see if they toppled over
const checkghostStatus = () => {

    // Helper function - converts rads to degrees
    const radsToDegs = (rads) => {  
        return rads * (180/Math.PI);
    }

    // Checks if ghost has toppled
    const isGhostToppled = (rads) => {
        // If ghost angle is <-80degs or> 57 degs, it is toppled (due to asymmetrial ghost body shape)

        const degs = radsToDegs(rads);

        if (degs < -80 || degs > 57) {
            return true;
        } else {
            return false;
        }

    }

    // Checks if ghost is upright (i.e.: after collisions)
    const isUpright = (rads) => {
        const degs = radsToDegs(rads);

        // Ghost is upright if the ghost's current angle is within -/+15 degrees
        let stableGhost = Math.abs((degs%360)) < 15;
        
        // If ghost has not experienced a full 360 rotation:
        if (rads < (360 * (Math.PI/180))) {
            return !isGhostToppled(rads);
        } else {
            return stableGhost;
        }
    }

    // Checks if ghost is moving
    const isGhostStatic = (velX, velY) => {
        const staticVel = 1e-12;
        if (Math.abs(velX) < staticVel && Math.abs(velY) < staticVel) {
            return true;
        } else {
            return false;
        }
    }

    // Checks if ghost has been knocked off the screen
    const isGhostOffScreen = (ghostX, ghostY) => {
        const {
            width,
            height,
        }
        = canvasProps;

        if ((ghostX > width || ghostX < 0) || (ghostY > height || ghostY < 0)) {
            return true;
        } else {
            return false;
        }
    }

    bodies.ghost.filter((eachGhost) => !eachGhost.defeated)
    ?.filter((ghost) => { return (isGhostStatic && isGhostToppled(ghost.angle) && !isUpright(ghost.angle) || isGhostOffScreen(ghost.position.x, ghost.position.y)) })
        ?.forEach((g) => {
                g.defeated = true;
                awardGhostHit(g.id);
            })
    
}

// Monitors for toppled over ghosts (ghosts can topple over from residual effects from previous interactions with the world)
const activateScoreListener = (status = true) => {
    const scoreListener = setInterval(checkghostStatus, 200);
    if (!status) {
        clearInterval(scoreListener);
    }
}

// Award points for any ghosts that were hit
const awardGhostTaps = () => {
    
    bodies.ghost.forEach((ghost) => {
        if (ghost.defeated && !ghost.scoreCounted) {
            saveData.currScore += ghost.tapPoints;
            showScores(saveData.currScore);
            ghost.scoreCounted = true;
        } 
    })

    console.log("Current score: ", saveData.currScore);

}

// Checks for game won
const checkGameWon = () => { 
    if  (bodies.ghost.every((ghost) => ghost.defeated)) {
        console.log("You won!");
        invokeGameWon();
        return true;
    }
}


// Turns ON/OFF matter.js listeners
const activateEngineListeners = (status) => {

    const ballProps = currLevelObj.ball;
    const slingProps = currLevelObj.slingProps;

    if (status) {
        Events.on(engine, 'collisionEnd', (e) => {
    
            const pairs = e.pairs;

            pairs?.forEach(pair => {
  
                if(pair.bodyA.label === 'ghost' || pair.bodyB.label === 'ghost'){
                    console.log(pair);
                    console.log('ghost was hit!')
                }

                // Only if ghost is hit BY ball:
                // if ((pair.bodyA.label === 'ghost') && (pair.bodyB.label === 'ball')) {
                //     saveData.ghostHits++;
                //     saveData.currScore += pair.bodyA.tapPoints;
                //     console.log('Ghost Hits Total: ', saveData.ghostHits);
                //     showScores(saveData.currScore);
                // }

                // if ((pair.bodyB.label === 'ghost') && (pair.bodyA.label === 'ball')) {
                //     saveData.ghostHits++;
                //     saveData.currScore += pair.bodyB.tapPoints;
                //     console.log('Ghost Hits Total: ', saveData.ghostHits);
                //     showScores(saveData.currScore);
                // }              

                // Award tap points
                // Check if ghost has toppled over

                //     // awardGhostHit(ghostArr, index);

                //     // TODO: add these two back later
                //     saveData.ghostHits++;
                    // scoreDetector(bodies.ghost);
                // }

            })
        })
    
        Events.on(engine, 'afterUpdate', () => {

            // If any ghosts have been defeated, award points
            // Also detect if ghosts have been toppled so that bonus points are awarded
            // if (bodies.ghost?.filter((ghost) => ghost.defeated).length > 0){
            //     awardGhostTaps();
            //     scoreDetector(bodies.ghost);
            //     checkGameWon();
            // }


            // If analyzingHit flag is true and at least one of the ghosts in the game has a x or y velocity component of approximately 0:
            // if (analyzingHit 
            //     && bodies.ghost.flatMap((ghost) => [ghost.velocity.x, ghost.velocity.y]).every((velocity) => velocity < Math.abs(1e-12))){  // check also for: OR ghost is off the map
            //     console.log("detecting!");
            //     scoreDetector(bodies.ghost);
            // }

            // scoreDetector(bodies.ghost);

            // if ((bodies.ghost[0]?.angle < -1.4 || bodies.ghost[0].angle > 1) && !bodies.ghost[0].defeated) {
            //     bodies.ghost[0].defeated = true;
            //     console.log('ghost 1 banished');
            // }


            // if ((bodies?.ghost[1]?.angle < -1.4 || bodies.ghost[0].angle > 1) && !bodies.ghost[1].defeated) {
            //     bodies.ghost[1].defeated = true;
            //     console.log('ghost 2 banished');
            // }

            // if (bodies.ghost.flatMap((ghost) => [ghost.velocity.x, ghost.velocity.y]).every((velocity) => velocity < Math.abs(1e-13))){  // check also for: OR ghost is off the map
                // if(bodies.ghost?.forEach(ghost => ghost.angle < -1.4 || ghost.angle > 1)){
                //     console.log("detecting!");
                //     console.log("banished");
                // }
                

              
            //     // scoreDetector(bodies.ghost);
            // }

             if (controls.firing && Math.abs(bodies.ball.position.x - slingProps.x) < 20 && Math.abs(bodies.ball.position.y - slingProps.y) < 20) {
                
                bodies.ball.collisionFilter.category = solid;
                bodies.ball.collisionFilter.mask = solid;
                
                bodies.ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

                World.add(engine.world, bodies.ball); // 'launches' the ball
                bodies.sling.bodyB = bodies.ball;
                controls.firing = false;
    
                console.log(controls.firing);
            }  
    
        });
    } else {
        Events.off(engine);
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
    
    activateEngineListeners(true);

    // Events.on(engine, 'collisionEnd', (e) => {

    //     const pairs = e.pairs;
       
    //     pairs?.forEach(pair => {
    //         // pair.bodyB.label === 'ghost' 
    //         console.log(pair);
    //         if (pair.bodyA.label === 'ghost' || pair.bodyB.label === 'ghost') {
    //             console.log('ghost was hit')
    //             console.log(bodies.ghost);
    //             saveData.ghostHits++;
    //             console.log(saveData.ghostHits);
    //             // World.remove(engine.world, bodies.ghost);
    //         }
    //     })

    // })

    // Events.on(engine, 'afterUpdate', () => {
    //      if (controls.firing && Math.abs(bodies.ball.position.x - slingProps.x) < 20 && Math.abs(bodies.ball.position.y - slingProps.y) < 20) {
            
    //         bodies.ball.collisionFilter.category = solid;
    //         bodies.ball.collisionFilter.mask = solid;

    //         bodies.ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

    //         World.add(engine.world, bodies.ball); // 'launches' the ball
    //         bodies.sling.bodyB = bodies.ball;
    //         controls.firing = false;

    //         console.log(controls.firing);
    //     }  

    //     scoreDetector(bodies.ghost);

    // });

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

    // This function can be used to load any SVG into an object in the game
    const addGhost = (ghostNum, ghostName, ghostTapPoints, ghostPoints, pngPath, svgPath, x, y) => {
        ([
            // './assets/ghost-freepik-inkscape-svg.svg', 
            svgPath
        ]).forEach(function(path, i) { 
            console.log("Path and i below");
            console.log(path);
            console.log(i);
           
            loadSvg(path).then(function(root) {
     
                const vertexSets = select(root, 'path')
                    .map(function(path) { return Matter.Vertices.scale(Svg.pathToVertices(path, 30), 0.15, 0.15); });
    
                bodies.ghost[ghostNum] = Bodies.fromVertices(i + x, i + y, vertexSets, {
                // bodies.ghost = Bodies.fromVertices(i + 650, i + 200, vertexSets, {
                    label: 'ghost',
                    render: {
                        fillStyle: 'yellow',
                        strokeStyle: '#f19648',
                        lineWidth: 1,
                        sprite: {
                            texture: pngPath,
                            xScale: 0.15,
                            yScale: 0.15
                        }
                    }
                }, true);

                bodies.ghost[ghostNum].name = ghostName;
                bodies.ghost[ghostNum].points = ghostPoints;
                bodies.ghost[ghostNum].tapPoints = ghostTapPoints
    
                World.add(engine.world, [bodies.ghost[ghostNum]]);

                bodies.ghost[ghostNum].collisionFilter = { category: solid, mask: solid };

                console.log(bodies.ghost[ghostNum]);
            });
        });
    }
    
    // In currLevelsObj.ghost, if any item is not an empty array:
    // Find the name of this item in the ghostTypes array
    // If there is a match, point the current ghost path to this path
    // invoke addGhost for as many entires of ghosts there are in currLevelsObj.ghost.easy/mid/hard
    // Keep doing this until all entires of easy, mid, and hard are iterated through and added to the map


    let currGhostCount = 0;

    // Function to iterate through the ghost property of the currLevelsObj and to load each and every ghost
    for (const eachGhostType in currLevelObj.ghost) {

        // If current ghost type is specified fo the current level:
        if (eachGhostType) {
            // Find the correct item within ghostType which matches this name
            const currGhostType = ghostTypes.find((type) => type.difficulty === eachGhostType)
    
            console.log(eachGhostType);
            console.log(currLevelObj.ghost[eachGhostType])
    
            // create a unique ghost name
            const ghostName = currGhostType.name + currGhostCount;
            
            const ghostTapPoints = currGhostType.perTapPoints;
            const ghostPoints = currGhostType.points;
    
            // Iterate through the current level object and add all ghosts specified
            currLevelObj.ghost[eachGhostType]?.forEach(ghost => {
                addGhost(currGhostCount, ghostName, ghostTapPoints, ghostPoints, currGhostType.pngPath, currGhostType.svgPath, ghost.x, ghost.y);
                currGhostCount ++;
            })
        }

    }

    //
    addPlatforms(levelParam);
 
    // Add items to world
    World.add(engine.world, [...bodies.groundPlane]);

}

// Loads level
const loadLevelTimer = () => {
    levelStates.timeLeft = currLevelObj.timer; // Load timer value
    levelStates.timeAtStart = currLevelObj.timer; // Load time-at-start value
}

const runEngine = () => {
    Runner.run(engine);
    Render.run(render);
}

// add all objects to the world
runEngine();

// Activates the main menu buttons
const activateIntroBtns = (status) => {
    if (status) {
        startGameBtn.addEventListener('click', () => {
            console.log("Let's start the game!");
            console.log(modalContainer)
            modalContainer.style="display: none";
        });
        instructionsBtn.addEventListener('click', () => {
            console.log("1) Click and drag the ball back, 2) Aim the ball, 3) Release the mouse to laynch the ball. ***Knock over all ghosts before the timer runs out***");
        });
    }
}

$(document).ready(async () => {
    activateIntroBtns(true);
    console.log('game is loaded!');
    await activateStartBtn(true);
    await addElements(currLevelObj);
    await activateScoreListener(); // checks if ghosts have toppled over (from ball hit, gravity, or residual changes to environment)
    await loadLevelTimer();

    console.log(engine.gravity.y) 
    // engine.gravity.y = 0.2;

    // Psuedocode
    // 1) Display arcade style start screen
    // 2) Show Loading status
    // 3) When loading is done, display Start Game and Instructions buttons 
    // 4) On Start Button Click, display 3, 2, 1 countdown and then begin game
    // 5) Run game
        // 5.1 (start countdown clock) 
       // 5.2 (i.e.: animate any objects as necessary)
    // 6) When timer runs out or when game is won, display modal to either restart or advance to next level
    // 7) Repeat above from step 2)


    // DEBUG Code only   
    const testBtn = document.querySelector('.testBtn');
    // button to debug game
    testBtn.addEventListener('click', () => {
        console.log(bodies.ghost);
        console.log(!!bodies.ghost?.filter((ghost) => ghost.defeated));
        checkghostStatus()
    //    Body.applyForce(bodies.ghost[0], {x: bodies.ghost[0].position.x, y: bodies.ghost[0].position.y}, {x: 0, y: -0.15});
        // scoreDetector(bodies.ghost);
    });


});