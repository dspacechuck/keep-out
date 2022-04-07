import { canvasProps, startBtnProps, renderConfig, ballOptions, groundOptions, moveModes, levels, ghostLevels, ghostTypes, saveData, scoreData, ghostVertices } from './config.js'; 

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
        showPerformance: false,
        background: 'rgba(0,0,0,0)',     
    }
}); 

// Define bodies
const bodies = {
    sling: null,
    ball: null, 
    groundPlane: [],
    platforms: [],
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
// const modal = document.querySelector('.modal');
// const preStartModal = document.querySelector('.preStartModal');
// const mainContents = document.querySelector('.mainContents');
const instructionsCont = document.querySelector('.instructions');
const preStartCounter = document.querySelector('.preStartModal .counter');
const levelEndModal = document.querySelector('.levelEndModal');
const nextLevelBtn = document.querySelector('.nextLevelBtn');
const restartLevelBtn = document.querySelector('.restartLevelBtn');

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
let currLevelObj = levels[saveData.currLevel];

// Setup bitmasks for collision filter
const solid = 0x0001;
const nextBall = 0x0004;

// Toggles mouse control ON/OFF
const activateMouse = (status) => {
    if (status) {
        Composite.add(engine.world, [controls.mouseConstraint]);
        Events.on(controls.mouseConstraint, 'enddrag', (e) => {
            if (e.body === bodies.ball) {
                controls.firing = true;
            }
        })
    } else {
        Events.off(controls.mouseConstraint);
        Composite.remove(engine.world, [controls.mouseConstraint]);
        console.log(bodies.sling);
    }
}


// Activate/deactivate buttons on Level End modal
const activateNextLevelBtn = (status) => {
    nextLevelBtn.disabled = !status;
}

const activateRestartBtn = (status) => {
    restartLevelBtn.disabled = !status;
}

// Toggles Level End Modal ON/OFF
const toggleLevelEndModal = (status, levelWon) => {
        
    const levelEndModalTl = gsap.timeline({paused: true});
    levelEndModalTl.fromTo('.levelEndModal', {display: 'none'}, {display: 'flex', duration: 0})
    .fromTo('.levelEndModal', {opacity: 0}, {opacity: 1, duration: 2})
    .fromTo('.modalContainer', {display: 'none'}, {display: 'flex', duration: 0})
    .fromTo('.modal', {display: 'none'}, {display: 'flex', duration: 0})
    
    if (status) {
        levelEndModalTl.play();
    } else if (!status) {
        levelEndModalTl.reverse();
    }

    if (levelWon) {
        activateNextLevelBtn(true);
    } else if (!levelWon){
        activateRestartBtn(true);
    }
}

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

const resetTimer = () => {
    tween.restart();
}

// Starts/pauses countdown timer
const countdownTimerMgr = () => {
    
    // Find current level
    console.log(currLevelObj);

    // If game state is ON, start timer
    if (controls.startState) {
        activateMouse(true);
        tween.play();
        console.log('timer running');
    } else {
        // pause timer
        activateMouse(false);
        tween.pause();
        console.log('timer paused');
    }
   
}

// TODO: consider removing or refactoring this later
const toggleStartButtonState = () => {
    if (controls.startState) {
        startBtn.innerHTML=startBtnProps.pauseString;
        startBtn.classList.add('btnAltProps');
        // stopEngine();
    } else {
        startBtn.innerHTML=startBtnProps.startString;
        startBtn.classList.remove('btnAltProps');
        // runEngine();
        // stopEngine();
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
        if(listenerOn) {
            startBtn.addEventListener('click', startBtnOps);
        } else {
            startBtn.removeEventListener('click', startBtnOps);
        }
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
    toggleLevelEndModal(true, true);
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
    const scoreListener = setInterval(checkghostStatus, 200); //polling rate = 200ms
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

             if (controls.firing && Math.abs(bodies.ball.position.x - slingProps.x) < 20 && Math.abs(bodies.ball.position.y - slingProps.y) < 20) {
                
                bodies.ball.collisionFilter.category = solid;
                bodies.ball.collisionFilter.mask = solid;
                
                bodies.ball = Bodies.circle(slingProps.x, slingProps.y, ballProps.radius, ballOptions);

                Composite.add(engine.world, bodies.ball); // 'launches' the ball
                bodies.sling.bodyB = bodies.ball;
                controls.firing = false;
    
                console.log(controls.firing);
            }  
    
        });
    } else {
        Events.off(engine);
    }


}

