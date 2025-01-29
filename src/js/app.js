document.querySelector('.login-form').addEventListener('submit', function(event) {
    event.preventDefault();

    const username = document.querySelector('.input-field[type="text"]').value;
    const password = document.querySelector('.input-field[type="password"]').value;

    if (username === "" || password === "") {
        alert("Por favor, complete todos los campos.")
    } else {
        alert(`Bienvenido, ${username}!`);
    }
});