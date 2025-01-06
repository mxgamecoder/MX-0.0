const container = document.getElementById('particles');

function createParticle() {
  const particle = document.createElement('div');
  particle.classList.add('particle');
  
  // Randomize position, size, and animation duration
  particle.style.left = Math.random() * 100 + 'vw';
  particle.style.top = Math.random() * 100 + 'vh';
  particle.style.animationDuration = Math.random() * 2 + 3 + 's';
  
  container.appendChild(particle);
  
  // Remove particle after animation ends
  setTimeout(() => {
    container.removeChild(particle);
  }, 5000);
}

// Generate particles continuously
setInterval(createParticle, 120);