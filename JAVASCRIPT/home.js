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

  const hamburger = document.querySelector('.hamburger-menu');
  const navLinks = document.querySelector('#nav-links');

  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    hamburger.classList.toggle('active');
  });


  document.addEventListener("DOMContentLoaded", () => {
    const loginRadio = document.getElementById("login");
    const signupRadio = document.getElementById("signup");
    const sliderTab = document.querySelector(".slider-tab");
    const forms = document.querySelector(".form-inner");
  
    // Toggle between login and signup forms
    loginRadio.addEventListener("change", () => {
      forms.style.transform = "translateX(0)";
      sliderTab.style.left = "0";
    });
  
    signupRadio.addEventListener("change", () => {
      forms.style.transform = "translateX(-50%)";
      sliderTab.style.left = "50%";
    });
  
    // Add validation logic
    const validateForm = (form) => {
      const inputs = form.querySelectorAll("input[required]");
      let isValid = true;
  
      inputs.forEach((input) => {
        if (!input.value.trim()) {
          isValid = false;
          input.style.borderColor = "red";
        } else {
          input.style.borderColor = "lightgrey";
        }
      });
  
      return isValid;
    };
  
    document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", (e) => {
        e.preventDefault(); // Prevent form submission
        if (validateForm(form)) {
          console.log(`${form.className} form submitted!`);
          // Implement form submission logic (e.g., API calls)
        }
      });
    });
  });
  