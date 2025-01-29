const usuarios = [
    { username: "Juan", password: "1234"},
    { username: "Maria", password: "abcd"},
    { username: "Pedro", password: "qwerty"}
];


document.addEventListener('DOMContentLoaded', function() {
    fetch('/src/data/usuarios.json')
    .then(response => response.json())
    .then(usuarios => {
        document.querySelector('.login-form').addEventListener('submit', function(event) {
            event.preventDefault();
        
            const username = document.querySelector('.input-field[type="text"]').value;
            const password = document.querySelector('.input-field[type="password"]').value;
        
            const usuarioValido = usuarios.find(u => u.username === username && u.password === password);
        
            if (!username || !password) {
                alert("Por favor, complete todos los campos.");
            } else if (usuarioValido) {
                window.location.href = "/src/pages/dashboard.html";
            } else {
                alert("Usario o contreña incorrectos.");
            }
        });
    })
    .catch(error => {
        console.error('Error al cargar los usuarios', error);
    });
});