// const addMouseConstraint = () => {
//     controls.mouse = Mouse.create(render.canvas);
//     controls.mouseConstraint = MouseConstraint.create(engine, {
//         mouse: controls.mouse,
//         collisionFilter: {
//             category: nextBall
//         },
//         constraint: {
//             render: { visible: false }
//         }
//     });
// }

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

    // console.log(controls.mouseConstraint);

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

    // Composite.add(engine.world, [bodies.ball, controls.mouseConstraint, bodies.sling]);
    Composite.add(engine.world, [bodies.ball, bodies.sling]);
}

// const addSling = () => {
//     activateEngineListeners(true);
//     Composite.add(engine.world, [bodies.ball, bodies.sling]);
// }

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

    Composite.add(engine.world, bodies.platforms);
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
const addElements = async (levelParam) => {

    const addElPromise = new Promise((res, rej) => {
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

        console.log(currLevelObj);
        // if (currLevelObj.level === 1) {
            createSling(levelParam);
        // } else {
            // addSling();
        // }

        console.log("addElements levelParam: ", levelParam);
        
        groundPlanes.forEach((ground, i) => {
            bodies.groundPlane[i] = Bodies.rectangle(ground.x, ground.y, ground.width, ground.height, ground.options);
            console.log(bodies.groundPlane[i]);
        });



        // Bodies and body-supporting functions
        // bodies.groundPlane = Bodies.rectangle(150, 890, 1600, 20, groundOptions);
        
        // load a svg file and parse it with image/svg+xml params
        // const loadSvg = (filePath) => {
        //     return fetch(filePath)
        //         .then((res) => { return res.text(); })
        //         .then((raw) => { return (new window.DOMParser()).parseFromString(raw, 'image/svg+xml'); });
        // };

        // // 
        // var select = function(root, selector) {
        //     console.log(Array.prototype.slice.call(root.querySelectorAll(selector)))
        //     return Array.prototype.slice.call(root.querySelectorAll(selector));
        // };

        // This function can be used to load any SVG into an object in the game
        const addGhost = (ghostNum, ghostName, ghostTapPoints, ghostPoints, pngPath, svgPath, x, y) => {
            // ([
            //     // './assets/ghost-freepik-inkscape-svg.svg', 
            //     svgPath
            // ]).forEach(function(path, i) { 
            //     console.log("Path and i below");
            //     console.log(path);
            //     console.log(i);
            
            //     loadSvg(path).then(function(root) {
        
            //         const vertexSets = select(root, 'path')
            //             .map(function(path) { return Matter.Vertices.scale(Svg.pathToVertices(path, 30), 0.15, 0.15); });
        

            //     //    const vertexSets = Matter.Vertices.scale(ghostVertices, 0.15, 0.15);
                    
                    
            //         console.log('Vertex Sets');
            //         console.log(vertexSets);

                    bodies.ghost[ghostNum] = Bodies.fromVertices(x, y, ghostVertices, {
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
        
                    Composite.add(engine.world, [bodies.ghost[ghostNum]]);

                    bodies.ghost[ghostNum].collisionFilter = { category: solid, mask: solid };


            //     });
            // });
        }
        
        // In currLevelsObj.ghost, if any item is not an empty array:
        // Find the name of this item in the ghostTypes array
        // If there is a match, point the current ghost path to this path
        // invoke addGhost for as many entires of ghosts there are in currLevelsObj.ghost.easy/mid/hard
        // Keep doing this until all entires of easy, mid, and hard are iterated through and added to the map


        let currGhostCount = 0;

        // Function to iterate through the ghost property of the currLevelsObj and to load each and every ghost
        for (const eachGhostType in currLevelObj.ghost) {

            // If current ghost type is specified for the current level:
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
                console.log('ghosts added');
            }

        }

        //
        addPlatforms(levelParam);
        console.log('adding platforms')

        // Add items to world
        res(Composite.add(engine.world, [...bodies.groundPlane]));
        
    })    



    

}

// Sequence to load next level
const loadNextLevel = () => {
    // Remove sling
    // Remove ball
    // Remove elements

    // Load next level
    // Dismiss Level End modal
    // Start 3-2-1 modal 

    Composite.clear(engine.world, false, true);

    console.log("All composite bodies");
    console.log(Composite.allBodies(engine.world));

    bodies.groundPlane = [];
    bodies.platforms = [];
    bodies.ghost = [];

    currLevelObj = levels[saveData.currLevel];

    loadLevel();
    toggleLevelEndModal(false, true);
  
    activateEngineListeners(true);
    activateMouse(false);
    activateStartBtn(true);

    // Remove modals 
    // Change this to show 3-2-1 modal instead
    gsap.to('.modal', {display: 'none', duration: 0});
    gsap.to('.modalContainer', {display: 'none', duration: 0});

    resetTimer();

    startBtnOps();

    console.log("All composite bodies on new level");
    console.log(Composite.allBodies(engine.world));


}

// Loads level
const loadLevelTimer = () => {
    levelStates.timeLeft = currLevelObj.timer; // Load timer value
    levelStates.timeAtStart = currLevelObj.timer; // Load time-at-start value
    console.log("time left: ", levelStates.timeLeft);
    console.log("time at start: ", levelStates.timeAtStart);
}

const runEngine = () => {
    Runner.run(engine);
    Render.run(render);
}

// const stopEngine = () => {
//     // Runner.stop(engine);
//     // Render.stop(render);
// }

// Pre-start modal sequence
const preStartModalSequence = () => {

    const tl = gsap.timeline();
    tl.to('.instructions', {opacity: 0, duration: 0.2})
    .to('.instructions', {display: 'none', duration: 0})
    .to('.mainContents', {opacity: 0, duration: 0})
    .to('.mainContents', {display: 'none', duration: 0})
    .to('.modalContainer', {background: 'none', duration: 0})
    .to('.preStartModal', {display: 'flex', duration: 0})

}

// Shows the 3, 2, 1, countdown
const showPreStartModal = () => {

    let count = 3;
    let timeLeft = 3;

    const preStartTimer = gsap.from(preStartCounter, timeLeft, {
        ease: Linear.easeNone,
        paused: true,
        onUpdate: function(){
            timeLeft = count - Math.floor((preStartTimer.progress()*count));
            preStartCounter.innerHTML = timeLeft;
        },
        onComplete: function(){ 
            console.log("complete");

            const countdownDoneTl = gsap.timeline();

            countdownDoneTl.to('.preStartModal', {opacity: 0, duration: 0})
                .to('.preStartModal', {display: 'none', duration: 0})
                .to('.modal', {display: 'none', duration: 0})
                .to('.modalContainer', {display: 'none', duration: 0})

            // preStartModal.classList.add('hidden');
            // modal.classList.add('hidden');
            // modalContainer.classList.add('hidden');
            
            // Start game
            startBtnOps();
        }
    });

    preStartModalSequence();
    preStartTimer.play();

}

// Activates the main menu buttons
const activateIntroBtns = (status) => {
    
    let inStructionsTl;

    const checkBtnClick = () => {
        if (instructionsCont.classList.contains('show')) {
            inStructionsTl.kill();
        }
    }

    const onInstructionsComplete = () => {
        instructionsCont.classList.toggle('show');
    }

    const toggleInstructions = () => {

        inStructionsTl = gsap.timeline({paused: true, onUpdate: checkBtnClick(), onComplete: onInstructionsComplete()});
        inStructionsTl.fromTo('.instructions', {display: 'none'}, {display: 'flex', duration: 0})
            .fromTo('.instructions', {opacity: 0}, {opacity: 1, duration: 1});

        if (instructionsCont.classList.contains('show')) {
            inStructionsTl.play();
        } else {
            inStructionsTl.reverse();
        }
        
    }


    if (status) {
        startGameBtn.addEventListener('click', () => {
            console.log("Let's start the game!");
            console.log(modalContainer)
            showPreStartModal();
        });
        instructionsBtn.addEventListener('click', () => {
            toggleInstructions();
        });
    }
}

const activateLevelEndBtns = () => {

    nextLevelBtn.addEventListener('click', () => {
        // Remove all elements from the current level
        // Load next level
        // Load 3.2.1 screen again
        // Start game
        loadNextLevel();
    });
    restartLevelBtn.addEventListener('click', () => {

    });
    
}

const loadLevel = () => {
    // addMouseConstraint();
    const addedEl = addElements(currLevelObj)  
    Promise.resolve(addedEl)
        .then(() => {
            activateScoreListener();
            loadLevelTimer();
            console.log('everything loaded!');
            }
        )
}

$(document).ready(async () => {
    activateIntroBtns(true);
    console.log('game is loaded!');
    activateStartBtn(true);
    activateLevelEndBtns();
    loadLevel();
    // add all objects to the world
    runEngine();
    // const addedEl = addElements(currLevelObj)  
    // Promise.resolve(addedEl)
    //     .then(() => {
    //         activateScoreListener();
    //         loadLevelTimer();
    //         console.log('everything loaded!');
    //         }
    //     )
    
    // $.getScript("../lib/pathseg.js")
    // .done(function(script, textStatus) {
    //     console.log(textStatus);
    // })
    // .fail(function(jqxhr, settings, exception) {
    //     console.log("loading script failed.");
    // });

    // console.log(engine.gravity.y) 
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
        checkghostStatus();
        console.log(Composite.allBodies(engine.world));
        console.log('turn off mouse');
        activateMouse(false);
        // Body.applyForce(bodies.ghost[0], {x: bodies.ghost[0].position.x, y: bodies.ghost[0].position.y}, {x: 0, y: -0.15});
        // scoreDetector(bodies.ghost);
    });


});