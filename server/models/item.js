const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let itemSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es obligatorio']
    },
    estaEliminado: {
        type: Boolean,
        default: false
    },
    sector: {
        type: Schema.Types.ObjectId,
        ref: 'Sectores',
        required: [true, 'Es necesario especificar el sector']
    }
});


module.exports = mongoose.model('Items', itemSchema);