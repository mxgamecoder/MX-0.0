document.getElementById('signupForm')?.addEventListener('submit', async (event) => {
    event.preventDefault();
  
    const username = document.getElementById('username').value;
    const fullname = document.getElementById('fullname').value;
    const email = document.getElementById('email').value;
    const phoneNumber = document.getElementById('phoneNumber').value;
    const password = document.getElementById('password').value;
  
    const response = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, fullname, email, phoneNumber, password }),
    });
  
    const result = await response.json();
  
    // Clear previous errors
    document.querySelectorAll('.error-message').forEach((p) => (p.textContent = ''));
  
    if (result.success) {
      document.getElementById('formMessage').textContent = 'You have successfully registered. Redirecting to login page...';
      setTimeout(() => {
        window.location.href = '/login.html';
      }, 2000);
    } else {
      // Display all error messages
      document.getElementById('usernameError').textContent = result.usernameError || '';
      document.getElementById('fullnameError').textContent = result.fullnameError || '';
      document.getElementById('emailError').textContent = result.emailError || '';
      document.getElementById('phoneError').textContent = result.phoneError || '';
      document.getElementById('passwordError').textContent = result.passwordError || '';
    }
  });
  
  
  
  // login
  document.getElementById('loginForm')?.addEventListener('submit', async (event) => {
    event.preventDefault(); // Prevent form from refreshing the page
  
    const usernameOrEmail = document.getElementById('usernameOrEmail').value;
    const password = document.getElementById('password').value;
  
    try {
      const response = await fetch('/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usernameOrEmail, password }),
      });
  
      const result = await response.json();
      console.log(result); // Debugging the response
  
      // Clear previous error messages
      document.querySelectorAll('.error-message').forEach((p) => (p.textContent = ''));
  
      if (result.success) {
        document.getElementById('formMessage').textContent = `Welcome @${result.username}. Redirecting to home page...`;
        setTimeout(() => {
          window.location.href = `/home.html?username=${result.username}`;
        }, 2000);
      } else {
        // Display error messages
        document.getElementById('usernameOrEmailError').textContent = result.usernameOrEmailError || '';
        document.getElementById('passwordError').textContent = result.passwordError || '';
      }
    } catch (err) {
      console.error('Error during login:', err);
      document.getElementById('formMessage').textContent = 'An error occurred. Please try again later.';
    }
  });
  
  // Get the eye icon and the password field
  const togglePassword = document.getElementById('togglePassword');
  const passwordField = document.getElementById('password');
  
  // Add click event to toggle password visibility
  if (togglePassword && passwordField) {
    togglePassword.addEventListener('click', () => {
      // Toggle the type attribute between password and text
      const type = passwordField.type === 'password' ? 'text' : 'password';
      passwordField.type = type;
  
      // Change the eye icon (optional: change icon based on visibility)
      togglePassword.textContent = type === 'password' ? '👁️' : '🙈'; // Open and closed eye emojis
    });
  }