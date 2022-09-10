const express = require('express');
const bcrypt = require('bcryptjs');
const _ = require('underscore');

const Usuario = require('../models/usuario');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

const app = express();

//================ GET ================

app.get('/usuario', [verificaToken, verificaAdminRol], async (req, res) => {
    usuarios = await Usuario.find({ estado: true }).exec();

    res.json({
        ok: true,
        usuarios,
    });
});

//================ POST ===============

app.post('/usuario', [verificaToken, verificaAdminRol], (req, res) => {
    let body = req.body;

    let usuario = new Usuario({
        nombre: body.nombre,
        apellido: body.apellido,
        dni: body.dni,
        email: body.email,
        password: bcrypt.hashSync(body.password, 10),
        rol: body.rol
    });

    usuario.save((err, usuarioDb) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error al insertar el registro',
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDb
        });
    });
});

//================ PUT ================

app.put('/usuario/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'apellido', 'password', 'dni', 'email', 'rol', 'estado']);

    Usuario.findByIdAndUpdate(id, body, {
        new: true,
        runValidators: true,
        context: 'query'
    }, (err, usuarioDb) => {

        if (err) {
            return res.status(400).json({
                ok: false,
                message: 'Ocurrio un error',
                err
            });
        }

        res.json({
            ok: true,
            usuario: usuarioDb
        });

    });
});

//================ DELETE ==============

app.delete('/usuario/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        estado: false
    }

    Usuario.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, usuarioEliminado) => {
        if (err) {
            return res.status(400).json({
                ok: 'false',
                message: 'Ocurrio un error',
                err
            });
        }

        res.json({
            ok: 'true',
            usuario: usuarioEliminado
        });
    });
});

module.exports = app;