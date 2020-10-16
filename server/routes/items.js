const express = require('express');
const _ = require('underscore');

var ObjectId = require('mongoose').Types.ObjectId;

const Item = require('../models/item');
const ItemCategoria = require('../models/ItemCategoria');
const ReporteMedida = require('../models/reporteMedida');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
const { response } = require('./sectores');

const app = express();

const populateConfig = {
    path: 'sector',
    populate: {
        path: 'maquina'
    }
};

const populateReporteConfig = {
    path: 'itemCategoria',
    populate: {
        path: 'item'
    }
}

const itemCategoriaConfig = {
    path: 'item'
}

// GET
app.get('/item', verificaToken, (req, res) => {
    let sectorId = req.query.sector_id;

    if (sectorId) {

        try {
            sector_id = new ObjectId(sectorId);

            Item.find({ sector: sector_id, estaEliminado: false }).populate(populateConfig).exec((err, itemsDb) => {
                if (err) {
                    return res.status(500).json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    ok: true,
                    itemsDb
                });
            })

            // Item.find({ sector: sector_id, estaEliminado: false }, (err, itemsDb) => {
            //     if (err) {
            //         return res.status(500).json({
            //             ok: false,
            //             err
            //         });
            //     }

            //     res.json({
            //         ok: true,
            //         itemsDb
            //     });
            // });
        } catch (err) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'El parametro enviado no corresponde a un sector'
                }
            });
        }
    } else {
        Item.find({ estaEliminado: false }).populate(populateConfig).exec((err, itemsDb) => {
                if (err) {
                    return res.status.json({
                        ok: false,
                        err
                    });
                }

                res.json({
                    ok: true,
                    itemsDb
                });
            })
            // Item.find({ estaEliminado: false }, (err, itemsDb) => {
            //     if (err) {
            //         return res.status.json({
            //             ok: false,
            //             err
            //         });
            //     }

        //     res.json({
        //         ok: true,
        //         itemsDb
        //     });
        // });
    }
});

// GET ITEMs EN REPORTE DESDE SECTOR
app.get('/item-reporte/:id', async(req,res) => {
    const id = req.params.id;

    const reportesMedidas = await ReporteMedida.find().populate('reporte').populate(populateReporteConfig);

    const reportesMedidasActivos = await reportesMedidas.filter( reporteMedida => {
        if(reporteMedida.reporte.activo === true){
            return reporteMedida;
        }    
    });

    let items = [];

    reportesMedidasActivos.forEach( rm => {
        if( !items.includes(rm.itemCategoria.item)){
            items.push(rm.itemCategoria.item);
        }
    });


    let itemsDevolver = [];

    items.forEach(item => {
        if(item.sector == id){
            itemsDevolver.push(item);
        }
    });

    res.json({
        ok:true,
        itemsDb: itemsDevolver
    });

});

// GET ID
app.get('/item/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Item.findById(id).populate(populateConfig).exec((err, itemDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró el item indicado'
                }
            });
        }

        res.json({
            ok: true,
            itemDb
        });

    });

    // Item.findById(id, (err, itemDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     if (!itemDb) {
    //         return res.status(400).json({
    //             ok: false,
    //             err: {
    //                 message: 'No se encontró el item indicado'
    //             }
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         itemDb
    //     });

    // });

});

// POST
app.post('/item', [verificaToken, verificaAdminRol], (req, res) => {
    let body = _.pick(req.body, ['nombre', 'sector']);

    let item = new Item({
        nombre: body.nombre,
        sector: body.sector
    });

    item.save();

    item.populate(populateConfig, (err, itemDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            })
        }

        res.json({
            ok: true,
            itemDb
        });
    })


    // item.save((err, itemDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         itemDb
    //     });
    // });

});

// PUT
app.put('/item/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'sector']);

    Item.findByIdAndUpdate(id, body, { new: true, runValidators: true }).populate(populateConfig).exec((err, itemDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!itemDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontró el item indicado'
                }
            });
        }

        res.json({
            ok: true,
            itemDb
        });
    });

});

// DELETE
app.delete('/item/:id', [verificaToken, verificaAdminRol], async (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        estaEliminado: true
    };

    // Borrar Asignaciones
    let asignaciones = await ItemCategoria.find().populate(itemCategoriaConfig).exec();
    let asignacionesBorrar = asignaciones.filter(as => {
        return as.item._id.equals(id);
    });

    asignacionesBorrar.forEach(async as => {
        await ItemCategoria.findByIdAndUpdate(as._id, cambiaEstado);
    });

    let itemDb = await Item.findByIdAndUpdate(id, cambiaEstado, {new: true});

    return res.json({
        ok: true,
        itemDb
    });

    // Item.findByIdAndUpdate(id, cambiaEstado, { new: true }).populate(populateConfig).exec((err, itemDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     if (!itemDb) {
    //         return res.status(400).json({
    //             ok: false,
    //             err: {
    //                 message: 'No se encontró el item indicado'
    //             }
    //         });
    //     }

    //     return res.json({
    //         ok: true,
    //         itemDb
    //     });
    // });

});



module.exports = app;