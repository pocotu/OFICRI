require('dotenv').config();
const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor OFICRI corriendo en el puerto ${PORT}`);
    console.log(`Modo: ${process.env.NODE_ENV || 'desarrollo'}`);
});
