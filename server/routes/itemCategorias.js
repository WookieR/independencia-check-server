const express = require('express');
const _ = require('underscore');

var ObjectId = require('mongoose').Types.ObjectId;

const ItemCategoria = require('../models/ItemCategoria');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

const app = express();

// GET
app.get('/item-categoria', verificaToken, (req, res) => {
    let itemId = req.query.item_id;

    if (itemId) {
        try {

            item_id = new ObjectId(itemId);

            ItemCategoria.find({ item: item_id, estaEliminado: false }).populate('item').populate('categoria').exec((err, itemCategoriasDb) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    ok: true,
                    itemCategoriasDb
                });
            });

        } catch (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El parametro enviado no corresponde a un item'
                }
            });
        }

    } else {
        ItemCategoria.find({estaEliminado: false}).populate('item').populate('categoria').exec((err, itemCategoriasDb) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                itemCategoriasDb
            });
        });
    }


});

// GET ID
app.get('/item-categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    ItemCategoria.findById(id).populate('item').populate('categoria').exec((err, itemCategoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemCategoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la asignacion indicada'
                }
            });
        }

        res.json({
            ok: true,
            itemCategoriaDb
        });
    });
});

// POST
app.post('/item-categoria', [verificaToken, verificaAdminRol], (req, res) => {
    let body = _.pick(req.body, ['nombre', 'descripcion', 'item', 'categoria']);

    let itemCategoria = new ItemCategoria({
        nombre: body.nombre,
        descripcion: body.descripcion,
        item: body.item,
        categoria: body.categoria
    });

    itemCategoria.save();
    itemCategoria.populate('item').populate('categoria', (err, itemCategoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemCategoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontro la asignacion indicada'
                }
            });
        }

        res.json({
            ok: true,
            itemCategoriaDb
        });
    });

});

// PUT
app.put('/item-categoria/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'descripcion', 'item', 'categoria']);

    ItemCategoria.findByIdAndUpdate(id, body, { new: true, runValidators: true }).populate('item').populate('categoria').exec((err, itemCategoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemCategoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la asignacion indicada'
                }
            });
        }

        res.json({
            ok: true,
            itemCategoriaDb
        });
    });

});

// DELETE
app.delete('/item-categoria/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        estaEliminado: true
    };

    ItemCategoria.findByIdAndUpdate(id, cambiaEstado, { new: true }).populate('item').populate('categoria').exec((err, itemCategoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemCategoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la asignacion indicada'
                }
            });
        }

        res.json({
            ok: true,
            itemCategoriaDb
        });
    });

});

module.exports = app;