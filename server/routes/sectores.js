const express = require('express');
const _ = require('underscore');


const Sector = require('../models/sector');
const ItemCategoria = require('../models/ItemCategoria');
const Item = require('../models/item');
const ReporteMedida = require('../models/reporteMedida');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

var ObjectId = require('mongoose').Types.ObjectId;

const app = express();

const populateConfig = {
    path: 'itemCategoria',
    populate: {
        path: 'item',
        populate: {
            path: 'sector'
        }
    }
};

const itemCategoriaConfig = {
    path: 'item',
        populate: {
            path: 'sector'
        }
}

const itemConfig = {
    path: 'sector'
}

// GET /// PARAMATETRO OPCIONAL MAQUINA ID
app.get('/sector', verificaToken, (req, res) => {

    let maquinaId = req.query.maquina_id;

    if (maquinaId) {

        try {
            maquina_Id = new ObjectId(maquinaId);

            Sector.find({ maquina: maquina_Id, estaEliminado: false }).populate('maquina').exec((err, sectoresDb) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    ok: true,
                    sectoresDb
                });
            });
        } catch (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El parametro enviado no corresponde a una maquina'
                }
            });
        }
    } else {
        // Sector.find({ estaEliminado: false }, (err, sectoresDb) => {
        //     if (err) {
        //         return res.status(500).json({
        //             ok: false,
        //             err
        //         });
        //     }

        //     res.json({
        //         ok: true,
        //         sectoresDb
        //     });
        // });
        Sector.find({ estaEliminado: false }).populate('maquina').exec((err, sectoresDb) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            res.json({
                ok: true,
                sectoresDb
            });
        });
    }


});

// GET SECTORES EN REPORTE DESDE MAQUINA
app.get('/sector-reporte/:id', verificaToken, async(req, res) => {

    const id = req.params.id;

    const reportesMedidas = await ReporteMedida.find().populate('reporte').populate(populateConfig);

    const reportesMedidasActivos = await reportesMedidas.filter( reporteMedida => {
        if(reporteMedida.reporte.activo === true){
            return reporteMedida;
        }    
    });

    let sectores = [];

    reportesMedidasActivos.forEach( rm => {
        if( !sectores.includes(rm.itemCategoria.item.sector)){
            sectores.push(rm.itemCategoria.item.sector);
        }
    });

    let sectoresDevolver = [];

    sectores.forEach(sector => {
        if(sector.maquina == id){
            sectoresDevolver.push(sector);
        }
    });

    res.json({
        ok:true,
        sectoresDb: sectoresDevolver
    });
});

// GET ID
app.get('/sector/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Sector.findById(id).exec((err, sectorDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!sectorDb) {
            return res.status(500).json({
                ok: false,
                err: {
                    message: 'No se encontró el sector indicado'
                }
            });
        }

        res.json({
            ok: true,
            sectorDb
        });
    });

});

// POST
app.post('/sector', [verificaToken, verificaAdminRol], (req, res) => {
    let body = _.pick(req.body, ['nombre', 'maquina']);

    let sector = new Sector({
        nombre: body.nombre,
        maquina: body.maquina
    })

    sector.save();

    sector.populate('maquina', (err, sectorDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        res.json({
            ok: true,
            sectorDb
        });
    });

    // sector.save((err, sectorDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         sectorDb
    //     });
    // });
});

// PUT
app.put('/sector/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'maquina'])

    Sector.findByIdAndUpdate(id, body, { new: true, runValidators: true }).populate('maquina').exec((err, sectorDb) => {
        if (err) {
            return res.status(500).json({
                ok: true,
                err
            });
        }

        if (!sectorDb) {
            return res.status(400).json({
                ok: true,
                err: {
                    message: 'No se encontró el sector indicado'
                }
            });
        }

        res.json({
            ok: true,
            sectorDb
        });

    });

});

// DELETE
app.delete('/sector/:id', [verificaToken, verificaAdminRol], async (req, res) => {
    let id = req.params.id;

    cambiaEstado = {
        estaEliminado: true
    };

    // Borrar Asignaciones
    let asignaciones = await ItemCategoria.find().populate(itemCategoriaConfig).exec();
    let asignacionesBorrar = asignaciones.filter(as => {
        return as.item.sector._id.equals(id);
    });

    asignacionesBorrar.forEach(async as => {
        await ItemCategoria.findByIdAndUpdate(as._id, cambiaEstado);
    });

    // Borrar Items
    let items = await Item.find().populate(itemConfig).exec();
    let itemsBorrar = items.filter(item => {
        return item.sector._id.equals(id);
    });

    itemsBorrar.forEach(async item => {
        await Item.findByIdAndUpdate(item._id, cambiaEstado);
    });

    // Borrar Sector
    let sectorDb = await Sector.findByIdAndUpdate(id, cambiaEstado, {new: true});

    return res.json({
        ok: true,
        sectorDb
    });


    // Sector.findByIdAndUpdate(id, cambiaEstado, { new: true }).populate('maquina').exec((err, sectorDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     if (!sectorDb) {
    //         return res.status(400).json({
    //             ok: false,
    //             err: {
    //                 message: 'No se encontró el sector indicado'
    //             }
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         sectorDb
    //     });
    // });

});

module.exports = app;