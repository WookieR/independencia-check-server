const express = require('express');
const _ = require('underscore');


const Reporte = require('../models/reporte');
const ItemCategoria = require('../models/ItemCategoria')
const ReporteMedida = require('../models/reporteMedida');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

const app = express();

// GET
app.get('/reporte', verificaToken, (req, res) => {
    Reporte.find({}).sort({fecha: -1}).limit(10).populate('usuario').exec((err, reportesDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            reportesDb
        });
    });

});

// GET ID
app.get('/reporte/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Reporte.findById(id, (err, reporteDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!reporteDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró el reporte indicado'
                }
            });
        }

        res.json({
            ok: true,
            reporteDb
        });
    });

});

// CREAR REPORTE
app.post('/reporte', [verificaToken, verificaAdminRol], async(req, res) => {
    let body = _.pick(req.body, ['usuario', 'turno']);

    let reporte = new Reporte({
        usuario: body.usuario,
        turno: body.turno
    });

    let reportesActivos = await Reporte.find({activo: true}).exec();

    reportesActivos.forEach(async (ra) => {
        await Reporte.findByIdAndUpdate(ra._id, {activo: false}).exec();
    });

    ItemCategoria.exists({ estaEliminado: false }, (err, existe) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (existe === false) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'No se encontró ninguna asignacion activa... El reporte no fue creado'
                }
            });
        }

        reporte.save((err, reporteDb) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            ItemCategoria.find({ estaEliminado: false }, (err, itemCategoriasDb) => {

                itemCategoriasDb.forEach(ItemCategoriaDb => {

                    let reporteMedida = new ReporteMedida({
                        reporte: reporteDb._id,
                        itemCategoria: ItemCategoriaDb._id
                    });

                    reporteMedida.save((err, reporteMedidaDb) => {
                        if (err) {
                            throw err;
                        }
                    });
                });
            });

            

            // res.json({
            //     ok: true,
            //     reporteDb
            // });
        });

        reporte.populate('usuario', (err, reporteDb) => {
            if(err){
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                reporteDb
            });

        });
    });
});

// ACTIVAR/DESACTIVAR REPORTE
app.put('/reporte/:id/:estado', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let estado = req.params.estado || false;

    let cambiaEstado = {
        activo: estado,
    }

    Reporte.findByIdAndUpdate(id, cambiaEstado, { new: true, runValidators: true }).populate('usuario').exec((err, reporteDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!reporteDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró el reporte indicado'
                }
            });
        }

        res.json({
            ok: true,
            reporteDb
        });
    });

});

// DELTE
app.delete('/reporte/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        activo: false,
        estaEliminado: true
    };

    Reporte.findByIdAndUpdate(id, cambiaEstado, { new: true }).populate('usuario').exec((err, reporteDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!reporteDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró el reporte indicado'
                }
            });
        }

        res.json({
            ok: true,
            reporteDb
        });
    });

});


module.exports = app;