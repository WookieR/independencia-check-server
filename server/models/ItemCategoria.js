const mongoose = require('mongoose');
const { schema } = require('./categoria');

let Schema = mongoose.Schema;

let itemCategoriaSchema = new Schema({
    nombre: {
        type: String,
        required: [true, 'El nombre es necesario']
    },
    descripcion: {
        type: String,
        required: [true, 'La descripcion es necesaria']
    },
    estaEliminado: {
        type: Boolean,
        default: false
    },
    item: {
        type: Schema.Types.ObjectId,
        ref: 'Items',
        required: [true, 'Es necesario especificar un Item']
    },
    categoria: {
        type: Schema.Types.ObjectId,
        ref: 'Categorias',
        required: [true, 'Es necesario especificar una Categoria']
    }
});


module.exports = mongoose.model('ItemCategorias', itemCategoriaSchema);