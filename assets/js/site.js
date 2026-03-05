document.addEventListener('DOMContentLoaded', () => {
  const yearNodes = document.querySelectorAll('.year');
  const visitorNode = document.getElementById('visitor-count');
  const clockNode = document.getElementById('clock');
  const statusNode = document.getElementById('status-text');

  yearNodes.forEach((node) => {
    node.textContent = String(new Date().getFullYear());
  });

  if (visitorNode) {
    const key = 'retroVisitorCount';
    const current = Number(localStorage.getItem(key) || '1207') + 1;
    localStorage.setItem(key, String(current));
    visitorNode.textContent = String(current);
  }

  if (clockNode) {
    const updateClock = () => {
      const now = new Date();
      clockNode.textContent = now.toLocaleTimeString();
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  if (statusNode) {
    const lines = [
      'Currently coding with maximum nostalgia.',
      'Listening to MP3s while updating my portfolio.',
      'Guestbook replies coming soon.'
    ];
    let index = 0;
    setInterval(() => {
      index = (index + 1) % lines.length;
      statusNode.textContent = lines[index];
    }, 3500);
  }

  const galleryButton = document.getElementById('shuffle-gallery');
  if (galleryButton) {
    galleryButton.addEventListener('click', () => {
      const images = Array.from(document.querySelectorAll('.gallery-grid img'));
      images.sort(() => Math.random() - 0.5);
      const parent = document.querySelector('.gallery-grid');
      if (parent) {
        parent.innerHTML = '';
        images.forEach((img) => parent.appendChild(img));
      }
    });
  }
});
