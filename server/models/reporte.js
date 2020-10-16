const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let turnosValidos = ['TURNO_MAÑANA', 'TURNO_TARDE', 'TURNO_NOCHE'];

let reporteSchema = new Schema({
    usuario: {
        type: Schema.Types.ObjectId,
        ref: 'Usuario',
        required: [true, 'Es necesario especificar el usuario que realizará el control']
    },
    fecha: {
        type: Date,
        default: Date.now
    },
    turno: {
        type: String,
        enum: turnosValidos,
        required: [true, 'Es necesario especificar el turno en el que se realizará este control']
    },
    activo: {
        type: Boolean,
        default: true
    },
    estaEliminado: {
        type: Boolean,
        default: false
    }
});



module.exports = mongoose.model('Reportes', reporteSchema);