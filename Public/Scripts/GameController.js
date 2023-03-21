// @input Component.ScriptComponent[] stateSettings

// @ui {"widget":"separator"}

// @ui {"label":"UI"}

// @input Component.Text[] scoreTexts
// @input Component.Text[] highScoreTexts

// @input Component.Text counter
// @input Component.Image sphereCounter
// @input Component.Image[] Instructions
//@input float delayTime = 1.0

// @ui {"widget":"separator"}

// @ui {"label":"Tweens"}

//@input SceneObject tryAgain
//@input SceneObject Triggers

// @ui {"widget":"separator"}

// @ui {"label":"Script"}

// @input Component.ScriptComponent characterController

// @ui {"widget":"separator"}

// @ui {"label":"Face Effects"}

// @input SceneObject bigMouth
// @input SceneObject sadEffect


const audioPlayer = script.getSceneObject().createComponent("Component.AudioComponent");

// Time variables
var time = 0;
var deltaTime = 0;
var timeSpeed = 0;
var pendingTimeSpeed = 0;

function getAccelaration() {
    if(script.characterController && script.characterController.api.accelaration)
    {
        return script.characterController.api.accelaration
    } else {
        return 1;
    }
}

// Score variables
var currentScore = 0;

// Time Management
function onUpdate(eventData) {
    // Update time variables
    timeSpeed = pendingTimeSpeed;
    deltaTime = global.getDeltaTime() * timeSpeed;
    time += deltaTime;
}
script.createEvent("UpdateEvent").bind(onUpdate);

var stateSettings = {};
for (var i = 0; i < script.stateSettings.length; i++) {
    var settings = script.stateSettings[i].api.stateSettings;
    stateSettings[settings.stateName] = settings;
}

// Create our state machine
var stateMachine = new global.StateMachine("GameState", script);
stateMachine.onStateChanged = notifyStateChanged;

// Our custom function for adding states. We do some processing on the config specific for GameController.
function addState(config) {
    var stateName = config.name;
    var settings = stateSettings[stateName];

    config.onEnter = combineFuncs(function() {
        // Enable objects for this state
        enableObjectsForState(stateName);

        // Clear object children
        settings.clearChildren.forEach(destroyChildren);

        // Configure time speed
        setGameSpeed(settings.timeSpeed);

        // Send BehaviorScript custom trigger signal
        if (global.scBehaviorSystem) {
            global.scBehaviorSystem.sendCustomTrigger("enter_state_" + stateName);
        }
    }, config.onEnter);

    config.onExit = combineFuncs(function() {
        // Send BehaviorScript custom trigger signal
        if (global.scBehaviorSystem) {
            global.scBehaviorSystem.sendCustomTrigger("exit_state_" + stateName);
        }
    }, config.onExit);

    // Add onUpdate function for time acceleration
    if (settings.timeAccel > 0) {
        var oldUpdate = config.onUpdate;
        config.onUpdate = function() {
            //var newSpeed = getAccelaration();
            var newSpeed = 1;
            setGameSpeed(newSpeed);
            if (oldUpdate) {
                oldUpdate();
            }
        };
    }

    return stateMachine.addState(config);
}

// Now, add the states
var states = {};

states.intro = addState({
    name: "Intro",
    onEnter: function(name) {        
        script.Instructions[0].enabled = false;
        setScore(0);
    }
});
states.intro.addSimpleSignalTransition("Game", "screenTapped");

states.game = addState({
    name: "Game",
    onEnter: function(name) { 
        var isOn = false;
        global.tweenManager.startTween(script.Triggers, "OpenMouth_Instruction");
        
        script.counter.enabled = true;
        script.sphereCounter.enabled = true;
	    script.Instructions[0].enabled = true;
        
        var count = 4;
        var intialCount = 3;
        script.counter.text = intialCount.toString();
        function onDelay( eventData )
        {
            count--;
            if(count >= 0)
            {
            script.counter.text = count.toString();
            delayedEvent.reset(1.0);
            } else {
                script.counter.enabled = false;
                script.sphereCounter.enabled = false;
                script.Instructions[0].enabled = false;
            }
        }
        
        var delayedEvent = script.createEvent("DelayedCallbackEvent");
        delayedEvent.bind( onDelay );
        delayedEvent.reset(script.delayTime);
        
    },
    onSignal: {
        addPoints: function(points) {          
            colliderName = global.getColliderName();
            points = 1;          
            addScore(points);
        }
    }
});
states.game.addSimpleSignalTransition("GameOver", "gameOver");

states.gameOver = addState({
    name: "GameOver",
    onEnter: function() {
        global.tweenManager.startTween(script.tryAgain, "tryAgain");
    }
});
states.gameOver.addSignalTransition("Intro", function(signal, data) {
    return (signal == "screenTapped" && this.state.stateElapsedTime >= 1.5);
});

script.createEvent("MouthOpenedEvent").bind(function(eventData) {    
    stateMachine.sendSignal("screenTapped");
});

function setGameSpeed(speed) {
    pendingTimeSpeed = speed;
}

function setScore(score) {
    currentScore = score;
    setStringOnTexts(script.scoreTexts, score.toString());
}

function addScore(amount) {    
    setScore(currentScore + amount);
    if (global.scBehaviorSystem) {
        global.scBehaviorSystem.sendCustomTrigger("scoreIncreased");
    }
}

var stateChangedCallbacks = [];
function notifyStateChanged(newStateName, oldStateName) {
    for (var i = 0; i < stateChangedCallbacks.length; i++) {
        if (stateChangedCallbacks[i]) {
            stateChangedCallbacks[i](newStateName, oldStateName);
        }
    }
}

// Public API
global.gameController = {};

// Game State API
global.gameController.sendSignal = function(signal) {
    stateMachine.sendSignal(signal);
};

global.gameController.getCurrentStateName = function() {
    return stateMachine.currentState.name;
};

global.gameController.addStateChangedCallback = function(callback) {
    stateChangedCallbacks.push(callback);
};

// Game Speed API
global.gameController.getGameTime = function() {
    return time;
};

global.gameController.getDeltaGameTime = function() {
    return deltaTime;
};

global.gameController.getGameSpeed = function() {
    return timeSpeed;
};

global.gameController.setGameSpeedNextFrame = setGameSpeed;

// Finally, enter the intial state
stateMachine.enterState("Intro");

// Helper functions

function enableObjectsForState(stateName) {
    // First, disable all objects in other state sets
    Object.keys(stateSettings).forEach(function(setName) {
        if (setName !== stateName) {
            setObjectsEnabled(stateSettings[setName].enabledObjects, false);
        }
    });

    // Now, enable all objects in the target state set
    setObjectsEnabled(stateSettings[stateName].enabledObjects, true);
}

function setObjectsEnabled(objects, enabled) {
    if (objects) {
        for (var i = 0; i < objects.length; i++) {
            if (objects[i]) {
                objects[i].enabled = enabled;
            }
        }
    }
}

function destroyChildren(obj) {
    if (obj) {
        var count = obj.getChildrenCount();
        for (var i = 0; i < count; i++) {
            obj.getChild(0).destroy();
        }
    }
}

function setStringOnTexts(texts, newString) {
    for (var i = 0; i < texts.length; i++) {
        if (texts[i]) {
            texts[i].text = newString;
        }
    }
}

function combineFuncs(funcA, funcB) {
    if (funcA && funcB) {
        return function() {
            funcA();
            funcB();
        };
    }
    return funcA || funcB || null;
}
