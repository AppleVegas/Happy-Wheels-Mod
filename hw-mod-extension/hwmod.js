(self || this).HWMod = {};
const HWMod = (self || this).HWMod;

// Hook the event dispatcher
(function() {
  'use strict';

  HWMod.onEvent = {}
  HWMod.dispatchEvent = null;
  HWMod.dispatchEvent_hook = function(e) {
    if ( HWMod.onEvent[e.type] )
    {
      const r_e = HWMod.onEvent[e.type](e)

      if (r_e === false) // if the event is cancelled, don't dispatch it
        return;
      
      if (r_e !== true) // if the event is not handled, dispatch it
        return HWMod.dispatchEvent.call(this, r_e);

    }

    return HWMod.dispatchEvent.call(this, e);
  }

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
  
  HWMod.features = [];
  HWMod.activeFeatures = new Set();
  HWMod.pendingReverts = [];
  HWMod.lastEvent = null;
  HWMod.pressedKeys = {};
  HWMod.pressedMouse = {};

  HWMod.onEvent.enterFrame = function (e) {
    HWMod.lastEvent = e;

    if (HWMod.pendingReverts && HWMod.pendingReverts.length > 0) {
      for (const pendingRevert of HWMod.pendingReverts) {
        try {
          pendingRevert.revertFunc(e);
        } catch (error) {
          console.error(`Error reverting feature ${pendingRevert.featureId}:`, error);
        }
      }
      HWMod.pendingReverts = [];
    }

    for (const featureId of HWMod.activeFeatures) {
      const feature = HWMod.features[featureId];
      if (feature && feature.func) {
        try {
          feature.func(e);
          if (feature.type === "action") {
            HWMod.toggleFeature(featureId, false);
          }
        } catch (error) {
          console.error(`Error executing feature ${featureId}:`, error);
        }
      }
    }

    return true;
  }

  /**
   * Add a feature to the mod
   * @param {string} name Name of the feature
   * @param {string} type Type of the feature (bool, action)
   * @param {object} settings Settings for the feature 
   * @param {function} func Function to execute when the feature is enabled
   * @param {function} revertFunc Function to execute when the feature is disabled
   * @returns {number} The ID of the feature
   */
  HWMod.addFeature = function( name, type, settings, func, revertFunc) {
    const featureId = HWMod.features.length;

    const feature = {
      id: featureId,
      name,
      type,
      settings,
      func,
      revertFunc
    };

    HWMod.features.push(feature);

    const event = new CustomEvent("HWModAddFeature", {
      detail: {
        id: featureId,
        name,
        type,
        settings
      }
    });

    window.dispatchEvent(event);

    return featureId;
  }

  /**
   * Toggle a feature on/off
   * @param {number} featureId The ID of the feature
   * @param {boolean} enabled Whether to enable or disable the feature
   * @returns {boolean} Whether the feature was toggled successfully
   */
  HWMod.toggleFeature = function(featureId, enabled) {
    if (!HWMod.dispatchEvent) {
      alert("Failed to hook event dispatcher, please reload the page");
      return false;
    }

    const feature = HWMod.features[featureId];
    if (!feature) {
      console.error(`Feature with ID ${featureId} not found`);
      return false;
    }

    if (enabled) {
      HWMod.activeFeatures.add(featureId);
    } else {
      HWMod.activeFeatures.delete(featureId);
      // Execute revert function if available
      if (feature.revertFunc && typeof feature.revertFunc === 'function') {
        try {
          // Store the revert function to be executed in the next enterFrame
          HWMod.pendingReverts = HWMod.pendingReverts || [];
          HWMod.pendingReverts.push({
            featureId: featureId,
            revertFunc: feature.revertFunc
          });
        } catch (error) {
          console.error(`Error scheduling revert for feature ${featureId}:`, error);
        }
      }
    }

    return true;
  }

  /**
   * Get the current feature states
   * @returns {object} The feature states
   */
  HWMod.getFeatureStates = function() {
    return {
      features: HWMod.features.map(f => ({
        id: f.id,
        name: f.name,
        type: f.type,
        active: HWMod.activeFeatures.has(f.id)
      })),
      activeFeatures: Array.from(HWMod.activeFeatures)
    };
  }

  /**
   * Check if a key is down
   * @param {string} key The key to check
   * @returns {boolean} Whether the key is pressed
   */
  HWMod.isKeyDown = function(key) {
    return HWMod.pressedKeys[key] || false;
  }
  
  gameWindow.addEventListener('keydown', function(e) {
    HWMod.pressedKeys[e.key] = true;
  });
  gameWindow.addEventListener('keyup', function(e) {
    HWMod.pressedKeys[e.key] = false;
  });

  /**
   * Check if a mouse button is down
   * @param {string} key The key to check
   * @returns {boolean} Whether the mouse button is pressed
   */
  HWMod.isMouseDown = function(key) {
    return HWMod.pressedMouse[key] || false;
  }

  gameWindow.addEventListener('mousedown', function(e) {
    HWMod.pressedMouse[e.button] = true;
  });
  gameWindow.addEventListener('mouseup', function(e) {
    HWMod.pressedMouse[e.button] = false;
  });

  // Listen for toggle events from content script
  window.addEventListener('HWModToggleFeature', function(event) {
    const { featureId, enabled } = event.detail;

    const success = HWMod.toggleFeature(featureId, enabled);
    if (!success) {
      console.error(`Failed to toggle feature ${featureId}`);
    }
  }, false);


  window.addEventListener('HWModSetting', function(event) {
    if (event.data) {
      //console.debug(event.data)
    }
  });
})();