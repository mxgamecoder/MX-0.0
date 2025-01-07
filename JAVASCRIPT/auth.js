const handleFormSubmit = async (url, formData) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      console.log(data.message);
    } catch (error) {
      console.error("Error:", error);
    }
  };
  
  // On form submission
  document.querySelector(".login form").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = {
      email: e.target.elements[0].value,
      password: e.target.elements[1].value,
    };
    handleFormSubmit("/login", formData);
  });
  
  document.querySelector(".signup form").addEventListener("submit", (e) => {
    e.preventDefault();
    const formData = {
      fullName: e.target.elements[0].value,
      username: e.target.elements[1].value,
      email: e.target.elements[2].value,
      password: e.target.elements[3].value,
    };
    handleFormSubmit("/signup", formData);
  });
  