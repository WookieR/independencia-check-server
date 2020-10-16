const express = require('express');
const _ = require('underscore');


const Categoria = require('../models/categoria');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

const app = express();

// GET
app.get('/categoria', verificaToken, (req, res) => {
    Categoria.find((err, categoriasDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            categoriasDb
        });
    });

});

// GET ID
app.get('/categoria/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Categoria.findById(id, (err, categoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!categoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la categoria indicada'
                }
            });
        }

        res.json({
            ok: true,
            categoriaDb
        });
    });

});

// POST
app.post('/categoria', [verificaToken, verificaAdminRol], (req, res) => {
    let body = _.pick(req.body, ['descripcion']);

    let categoria = new Categoria({
        descripcion: body.descripcion
    });

    categoria.save((err, categoriaDb) => {
        if (err) {
            ok: false,
            err
        };

        res.json({
            ok: true,
            categoriaDb
        });
    });
});

// PUT
app.put('/categoria/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['descripcion']);

    Categoria.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, categoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!categoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la categoria indicada'
                }
            });
        }

        res.json({
            ok: true,
            categoriaDb
        });
    });

});

// DELETE
app.delete('/categoria/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        estaEliminado: true
    };

    Categoria.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, categoriaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!categoriaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró la categoria indicada'
                }
            });
        }

        res.json({
            ok: true,
            categoriaDb
        });
    });

});

module.exports = app;