// Inject hwmod.js first
const hwmodScript = document.createElement('script');
hwmodScript.src = chrome.runtime.getURL('hwmod.js');
hwmodScript.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(hwmodScript);

// Inject features.js after hwmod.js
const featuresScript = document.createElement('script');
featuresScript.src = chrome.runtime.getURL('features.js');
featuresScript.onload = function() { this.remove(); };
(document.head || document.documentElement).appendChild(featuresScript);

let features = [];
let activeFeatures = new Set();

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

  switch (request.action) {
    case 'getFeatures':
      sendResponse({
        action: 'featuresUpdate',
        features: features,
        activeFeatures: Array.from(activeFeatures)
      });
      break;
      
    case 'toggleFeature':
      const feature = features.find(f => f.id === request.featureId);
      if (feature) {
        if (request.enabled) {
          activeFeatures.add(request.featureId);
        } else {
          activeFeatures.delete(request.featureId);
        }
        
        // Send toggle event to the game context
        const toggleEvent = new CustomEvent('HWModToggleFeature', {
          detail: {
            featureId: request.featureId,
            enabled: request.enabled
          }
        });
        window.dispatchEvent(toggleEvent);
        
        sendResponse({ success: true });
      } else {
        sendResponse({ success: false, error: 'Feature not found' });
      }
      break;
      
    case 'setting':
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
  
  return true;
});

window.addEventListener("HWModAddFeature", function(event) {
  features.push(event.detail);

  try {
    chrome.runtime.sendMessage({
      action: 'featureAdded',
      feature: event.detail
    });
  } catch (e) {}
}, false);