// Feature definitions for Happy Wheels Mod
// This file contains all the mod features that can be activated

class Vector2D {
  constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
  }
  
  add(v) {
      return new Vector2D(this.x + v.x, this.y + v.y);
  }
  
  subtract(v) {
      return new Vector2D(this.x - v.x, this.y - v.y);
  }
  
  multiply(scalar) {
      return new Vector2D(this.x * scalar, this.y * scalar);
  }
  
  divide(scalar) {
      return new Vector2D(this.x / scalar, this.y / scalar);
  }
  
  magnitude() {
      return Math.sqrt(this.x * this.x + this.y * this.y);
  }
  
  normalize() {
      const mag = this.magnitude();
      if (mag === 0) return new Vector2D(0, 0);
      return new Vector2D(this.x / mag, this.y / mag);
  }
  
  clampMagnitude(maxMagnitude) {
      const mag = this.magnitude();
      if (mag <= maxMagnitude) return this;
      return this.normalize().multiply(maxMagnitude);
  }
  
  distanceTo(v) {
      return this.subtract(v).magnitude();
  }
  
  static zero() {
      return new Vector2D(0, 0);
  }
}

// GodMode - Prevents character death
HWMod.addFeature("GodMode", "bool", {}, (e) => {
  if (e.currentTarget && e.currentTarget._character && e.currentTarget._character._dead) {
    e.currentTarget._character._dead = false;
  }
})

// Infinite Boost - Sets boost to a high value to make it basically infinite
HWMod.addFeature("Infinite Boost", "bool", {}, (e) => {
  if (e.currentTarget && e.currentTarget._character) {
    e.currentTarget._character.boostMax = 9999;
  }
})

// Zero Gravity - Removes gravity
HWMod.addFeature("Zero Gravity", "bool", {}, (e) => {
  if (e.currentTarget && e.currentTarget.m_world) {
    e.currentTarget.m_world.m_gravity.y = 0;
  }
}, (e) => {
  // Revert function - restore normal gravity
  if (e.currentTarget && e.currentTarget.m_world) {
    e.currentTarget.m_world.m_gravity.y = 10;
  }
})

// Zero Gravity - Removes gravity
HWMod.addFeature("Zero Gravity Alt", "bool", {}, (e) => {
  if (e.currentTarget && e.currentTarget._character) {
      e.currentTarget._character.centralBody.m_force.y = -10;
  }
}, (e) => {
  // Revert function - restore normal gravity
  if (e.currentTarget && e.currentTarget.m_world) {
      e.currentTarget._character.centralBody.m_force.y = 0;
  }
})

function getMouseWorldPosition(game) {
  if (!game.camera) return { x: 0, y: 0 };
  
  const world_screen_top = game.camera.screenBounds.top;
  const world_screen_left = game.camera.screenBounds.left;
  
  const mouse_world_x = (world_screen_left + game.mouseX) / game.camera.m_physScale;
  const mouse_world_y = (world_screen_top + game.mouseY) / game.camera.m_physScale;

  return {
    x: mouse_world_x,
    y: mouse_world_y
  }
}

let prevFocus = null;
function freezeCamera(game, freeze) {
  if (!game.camera) return;

  if (freeze) {
    if (!prevFocus)
      prevFocus = game.camera._focus;

    const midX = game.camera.midScreenPoint.x;
    const midY = game.camera.midScreenPoint.y;

    game.camera.displacement.x = midX * game.camera.m_physScale;
    game.camera.displacement.y = midY * game.camera.m_physScale;

    game.camera._focus = game.m_world.m_groundBody;
    return;
  }

  if (prevFocus)
    game.camera._focus = prevFocus;
  else
    game.camera._focus = game._character.centralBody;
  
  game.camera.displacement.x = 0;
  game.camera.displacement.y = 0;
  prevFocus = null;
}

// Grab - Grab everything with a mouse
let grabbedBody = null;
HWMod.addFeature("Grab (using mouse)", "bool", {}, (e) => {
  if (!HWMod.isMouseDown(0) || !e.currentTarget) {
    if (grabbedBody) {
      grabbedBody = null;
    }
    //freezeCamera(e.currentTarget, false);
    return;
  } 

  const mouse_world_position = getMouseWorldPosition(e.currentTarget);
  const mouse_vector = new Vector2D(mouse_world_position.x, mouse_world_position.y);
  const grab_distance = 0.1;
  const strength = 30;
  const maxForce = 80;

  if (!grabbedBody) {
    let currentBody = e.currentTarget.m_world.m_bodyList;

    while (currentBody.m_next) {
      const cur_position = currentBody.GetPosition();
      const cur_vector = new Vector2D(cur_position.x, cur_position.y);

      if (cur_vector.distanceTo(mouse_vector) < grab_distance) {
        grabbedBody = currentBody;
        break;
      }

      currentBody = currentBody.m_next;
    }
    //freezeCamera(e.currentTarget, true);
  }
  
  if (grabbedBody) {
    const cur_position = grabbedBody.GetPosition();
    const cur_vector = new Vector2D(cur_position.x, cur_position.y);

    const delta_vector = mouse_vector.subtract(cur_vector);

    const velocity = delta_vector.multiply(strength)

    const clamped_velocity = velocity.clampMagnitude(maxForce)

    grabbedBody.IsSleeping() && grabbedBody.WakeUp();
    grabbedBody.m_linearVelocity.x = clamped_velocity.x;
    grabbedBody.m_linearVelocity.y = clamped_velocity.y;
  }
})

// Explode Player - Explode the player character
HWMod.addFeature("Explode Player", "action", {}, (e) => {
  if (e.currentTarget && e.currentTarget._character) {
    e.currentTarget._character.chestSmash();
  }
})
