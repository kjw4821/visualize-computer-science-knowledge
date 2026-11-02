'use strict';

const dialog = document.querySelector('dialog');
const title = document.querySelector('#subject-title');

document.querySelectorAll('[data-subject]').forEach(button => {
  button.addEventListener('click', () => {
    title.textContent = button.dataset.subject;
    dialog.showModal();
  });
});

dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const bounds = dialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right ||
      event.clientY < bounds.top || event.clientY > bounds.bottom) {
    dialog.close();
  }
});
