// Keep Out - Protect the Halloween Kitty!
// By Charles Wong
//----------------------------------------------------
// Click on each ghost before they vanish to win points.  If the ghost or monster vanishes, damage is dealt to the associated wall.  Each wall's health is based on its border width (14px, 21px, or 28px).  Any time a ghost or monster vanishes, 7px of damage is dealt to its associated wall.  If the wall border decreases to 0px, all walls for the current ring (layer) is breached and ghost will advance to the next wall.  If the innermost wall is breached before the timer runs down to 0 seconds, the game is over.
//Game Mechanics:--------------------------------------
//1) The game timer starts at 100 seconds and counts down to 0.  
//2) If the innermost ring is not breached when the timer runs down to 0, the kitten is rescued and the player wins the game.
//3) If all the rings are breached before the timer (kitten rescue) runs out, the player loses.
//----------------------------------------------------
// Scoring:-------------------------------------------
// 1) 100 points is awarded for each ghost click on the outermost wall. 
// 2) An additional bonus of 100 points is awarded for each subsequent inner wall the ghost is banished from.  (i.e.: 200 points for a ghost click on the second from outermost wall)

// Load ready function and set global variables to defaults
$(document).ready(function () {
    let clickSuccessCount = 0;
    let score = 0;
    let reactionTime = []; // Array of all player reaction times in ms
    let resetReactionTime = true; // Decides if the click reaction time should be reset
    let noWallsLeft = false;
    let winImminentFlag = false;
    let timeCounter = 100;
    
    let ghostFadeInTime = 400;
    let ghostTravelSpeed = 600;
    let wallDamageInterval = 1600;

    let clock;
    let myTimeout;
    let ghostTaunt = false;
    let bordHealth = [0, 0, 0, 0];
    let borderThickness;
    let currentRing = 2;
    // Add a X and Y coordinate offset to ghost position if currentRing = 1 or CurrentRing = 0
    let ghostXYSpawn = 0;
    // Tracks if a wall has been damaged (if wallDamage function executed)
    let wallIsDamaged = false;
    // Tracks ring0, ring1, and ring2 outer traversible lenghts
    const ringlen = [270, 470, 690];
    // Tracks ring (TRACK WIDTH) for ring0, ring1, and ring2, respectively
    const ringTrackWidth = [14, 128, 28];
    // Track the current border that the ghost is adjacent to
    let currentBorder;
    
    const ghostClickSound = new Audio('./assets/power_up_ray-mike_koenig-half.mp3');
    const bgMusic = new Audio('./assets/strange09speed.mp3');

    // Variables to track click reaction time
    let tPrev;
    let tNow;

    const playClickSound = () => {
        if (ghostClickSound.pause()) {
            ghostClickSound.play();
        } else {
            ghostClickSound.pause();
            ghostClickSound.currentTime = 0;
            ghostClickSound.play();
        }
    }

    const bindArrowKeys = () => {
        document.addEventListener("keydown", (e) => {
            
            if (e.defaultPrevented) {
                return;
            }

            switch (e.key) {
                case "ArrowDown":
                    console.log(e);
                    console.log("Arrow Down");
                    // console.log(ghostClickSound);
                    playClickSound();
                    break;
                case "ArrowUp":
                    console.log("Arrow Up");
                    playClickSound();
                    break;
                case "ArrowLeft":
                    console.log("Arrow Left");
                    playClickSound();
                    break;
                case "ArrowRight":
                    console.log("Arrow Right");
                    playClickSound();
                    break;
            }
        })
    }

    bindArrowKeys();

    //Countdown timer to track game progress.  Starts at 100s
    const countdownTimer = () => {
        let remTime;
        clock = setInterval(function () {
            remTime = 2 * timeCounter;
            if (timeCounter > 0) {
                $('.myTime').text(`${timeCounter}s`);
                $('.timerDiv').css('width', '');
                $('.timerDiv').css('width', `${remTime}`);
            }

            if (timeCounter <= 0 && (noWallsLeft === false)) {
                invokeGameWon();
                clearInterval(clock);
            }
            timeCounter--;
        }, 1000);
    }

    // Function to reset countdown timer to default value and update its value and styling on infoPane
    const resetTimer = () => {
        timeCounter = 100;
        let timeProgBar = 2 * timeCounter;
        $('.myTime').text(`${timeCounter}s`);
        $('.timerDiv').css('width', `${timeProgBar}`);
        $('.timerDiv').css('background-color', 'orange');
    }

    // Function to turn off rufus event listener (ghost click listener off)
    const rufusOff = () => {
        $('.rufus').off('click', function () {

        });
    }

    // Function to update the game score
    // Update score if user clicked on ghost before current wall on current ring is (completely) damaged
    // Award an extra 100 points for each inner layer of ring traversed due to the ghost moving more on the screen (increased difficulty to catch the ghost)
    const updateScore = () => {
        if (!wallIsDamaged) {
 
            // Tiers of scoring based on reaction time:
            // 1) Below 1000 ms
            // 2) Between 1000 and 1500 ms
            // 3) Between 1500 and 1900 ms
            // 4) More than 1900 ms

            const currentReactionTime = reactionTime[reactionTime.length - 1];

            if (currentReactionTime <= 1000) {
                score += 1500;
            } else if (currentReactionTime > 1000 && currentReactionTime <= 1500 ) {
                score += 750;
            } else if (currentReactionTime > 1500 && currentReactionTime <= 1900 ) {
                score += 350;
            } 
            // score += Math.ceil((1 / reactionTime[reactionTime.length - 1] * 100000))

            $('.myScore').text(score);
            // Create dynamic score update effect
            $('.myScore').css('color', 'green');
            $('.myScore').css('font-size', '1.5rem');
            setTimeout(function () {
                $('.myScore').css('color', 'darkslateblue');
                $('.myScore').css('font-size', '1.4rem');
            }, 700);
        } else {

        }
        // Reset wallIsDamaged flag to false
        wallIsDamaged = false;
    }

    // Function to activate and style reset button after clicking on it
    const renderResetBtn = (myBtn) => {
        currentRing = 2;
        $(myBtn).html('RESET');
        // Add alternate class for start/reset button to enable new button background colour and hover properties
        $(myBtn).addClass('btnAltProps');
        // Remove primary class for start/reset button
        $(myBtn).removeClass('btnPrimaryProps');
    }

    // Function to disable ghost after game over 
    // (to prevent it from being clickable and points awarded once clicked)
    function disableGhost(thisGhost) {
        $(thisGhost).css('visibility', 'hidden');
        $('.rufus').css('opacity', '0');
    }

    // Function to enable ghost (after game reset or game over)
    // Render ghost visible for clicking, reset ghost opacity to 1, and reset ghost height
    function enableGhost(thisGhost) {
        $(thisGhost).css('visibility', 'visible');
        $('.rufus').css('height', '70px');
        $('.rufus').css('width', '70px');
        $('.rufus').css('opacity', '0.8');
    }

    //Function to reintroduce cat (after game reset)
    // Use jQuery animation function to reset cat to original size and position
    const enableCat = () => {
        $('.cat').css('opacity', '1');
        $('.cat').animate({
            width: '110px',
            height: '110px',
        }, 10, function () {
        });
    }

    // Reset Score function. 
    // Enforces current ring to be ring 2, wall damage to be false, and score to be 0
    const resetScore = () => {
        score = 0;
        currentRing = 2;
        wallIsDamaged = false;
        $('.myScore').html(score);
    }

    // Function to reset all ring's outer borders to full health
    const restoreBorders = () => {
        $('.ring0').css('border-width', '14px');
        $('.ring1').css('border-width', '21px');
        $('.ring2').css('border-width', '28px');
    }

    // Function to reset border health tracker
    // Each ring's border health = (ring # + 2) * 7
    function resetBordHealthTracker() {
        for (let i = 0; i < bordHealth.length; i++) {
            bordHealth[i] = (currentRing + 2) * 7;
        }
    }

    // Function to spawn new/next white ghost
    // This functions dispatches a new ghost (and deals wall damage) every 2 seconds unless the ghost is clicked before 2 seconds is up. -> If the ghost is clicked before 2 seconds is up, the ghost (.rufus) click event listener will dispatch the next ghost
    const dispatchGhost = () => {

        getSetClickTime();

        if (timeCounter > 0 || ghostTaunt === true) {
            let randGhostOpacity = (Math.random() * 0.4) + 0.1;

            $('.rufus').animate({
                opacity: randGhostOpacity,
            }, ghostFadeInTime, function () {

            });

            let randCoord;
            let randCoord2 = ringlen[2];
            // Generates and selects random wall to spawn ghost
            // 0 = top wall, 1 = right wall, 2 = bottom wall, 3 = left wall
            let randWall = Math.floor(Math.random() * 4);

            if (currentRing == 2) {
                ghostXYSpawn = 65;
                randCoord = Math.floor(Math.random() * 510) + 135;
            } else if (currentRing == 1) {
                ghostXYSpawn = 150;
                randCoord = Math.floor(Math.random() * 315) + 235;
            } else if (currentRing == 0) {
                ghostXYSpawn = 245;
                randCoord = Math.floor(Math.random() * 115) + 335;
            }

            // Revised coordinates for ghostTaunt === true only.
            // This prevents the now bigger ghost from traversing off the window
            if (ghostTaunt === true) {
                randCoord = randCoord / 2;
                randCoord2 = ringlen[2] / 2;
                ghostXYSpawn = 0;
            }

            // Assign ghost to appropriate wall (i.e. border) using randWall variable. randWall of 0 = top-border, randWall of 1 = right-border, randWall of 2 = bottom-border, randWall of 3 = left-border
            if (randWall == 0) {
                $('.rufus').css('left', `${randCoord}px`);
                $('.rufus').css('top', `${ringTrackWidth[2]}px`);
                animateDown(ghostXYSpawn);
                currentBorder = 'border-top';
            } else if (randWall == 1) {
                $('.rufus').css('left', `${randCoord2}px`);
                $('.rufus').css('top', `${randCoord}px`);
                animateLeft(ghostXYSpawn);
                currentBorder = 'border-right';
            } else if (randWall == 2) {
                $('.rufus').css('left', `${randCoord}px`);
                $('.rufus').css('top', `${randCoord2}px`);
                animateUp(ghostXYSpawn);
                currentBorder = 'border-bottom';
            } else if (randWall == 3) {
                $('.rufus').css('left', `${ringTrackWidth[2]}px`);
                $('.rufus').css('top', `${randCoord}px`);
                animateRight(ghostXYSpawn);
                currentBorder = 'border-left';
            }

            // Function to animate ghost down
            function animateDown(locOffset) {
                $('.rufus').animate({
                    top: `${locOffset}`,
                    left: "+=15",
                }, ghostTravelSpeed, function () {
                });
            }

            // Function to animate ghost left
            function animateLeft(locOffset) {
                $('.rufus').animate({
                    left: `-=${locOffset}`,
                }, ghostTravelSpeed, function () {
                });
            }

            // Function to animate ghost up
            function animateUp(locOffset) {
                $('.rufus').animate({
                    top: `-=${locOffset}`,
                }, ghostTravelSpeed, function () {
                });
            }

            // Function to animate ghost right
            function animateRight(locOffset) {
                $('.rufus').animate({
                    left: `${locOffset}`,
                }, ghostTravelSpeed, function () {
                });
            }

            // Render ghost visible for clicking
            $('.rufus').css('visibility', 'visible');
            $('.rufus').css('opacity', '0.5');

            // Inflict damage to the current wall ONLY if clock has not counted down to 0 during the time setTimeout is counting down to execute its own function.  
            // Also, don't run wallDamage function if the ghost is only being dispatched for taunts
            myTimeout = setTimeout(function () {
                if (winImminentFlag === false) {
                    if (ghostTaunt === false) {
                        wallDamage(currentBorder, randWall);
                    }
                    dispatchGhost();
                }
            }, wallDamageInterval);
        }
    }

    // Function to decrease wall health
    // Check to see which wall we are on (i.e.: which is the outermost wall where bordHealth is NOT 0)
    // Determine current location of ghost relative to current ring
    // i.e. check current ghost location x and y offset from closest wall
    // Update wall (border) thickness
    // Update bordHealth array
    function wallDamage(borderToDamage, borderID) {

        // Translates into "${border-side}-width" format
        let borderToDamageSyntax = `${borderToDamage}-width`;

        // Translates into "ring{currentRing}"  (i.e.: ring0, ring1, ring2) format
        let activeRingSyntax = `ring${currentRing}`;

        // GET the current border thickness of the border to be damaged. Note parseInt required to extract numeric value without "px" suffix
        // borderThickness = parseInt($('.ring2').css(`${borderToDamageSyntax}`));
        borderThickness = parseInt($(`.${activeRingSyntax}`).css(`${borderToDamageSyntax}`));

        // Invoke function to destroy targetted wall with specified border with a damage of 7
        destroyWall(activeRingSyntax, borderToDamage, 7, 'red');

        // Check if any of the borders on the current ring === 0.  
        // If so: 1) Destroy all other walls on current ring
        //2) Advance ghost to next ring and update border health (bordHealth) array
        //3) Animate cat
        updateBordHealth(borderThickness, borderID);
        if (checkForWallBreach()) {

            // Animate cat after destroying all walls in current ring
            if (destroyRemnantWalls()) {
                animateCat();
            }

            //If .ring0 has collapsed AND time counter has more than 1 second remaining (to prevent overlap of this function and the catTeleport function)
            // This scenario occurs if the game ends before timer runs to 0 seconds (i.e. Game Over regardless of timeCounter >0 or not)
            if (currentRing <= 0) {
                noWallsLeft = true;
                invokeGameOver();
            }
            resetBordHealthTracker();
            currentRing -= 1;
        };
    }

    // Shakes the map when ghost is banished
    const shakeMap = (clickReactionTime) => {
    let playSpeed;
    let magnitude;

        if (clickReactionTime < 1000) {
            // playSpeed = 1;
            magnitude = 3;
        } else if (clickReactionTime >= 1000 && clickReactionTime < 1500) {
            // playSpeed = 0.7;
            magnitude = 1.5;
        } else {
            // playSpeed = 0.5;
            magnitude = 0.5;
        }

        const timeline = gsap.timeline({ defaults: { duration: 0.02 } });
        // timeline.timeScale(playSpeed);

        timeline
        .to('.outer', { duration: 0.02, ease: "power2.out", x: +magnitude })
        .to('.outer', { duration: 0.02, ease: "power2.out", x: -magnitude })

    }
 
    // Sets and gets the player's click reaction time. Does not set if the ghost has just damaged a wall.
    const getSetClickTime = () => {

        if (resetReactionTime === true) {
            if (!tPrev) {
                tPrev = new Date();
            } else {
                tNow = new Date();
                const clickTime = Math.abs(tNow - tPrev);
                reactionTime.push(clickTime);
                console.log("Your click reaction time: ", clickTime, "ms");
                shakeMap(clickTime);
                tPrev = tNow = undefined;
            }
        }
        
    }

    // Tracks how many times the player has clicked on the ghost successfully
    // Progressively increases the difficulty of the game accordingly
    const successfulClickCount = () => {
        clickSuccessCount++;
        console.log(clickSuccessCount);
        if (clickSuccessCount % 3 === 0) {
            ghostFadeInTime /= 2;
            console.log("ghost fade-in time: ", ghostFadeInTime);
        }

        if (clickSuccessCount % 4 === 0) {
            ghostTravelSpeed /= 2;
            console.log("ghost travel speed: ", ghostTravelSpeed);
            wallDamageInterval -= 150;
            console.log("wall damage interval: ", wallDamageInterval);
        }
    }

    // Function to invoke game over sequence (player lost)
    // Stops clock countdown, unbinds the click event listener from the ghost, and make the ghost dance around the screen.
    const invokeGameOver = () => {
        $('.myTime').css('font-size', '1.4rem');
        $('.myTime').text(`Game Over.`);
        $('.timerDiv').css('width', '200');
        $('.timerDiv').css('background-color', 'red');
        clearInterval(clock);
        rufusOff();
        ghostDance();

        // Remove ghost from map. This is syncrhonized with the end of the ghostDance animation at 3 seconds
        setTimeout(function () {
            disableGhost($('.rufus'));
            // Set ghostTaunt === true. -> displatch ghost but not respond to clicks for score updates
            ghostTaunt = true;
            // Dispatch white ghost once again. This makes him dance around the screen unless he is dismissed with one last click
            dispatchGhost();
            $('.rufus').css('opacity', '0.5');
        }, 3000);

        //Enforce timeCounter to be -1 to stop ghosts from dispatching AFTER ghost is clicked one last time
        timeCounter = -1;
    }

    // Function to invoke game won sequence (player won)
    const invokeGameWon = () => {
        winImminentFlag = true;
        $('.myTime').css('font-size', '1.4rem');
        $('.timerDiv').css('width', '200px');
        $('.myTime').text(`You Win!`);
        $('.myTime').css('color', 'darkslateblue');
        $('.timerDiv').css('background-color', 'rgb(10,113,205)');
        clearInterval(clock);
        catTeleport();
    }

    // Function to hide cat's speech bubble. Use this after game resets
    const hideSpeechBubble = () => {
        $('.catSpeechBubbleOuter').animate({
            opacity: 0,
        }, 10, function () {
        });
    }

    // Function to animate cat (in respone to destroyed wall)
    // Cat will respond differently if all walls are destroyed
    const animateCat = () => {
        if (currentRing !== 0) {
            $('.cat').animate({
                opacity: 0.1,
            }, 600, function () {
            });
            $('.cat').animate({
                opacity: 1,
            }, 900, function () {
            });
        } else {
            $('.cat').animate({
                opacity: 0,
                width: "-=0",
                height: "-=0",
            }, 1700, function () {
            });
        }
    }

    // Function to teleport cat away if player can keep all walls from collapsing before the time runs out.
    const catTeleport = () => {
        //Expand cat out of box
        $('.cat').animate({
            height: '+=30',
            width: '+=30',
        }, 1000, function () {
        });

        $('.catSpeechBubbleOuter').animate({
            opacity: 1,
        }, 1500, function () {
        });

        // Starting from .ring0 and going to .ring3
        // Destroy every ring (wall) to free cat and "animate" this in green
        for (i = 0; i < 4; i++) {
            destroyWall(`ring${i}`, 'border', i + 7 * i, 'green');
        }

        //Fade away ghost
        $('.rufus').animate({
            opacity: 0,
        }, 1000, function () {
        }
        );

        // Disable ghost
        disableGhost($('.rufus'));
    }

    // Function to make ghost dance if all rings are destroyed
    function ghostDance() {
        $('.rufus').css('left', `360px`);
        $('.rufus').css('top', `225px`);
        $('.rufus').animate({
            opacity: 0.7,
            left: '+=130',
            top: '+=130',
            height: '+=100',
            width: '+=100',
        }, 1000, function () {
        });
        $('.rufus').animate({
            opacity: 0.3,
            left: '-=130',
            top: '-=130',
            height: '+=100',
            width: '+=100',
        }, 1000, function () {
        });
        $('.rufus').animate({
            opacity: 0,
            left: '390',
            top: '390',
            height: '+=100',
            width: '+=100',
        }, 1000, function () {
        });
    }

    // Function to destroy a single wall by 7px per hit
    // Highlights wall in red and then decrement its border width by damageAmt 
    function destroyWall(targetRing, targetBorder, damageAmt, dmgColor) {
        wallIsDamaged = true;
        resetReactionTime = false;
        // Set border color to red momentarily for 400ms to signal wall damage
        $(`.${targetRing}`).css(`${targetBorder}-color`, dmgColor);
        setTimeout(function () {
            $(`.${targetRing}`).css(`${targetBorder}-color`, ' rgb(67, 44, 90)');
        }, 400
        );

        borderThickness -= damageAmt;
        // Update the border thickness on the map after 700 ms
        setTimeout(function () {
            $(`.${targetRing}`).css(`${targetBorder}-width`, `${borderThickness}px`);
        }, 700
        );
        return true;
    }

    // Function to destroy other walls on same ring (i.e.: enforce border-width = 0)
    function destroyRemnantWalls() {
        setTimeout(function () {
            // Add thisRing variable since currentRing would have decreased by 1 in original loop due to setTimeout asynchronous delay
            let thisRing = currentRing + 1;
            $(`.ring${thisRing}`).css('border-width', '0px');
        }, 700);
        return true;
    }

    // Function to update array for border health
    function updateBordHealth(presentBorder, currBordID) {
        bordHealth[currBordID] = presentBorder;
    }

    // Function to check for wall breach of current wall
    function checkForWallBreach() {
        for (let i = 0; i < bordHealth.length; i++) {
            if (bordHealth[i] == 0) {
                breachedWallID = i;
                return true;
            }
        }
    }

    // Refresh game on Start button click
    $('.startBtn').on('click', function (e) {
        e.preventDefault();
        // bgMusic.play();
        // bindArrowKeys();
        clearInterval(clock);
        clearTimeout(myTimeout);
        ghostTaunt = false;
        // Stop all animations if they are still running or about to run in the queue from the previous game
        $('.rufus').stop();
        $('.cat').stop();
        $('.catSpeechBubbleOuter').stop();
        // Hide the cat's speech bubble.
        hideSpeechBubble();
        // Set noWallsLeft variable to false
        noWallsLeft = false
        // Reset game win imminent flag to false
        winImminentFlag = false;
        // Invoke Reset button
        renderResetBtn(this);
        resetTimer();
        resetScore();
        restoreBorders();
        resetBordHealthTracker();
        countdownTimer();
        enableCat();
        enableGhost($('.rufus'));
        dispatchGhost();
    });

    $('.rufus').on('click', function () {
        ghostClickSound.play();
        successfulClickCount();
        resetReactionTime = true;
        getSetClickTime();
        // clickSuccessCount();
        // Clear timeout (for wall damage) (and for dispatchGhost loop) if ghost is clicked on
        clearTimeout(myTimeout);
        // Stop all ghost animations if they are still running from before the click
        $('.rufus').stop();
        // Disables ghost immediately after user clicked on it (prevents multiple points scoring)
        disableGhost(this);

        // Dispatch the next ghost after 1500ms if the time counter has not run down to 0 and if there are still walls left
        if (timeCounter > 0 && !noWallsLeft) {
            myTimeout = setTimeout(function () {
                dispatchGhost();
            }, 1500);
        }
        // Performs checking to see if user clicked on ghost before wall breached and then Update current score
        updateScore();
    });

});