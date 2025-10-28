document.addEventListener('DOMContentLoaded', () => {
  const BTN_SELECTOR = '.ViewMore_Button';
  const GRID_SELECTOR = '.grid';
  const HIDDEN_CARD_SELECTOR = '.Card.hidden';
  const BATCH_SIZE = 3;

  const btn = document.querySelector(BTN_SELECTOR);
  const grid = document.querySelector(GRID_SELECTOR);

  
  function remainingHiddenCount() {
   return grid.querySelectorAll(HIDDEN_CARD_SELECTOR).length;
  }

  function updateButton() {
    const remaining = remainingHiddenCount();
    if (remaining === 0) {
      btn.textContent = 'All items shown';
      btn.disabled = true;
      btn.setAttribute('aria-disabled', 'true');
      btn.style.opacity = '0.6';
      btn.style.cursor = 'default';
    } else {
      btn.textContent = `View More`;
      btn.disabled = false;
      btn.removeAttribute('aria-disabled');
      btn.style.opacity = '';
      btn.style.cursor = '';
    }
  }

  function revealNextBatch() {
    const hiddenCards = Array.from(grid.querySelectorAll(HIDDEN_CARD_SELECTOR));
    const toReveal = hiddenCards.slice(0, BATCH_SIZE);

    if (toReveal.length === 0) {
      updateButton();
      return;
    }

    toReveal.forEach(card => card.classList.remove('hidden'));
    updateButton();
  }


  updateButton();

  
  btn.addEventListener('click', revealNextBatch);

 
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      revealNextBatch();
    }
  });
});

// #-# START COMMENT BLOCK #-#
// AI Tool used: Claude AI
// Line number in AI-Acknowledgement.md: [line where this code appears]
// My interpretation: I used AI to help create a simple JavaScript function for view more button to reveal hidden card in my Art collection page.The AI provided basic code that I understood and integrated into my project. I try to changed the function and constant names and little bit of  the reveal logic.
// #-# END COMMENT BLOCK #-#
