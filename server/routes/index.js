const express = require('express');
const app = express();

app.use(require('./usuarios'));
app.use(require('./login'));
app.use(require('./upload'));
app.use(require('./imagenes'));
app.use(require('./maquinas'));
app.use(require('./sectores'));
app.use(require('./items'));
app.use(require('./categorias'));
app.use(require('./itemCategorias'));
app.use(require('./reportes'));
app.use(require('./reporteMedidas'));


module.exports = app;