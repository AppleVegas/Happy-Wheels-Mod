
(self || this).HWMod = {};
const HWMod = (self || this).HWMod;
HWMod.onEvent = {}

HWMod.dispatchEvent = null;

HWMod.dispatchEvent_hook = function(e) {
    if ( HWMod.onEvent[e.type] )
        return HWMod.onEvent[e.type].call(this, e)

    return HWMod.dispatchEvent.call(this, e);
}

(function() {
  'use strict';

  const funcId = 6
  const [gameFrame]= document.getElementById('game').children
  const gameWindow = gameFrame.contentWindow;

  let custom_webpackChunkhappy_wheels = [];

  Object.defineProperty(gameWindow, 'webpackChunkhappy_wheels', {
    get: function() {
      return custom_webpackChunkhappy_wheels;
    },
    set: function(newValue) {
      if (newValue[0] && !HWMod.dispatchEvent)
      {
        const oldfunc = newValue[0][1][funcId];
        newValue[0][1][funcId] = function(e, t, n) {
          const result = oldfunc(e, t, n)
          for (const [key, value] of Object.entries(t)) {

            if (!value.prototype)
                continue

            if (Object.hasOwn(value.prototype, "dispatchEvent"))
            {
              HWMod.dispatchEvent = value.prototype.dispatchEvent;
              value.prototype.dispatchEvent = HWMod.dispatchEvent_hook;
              break;
            }

          }
          return result;
        }
      }

      custom_webpackChunkhappy_wheels = newValue;
    },
    configurable: false,
    enumerable: true
  });
})();

HWMod.onEvent.enterFrame = function (e) {
  if (e.currentTarget && e.currentTarget._character)
  {
    if (e.currentTarget._character._dead)
      e.currentTarget._character._dead = false;
  
    e.currentTarget._character.boostMax = 9999
    e.currentTarget.m_world.m_gravity.y = 0;
  }

  return HWMod.dispatchEvent.call(this, e);
}