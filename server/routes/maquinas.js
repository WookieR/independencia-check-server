const express = require('express');
const _ = require('underscore');

const Maquina = require('../models/maquina');
const ItemCategoria = require('../models/ItemCategoria');
const Item = require('../models/item');
const Sector = require('../models/sector');
const ReporteMedida = require('../models/reporteMedida');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

const app = express();

const populateConfig = {
    path: 'itemCategoria',
    populate: {
        path: 'item',
        populate: {
            path: 'sector',
            populate: {
                path: 'maquina'
            }
        }
    }
};

const itemCategoriaConfig = {
    path: 'item',
        populate: {
            path: 'sector',
            populate: {
                path: 'maquina'
            }
        }
}

const itemConfig = {
    path: 'sector',
            populate: {
                path: 'maquina'
            }
}

const sectorConfig = {
    path: 'maquina'
}

// GET
app.get('/maquina', verificaToken, (req, res) => {
    Maquina.find({ estaEliminado: false }, (err, maquinasDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });

        }

        res.json({
            ok: true,
            maquinasDb
        });
    });

});

// GET MAQUINAS EN REPORTE
app.get('/maquina-reporte', verificaToken, async(req, res) => {

    const reportesMedidas = await ReporteMedida.find().populate('reporte').populate(populateConfig);
    
    const reportesMedidasActivos = await reportesMedidas.filter( reporteMedida => {
        if(reporteMedida.reporte.activo === true){
            return reporteMedida;
        }    
    });

    if(!reportesMedidasActivos){
        return res.status(400).json({
            ok: false,
            message: 'No hay maquinas activas en ningun reporte'
        });
    }

    let maquinas = [];

    reportesMedidasActivos.forEach( rm => {
        if( !maquinas.includes(rm.itemCategoria.item.sector.maquina)){
            maquinas.push(rm.itemCategoria.item.sector.maquina);
        }
    });

    res.json({
        ok: true,
        maquinasDb: maquinas
    });

});

// GET ID
app.get('/maquina/:id', verificaToken, (req, res) => {
    let id = req.params.id;

    Maquina.findById(id, (err, maquinaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!maquinaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontro la maquina'
                }
            });
        }

        res.json({
            ok: true,
            maquinasDb
        });
    });

});

// POST
app.post('/maquina', [verificaToken, verificaAdminRol], (req, res) => {
    let body = _.pick(req.body, ['nombre']);

    let maquina = new Maquina({
        nombre: body.nombre
    });

    maquina.save((err, maquinaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }
        res.json({
            ok: true,
            maquinaDb
        });

    });
})

// PUT
app.put('/maquina/:id', [verificaToken, verificaAdminRol], (req, res) => {
    let id = req.params.id;

    let body = _.pick(req.body, ['nombre', 'estaEliminado']);

    Maquina.findByIdAndUpdate(id, body, { new: true, runValidators: true }, (err, maquinaDb) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                err
            });
        }

        if (!maquinaDb) {
            return res.status(400).json({
                ok: false,
                err: {
                    message: 'No se encontro la maquina indicada'
                }
            });
        }

        res.json({
            ok: true,
            maquinaDb
        });
    });

});

// DELETE
app.delete('/maquina/:id', [verificaToken, verificaAdminRol], async (req, res) => {
    let id = req.params.id;

    let cambiaEstado = {
        estaEliminado: true
    };

    // Borrar Asignaciones
    let asignaciones = await ItemCategoria.find().populate(itemCategoriaConfig).exec();
    let asignacionesBorrar = asignaciones.filter(as => {
        return as.item.sector.maquina._id.equals(id);
    });

    asignacionesBorrar.forEach(async as => {
        await ItemCategoria.findByIdAndUpdate(as._id, cambiaEstado);
    });

    // Borrar Items
    let items = await Item.find().populate(itemConfig).exec();
    let itemsBorrar = items.filter(item => {
        return item.sector.maquina._id.equals(id);
    });

    itemsBorrar.forEach(async item => {
        await Item.findByIdAndUpdate(item._id, cambiaEstado);
    });

    // Borrar Sectores
    let sectores = await Sector.find().populate(sectorConfig).exec();
    let sectoresBorrar = sectores.filter(sector => {
        return sector.maquina._id.equals(id);
    });

    sectoresBorrar.forEach(async sector => {
        await Sector.findByIdAndUpdate(sector._id, cambiaEstado);
    });

    // Borrar Maquina
    let maquinaDb = await Maquina.findByIdAndUpdate(id, cambiaEstado, {new: true}).exec();

    res.json({
        ok: true,
        maquinaDb
    });


    // Maquina.findByIdAndUpdate(id, cambiaEstado, { new: true }, (err, maquinaDb) => {
    //     if (err) {
    //         return res.status(500).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     if (!maquinaDb) {
    //         return res.status(400).json({
    //             ok: false,
    //             err: {
    //                 message: 'No se encontró la maquina indicada'
    //             }
    //         });
    //     }

    //     res.json({
    //         ok: true,
    //         maquinaDb
    //     });
    // });
});

module.exports = app;