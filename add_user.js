<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Add User</title>

  <!-- Include Bootstrap and Material Icons -->
  <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">

  <style>
    body {
      background: url('/login-background.jpg') no-repeat center center fixed;
      background-size: cover;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .form-container {
      background-color: transparent;
      padding: 30px;
      border-radius: 8px;
      border: 3px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      max-width: 500px;
      width: 100%;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      text-align: center;
      font-weight: bold;
      color: white;
    }
    .form-label {
      font-weight: bold;
      color: white;
    }
    .form-control {
      background-color: transparent;
      border-radius: 30px;
      border: 1px solid white;
      color: white;
    }
    .form-control::placeholder {
      color: #d1d1d1;
    }
    .btn-primary, .btn-secondary {
      background-color: transparent;
      border: 2px solid white;
      border-radius: 30px;
      width: 100%;
      padding: 10px;
      font-weight: bold;
      color: white;
      transition: background-color 0.3s, color 0.3s;
      margin-bottom: 10px;
    }
    .btn-primary:hover, .btn-secondary:hover {
      background-color: white;
      color: #003196ff;
      border-color: white;
    }
  </style>

  <script>
    function addField(containerId, inputName, placeholder) {
      const container = document.getElementById(containerId);
      const input = document.createElement('input');
      input.type = 'text';
      input.name = inputName + '[]'; // Append an array to handle multiple values
      input.className = 'form-control mt-2';
      input.placeholder = placeholder;
      input.required = true;
      container.appendChild(input);
    }

    function removeField(containerId) {
      const container = document.getElementById(containerId);
      if (container.children.length > 1) { // Keep at least one field
        container.removeChild(container.lastChild);
      }
    }
  </script>
</head>
<body>
  <div class="form-container">
    <h1>Add User</h1>
    <form action="/register" method="post">
      <div class="mb-3">
        <label for="username" class="form-label">Username</label>
        <input type="text" class="form-control" id="username" name="username" required>
      </div>
      <div class="mb-3">
        <label for="first_name" class="form-label">First Name</label>
        <input type="text" class="form-control" id="first_name" name="first_name" required>
      </div>
      <div class="mb-3">
        <label for="last_name" class="form-label">Last Name</label>
        <input type="text" class="form-control" id="last_name" name="last_name" required>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Email/s:</label>
        <div id="emailContainer">
          <input type="text" class="form-control" name="email[]" placeholder="Email" required>
        </div>
        <div class="d-flex mt-2">
          <button type="button" class="btn btn-secondary me-2" onclick="addField('emailContainer', 'email', 'Email')">Add Email</button>
          <button type="button" class="btn btn-secondary" onclick="removeField('emailContainer')">Remove Email</button>
        </div>
      </div>
      
      <div class="mb-3">
        <label class="form-label">Phone Number/s:</label>
        <div id="phoneContainer">
          <input type="text" class="form-control" name="phone_number[]" placeholder="Phone Number" required>
        </div>
        <div class="d-flex mt-2">
          <button type="button" class="btn btn-secondary me-2" onclick="addField('phoneContainer', 'phone_number', 'Phone Number')">Add Phone Number</button>
          <button type="button" class="btn btn-secondary" onclick="removeField('phoneContainer')">Remove Phone Number</button>
        </div>
      </div>
      
      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input type="password" class="form-control" id="password" name="password" required>
      </div>
      
      <div class="mb-3">
        <label for="app_password" class="form-label">App Password</label>
        <input type="password" class="form-control" id="app_password" name="app_password" required>
      </div>
      
      <button type="submit" class="btn btn-primary">Register</button>
    </form>
  </div>

  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
