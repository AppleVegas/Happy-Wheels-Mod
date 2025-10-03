// Feature definitions for Happy Wheels Mod
// This file contains all the mod features that can be activated

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

// Explode Player - Explode the player character
HWMod.addFeature("Explode Player", "action", {}, (e) => {
  if (e.currentTarget && e.currentTarget._character) {
    e.currentTarget._character.chestSmash();
  }
})
