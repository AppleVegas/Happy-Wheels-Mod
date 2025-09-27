document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.getElementById('saveBtn');
  const testBtn = document.getElementById('testBtn');
  const statusDiv = document.getElementById('status');

  // Test script on current tab
  testBtn.addEventListener('click', function() {
    const script = customScriptTextarea.value;
    
    if (!script.trim()) {
      statusDiv.textContent = 'Please enter a script first.';
      setTimeout(() => {
        statusDiv.textContent = '';
      }, 2000);
      return;
    }
    
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "executeScript",
        script: script
      }, function(response) {
        if (chrome.runtime.lastError) {
          statusDiv.textContent = 'Error: Could not execute script.';
        } else {
          statusDiv.textContent = 'Script executed on current page!';
        }
        setTimeout(() => {
          statusDiv.textContent = '';
        }, 2000);
      });
    });
  });
});