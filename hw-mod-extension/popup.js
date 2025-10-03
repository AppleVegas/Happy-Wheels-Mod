let features = [];
let activeFeatures = new Set();

document.addEventListener('DOMContentLoaded', function() {
  const enabled = document.getElementById('hwmod_bool_enabled');
  const statusDiv = document.getElementById('status');
  const featuresContainer = document.getElementById('features-container');

  // Request features from content script
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "getFeatures"
    }, function(response) {
      if (chrome.runtime.lastError) {
        statusDiv.textContent = 'Error: Cannot connect to game page';
        return;
      }
      
      if (response && response.action === 'featuresUpdate') {
        console.log('Features updated:', response.features);
        features = response.features || [];
        activeFeatures = new Set(response.activeFeatures || []);
        updateFeaturesDisplay();
      } else {
        console.error('Unexpected response:', response);
        statusDiv.textContent = 'Error: Unexpected response from game';
      }
    });
  });

  // Handle main enabled toggle
  enabled.addEventListener('change', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "setting",
        name: "enabled",
        value: this.checked
      }, function(response) {
        if (chrome.runtime.lastError) {
          console.error('Error updating setting:', chrome.runtime.lastError);
        }
      });
    });
  });

  // Function to create feature toggle element
  function createFeatureToggle(feature) {
    const toggleDiv = document.createElement('div');
    toggleDiv.className = 'feature-toggle';
    
    if (feature.type === 'action') {
      // Create action button
      const button = document.createElement('button');
      button.id = `feature_${feature.id}`;
      button.textContent = feature.name;
      button.className = 'action-button';
      
      button.addEventListener('click', function() {
        // Disable button temporarily to prevent spam clicking
        button.disabled = true;
        button.textContent = 'Executing...';
        
        // Send toggle message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleFeature",
            featureId: feature.id,
            enabled: true
          }, function(response) {
            // Re-enable button after a short delay
            setTimeout(() => {
              button.disabled = false;
              button.textContent = feature.name;
            }, 500);
            
            if (chrome.runtime.lastError) {
              console.error('Error executing action:', chrome.runtime.lastError);
            } else if (response && !response.success) {
              console.error('Action execution failed:', response.error);
            }
          });
        });
      });
      
      toggleDiv.appendChild(button);
    } else {
      // Create checkbox toggle for bool type
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = `feature_${feature.id}`;
      checkbox.checked = activeFeatures.has(feature.id);
      
      const label = document.createElement('label');
      label.htmlFor = `feature_${feature.id}`;
      label.textContent = feature.name;
      
      checkbox.addEventListener('change', function() {
        const isEnabled = this.checked;
        
        if (isEnabled) {
          activeFeatures.add(feature.id);
        } else {
          activeFeatures.delete(feature.id);
        }
        
        // Send toggle message to content script
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleFeature",
            featureId: feature.id,
            enabled: isEnabled
          }, function(response) {
            if (chrome.runtime.lastError) {
              console.error('Error toggling feature:', chrome.runtime.lastError);
              // Revert the checkbox state if there was an error
              checkbox.checked = !isEnabled;
              if (isEnabled) {
                activeFeatures.delete(feature.id);
              } else {
                activeFeatures.add(feature.id);
              }
            } else if (response && !response.success) {
              console.error('Feature toggle failed:', response.error);
              // Revert the checkbox state if the toggle failed
              checkbox.checked = !isEnabled;
              if (isEnabled) {
                activeFeatures.delete(feature.id);
              } else {
                activeFeatures.add(feature.id);
              }
            }
          });
        });
      });
      
      toggleDiv.appendChild(checkbox);
      toggleDiv.appendChild(label);
    }
    
    return toggleDiv;
  }

  // Function to update features display
  function updateFeaturesDisplay() {
    featuresContainer.innerHTML = '';
    
    if (features.length === 0) {
      featuresContainer.innerHTML = '<div style="text-align: center; color: #666;">No features available</div>';
      statusDiv.textContent = 'No features found';
      return;
    }
    
    features.forEach(feature => {
      const toggleElement = createFeatureToggle(feature);
      featuresContainer.appendChild(toggleElement);
    });
    
    statusDiv.textContent = `Loaded ${features.length} features`;
  }

  // Store update function globally for message handler
  window.updateFeaturesDisplay = updateFeaturesDisplay;
});

// Handle dynamic feature additions when popup is open
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Popup received message:', request);
  
  switch (request.action) {
    case 'featureAdded':
      // Handle dynamic feature additions
      console.log('New feature added while popup is open:', request.feature);
      features.push(request.feature);
      if (window.updateFeaturesDisplay) {
        window.updateFeaturesDisplay();
      }
      break;
      
    default:
      console.log('Unknown action:', request.action);
  }
  
  return true;
});