const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let categoriaSchema = new Schema({
    descripcion: {
        type: String,
        required: [true, 'La descripcion es necesaria']
    },
    estaEliminado: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('Categorias', categoriaSchema);