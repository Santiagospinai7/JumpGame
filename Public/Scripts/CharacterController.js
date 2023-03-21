// -----JS CODE-----
// CharacterController.js
// Version: 0.0.2
// Description: Controls the character state and behavior.

// @input bool showAdvanced = false

// @ui {"widget":"group_start", "label":"Position Variables", "showIf":"showAdvanced"}
//@input vec3 idlePosition;
//@input vec3 gamePosition;
//@input vec3 idleScale;
//@input vec3 gameScale;
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Movement Variables", "showIf":"showAdvanced"}
// @input float groundY = -12.5
// @input float limitUpY = 15
// @input float gravity = -250

// @input float jumpVelocity = 180
// @input float shortJumpVelocity = 70
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Object Refs", "showIf":"showAdvanced"}
// @input Component.ScriptComponent collider
// @input SceneObject visualRoot
// @ui {"widget":"group_end"}

// @ui {"widget":"group_start", "label":"Effects"}
//@input SceneObject yellowEffect
//@input SceneObject redEffect
//@input vec4 redColor {"widget":"color"}
//@input vec4 normalColor {"widget":"color"}

// @ui {"widget":"group_end"}

var delayedEvent = script.createEvent("DelayedCallbackEvent");

//Constants
const groundY = script.groundY;
const limitUpY = script.limitUpY;
const idlePosition = script.idlePosition;
const gamePosition = script.gamePosition;
const gravity = script.gravity;

const jumpVelocity = script.jumpVelocity;
const shortJumpVelocity = script.shortJumpVelocity;

const visualRootTransform = script.visualRoot.getTransform();

const collider = script.collider.api.collider;

// Inputs
var touchJustStarted = false;
var touchJustEnded = false;
var touchBeingHeld = false;

// Movement state
var vertVelocity = 0;
var currentTexture = null;

var collisionCounter = 0;
script.api.accelaration = 1;

// State Machine
var stateMachine = new global.StateMachine("CharacterState", script);

var idleState = stateMachine.addState({
    name: "Idle",
    onEnter: function() {
        // Make sure character is at ground level     
        
        var playerTexture = script.visualRoot.children[1].getFirstComponent("Component.MeshVisual");
        playerTexture.mainPass.baseColor = script.normalColor; 
        
        var visualPos = visualRootTransform.getLocalPosition();
        var visualScale = visualRootTransform.setLocalScale(script.idleScale);
        visualPos = idlePosition;
        visualRootTransform.setLocalPosition(visualPos);
    }
});
idleState.addSimpleSignalTransition("Game", "gameStarted");

var states = {};

states.game = stateMachine.addState({
    name: "Game",
    onEnter: function() {
        var visualPos = visualRootTransform.getLocalPosition();
        var visualScale = visualRootTransform.setLocalScale(script.gameScale);
        visualPos = gamePosition;
        visualRootTransform.setLocalPosition(visualPos);
        touchJustStarted = false;
        touchJustEnded = false;
        collisionCounter = 0;
        script.api.accelaration = 1;
    },
    onUpdate: gameUpdate,
    onSignal: {
        finish: function(collider) {
            var playerTexture = script.visualRoot.children[1].getFirstComponent("Component.MeshVisual");           
            playerTexture.mainPass.baseColor = script.redColor;    
            
            global.gameController.sendSignal("gameOver");
            var otherPos = collider.getCenter();
        },
        hitCollectible: function(collider) {
            var otherObject = collider.sceneObject;
            if (!global.isNull(otherObject)) {
                global.gameController.sendSignal("addPoints", 1);
                otherObject.destroy();
            }
        }
    }
});

states.dead = stateMachine.addState({
    name: "Dead",
    onEnter: function() {

    }
});

stateMachine.enterState("Idle");

function sendStateSignal(signal, data) {
    stateMachine.sendSignal(signal, data);
}

function onGameStateChanged(newStateName, oldStateName) {
    if (newStateName == "Intro") {
        stateMachine.enterState("Idle");
    }
    if (newStateName == "Game") {
        sendStateSignal("gameStarted");
    }
    if (newStateName == "GameOver") {
        stateMachine.enterState("Dead");
    }
}
global.gameController.addStateChangedCallback(onGameStateChanged);

function onObstacleCollision(otherCollider) {
    sendStateSignal("finish", otherCollider);
}
collider.addOnEnterCallback("obstacle", onObstacleCollision);

function onCollectibleCollision(otherCollider) {
    global.tweenManager.startTween( script.yellowEffect, "yellowEffect" );
    
    colliderName = global.showProps(otherCollider);
    global.setColliderName(colliderName);
    
    sendStateSignal("hitCollectible", otherCollider);
}
collider.addOnEnterCallback("collectible", onCollectibleCollision);

function onTouchStart(eventData) {
    touchJustStarted = true;
    touchBeingHeld = true;
}
script.createEvent("MouthOpenedEvent").bind(onTouchStart);

function onTouchEnd(eventData) {
    touchJustEnded = true;
    touchBeingHeld = false;
}
script.createEvent("MouthClosedEvent").bind(onTouchEnd);

function addAcceleration() {
    //script.api.accelaration = script.api.accelaration + 0.5;
}

function gameUpdate(eventData) {
    //var deltaTime = global.getDeltaTime();
    var deltaTime = 0.025;
    
    //vertVelocity += gravity * deltaTime;
    vertVelocity += gravity * deltaTime;
    print("VELOCITY: " + vertVelocity)

    var pos = visualRootTransform.getLocalPosition();

    // Cut off velocity if touch ended
    if (touchJustEnded && vertVelocity > shortJumpVelocity) {
        vertVelocity = shortJumpVelocity;
    }

    pos.y += vertVelocity * deltaTime;

    if (pos.y <= groundY) {
        print("Murio");
        pos.y = groundY;
        vertVelocity = 0;
    }
    
    if (pos.y >= limitUpY) {
        print("Murio");
        pos.y = limitUpY;
        vertVelocity = 0;
    }

    visualRootTransform.setLocalPosition(pos);

    if (touchJustStarted > 0) {
        vertVelocity = jumpVelocity;
    }

    touchJustStarted = false;
    touchJustEnded = false;
}

function sign(x) {
    return ((x > 0) - (x < 0)) || +x;
}

function approximately(a, b) {
    return Math.abs(a - b) <= Number.EPSILON;
}

function moveTowards(current, target, max) {
    if (Math.abs(target - current) <= max) {
        return target;
    }
    return current + sign(target - current) * max;
}
