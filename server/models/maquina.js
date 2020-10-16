const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let maquinaSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    img: {
        type: String,
        required: false
    },
    estaEliminado: {
        type: Boolean,
        default: false
    }
});


module.exports = mongoose.model('Maquina', maquinaSchema);