const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let sectorSchema = Schema({
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
    },
    maquina: {
        type: Schema.Types.ObjectId,
        ref: 'Maquina',
        required: [true, 'Es necesario especificar la maquina']
    }
});



module.exports = mongoose.model('Sectores', sectorSchema);