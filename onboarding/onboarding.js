/**
 * Onboarding Script
 * Note: Using non-module script to ensure functions are globally accessible
 */

// Make functions globally accessible
window.currentStep = 1;
const totalSteps = 5;

window.nextStep = function() {
  if (window.currentStep < totalSteps) {
    const currentStepEl = document.getElementById(`step${window.currentStep}`);
    if (currentStepEl) {
      currentStepEl.classList.remove('active');
    }
    window.currentStep++;
    const nextStepEl = document.getElementById(`step${window.currentStep}`);
    if (nextStepEl) {
      nextStepEl.classList.add('active');
    }
    updateProgress();
  }
};

function updateProgress() {
  const progress = (window.currentStep / totalSteps) * 100;
  const progressFill = document.getElementById('progressFill');
  if (progressFill) {
    progressFill.style.width = `${progress}%`;
  }
}

window.finishOnboarding = async function() {
  try {
    // Save preferences
    const analysisModeRadio = document.querySelector('input[name="analysisMode"]:checked');
    const analysisMode = analysisModeRadio ? analysisModeRadio.value : 'hybrid';
    const blockTrackers = document.getElementById('blockTrackers')?.checked || false;
    const blockCookies = document.getElementById('blockCookies')?.checked || false;
    const autoDecline = document.getElementById('autoDecline')?.checked || false;

    await chrome.storage.local.set({
      analysisMode,
      blockTrackers,
      blockNonEssentialCookies: blockCookies,
      autoDeclineCookies: autoDecline,
      onboardingCompleted: true,
    });

    // Move to completion step
    window.nextStep();
  } catch (error) {
    console.error('Error saving onboarding preferences:', error);
    // Still move to next step even if save fails
    window.nextStep();
  }
};

window.closeOnboarding = function() {
  try {
    window.close();
  } catch (error) {
    // If window.close() doesn't work (some browsers), redirect to a blank page
    console.log('Cannot close window, redirecting...');
    window.location.href = 'about:blank';
  }
};

// Attach event listeners to buttons (CSP-compliant)
function attachEventListeners() {
  const step1Btn = document.getElementById('step1Btn');
  const step2Btn = document.getElementById('step2Btn');
  const step3Btn = document.getElementById('step3Btn');
  const step4Btn = document.getElementById('step4Btn');
  const step5Btn = document.getElementById('step5Btn');

  if (step1Btn) {
    step1Btn.addEventListener('click', window.nextStep);
  }
  if (step2Btn) {
    step2Btn.addEventListener('click', window.nextStep);
  }
  if (step3Btn) {
    step3Btn.addEventListener('click', window.nextStep);
  }
  if (step4Btn) {
    step4Btn.addEventListener('click', window.finishOnboarding);
  }
  if (step5Btn) {
    step5Btn.addEventListener('click', window.closeOnboarding);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    updateProgress();
    attachEventListeners();
  });
} else {
  updateProgress();
  attachEventListeners();
}

