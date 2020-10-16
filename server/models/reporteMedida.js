const mongoose = require('mongoose');

let Schema = mongoose.Schema;

let reporteMedidaSchema = new Schema({
    reporte: {
        type: Schema.Types.ObjectId,
        ref: 'Reportes',
        required: ['Es necesario especificar el reporte en el que partipará este control']
    },
    itemCategoria: {
        type: Schema.Types.ObjectId,
        ref: 'ItemCategorias',
        required: ['Es necesario especificar la asignacion']
    },
    valor: {
        type: String,
        default: '--- SIN CONTROLAR ---'
    }
});


module.exports = mongoose.model('ReporteMedidas', reporteMedidaSchema);