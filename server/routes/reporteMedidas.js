const express = require('express');
const _ = require('underscore');

const ObjectId = require('mongoose').Types.ObjectId;

const ItemCategoria = require('../models/ItemCategoria');
const ReporteMedida = require('../models/reporteMedida');
const Reporte = require('../models/reporte');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');
const { forEach } = require('underscore');
const maquina = require('../models/maquina');

const app = express();

const populateItemConfig = {
    path: 'itemCategoria',
    populate: {
        path: 'item'
    }
};

const populateSectorConfig = {
    path: 'itemCategoria',
    populate: {
        path: 'item',
        populate: {
            path: 'sector'
        }
    }
};

const populateMaquinaConfig = {
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
}

const populateReporteMedidaConfig = {
    path: 'itemCategoria',
    populate: 'item',
    populate: 'categoria'
}

//GET BY REPORTE/ITEM
app.get('/reporte-medida/:desde/:id', verificaToken, async(req, res) => {
    let desde = req.params.desde;

    if (ObjectId.isValid(req.params.id)) {
        let id = new ObjectId(req.params.id);

        if (desde && desde === 'reporte') {

            let reporteMedidas;

            reporteMedidas = await ReporteMedida.find({reporte: id}).populate(populateItemConfig).lean().exec();

            let items = [];

            reporteMedidas.forEach( rm => {
                if( !items.includes(rm.itemCategoria.item)){
                    items.push(rm.itemCategoria.item);
                }
            });

            items.forEach(item => {
                item.medidas = []
            });

            reporteMedidas = await ReporteMedida.find({reporte: id}).populate(populateSectorConfig).lean().exec();

            let sectores = [];

            reporteMedidas.forEach( rm => {
                if( !sectores.includes(rm.itemCategoria.item.sector)){
                    sectores.push(rm.itemCategoria.item.sector);
                }
            });

            sectores.forEach(sector => {
                sector.items = [];
            });

            reporteMedidas = await ReporteMedida.find({reporte: id}).populate('reporte').populate(populateMaquinaConfig).lean().exec();

            let maquinas = [];
    
            reporteMedidas.forEach( rm => {
                if( !maquinas.includes(rm.itemCategoria.item.sector.maquina)){
                    maquinas.push(rm.itemCategoria.item.sector.maquina);
                }
            });

            maquinas.forEach(maquina => {
                maquina.sectores = [];
            });

            reporteMedidas = await ReporteMedida.find({reporte: id}).populate(populateReporteMedidaConfig).lean().exec();


            // ASIGNACIONES
            reporteMedidas.forEach(rm => {
                items.forEach(item => {
                    if(item._id.equals(rm.itemCategoria.item)){
                        item.medidas.push(rm);
                    }
                });
            });

            items.forEach(item => {
                sectores.forEach(sector => {
                    if(sector._id.equals(item.sector)){
                        sector.items.push(item);
                    }
                });
            });

            sectores.forEach(sector => {
                maquinas.forEach( maquina => {
                    if(maquina._id.equals(sector.maquina)){
                        maquina.sectores.push(sector);
                    }
                });
            });

            reporte = await Reporte.findById(id).populate('usuario').exec();

            res.json({
                ok: true,
                reporte,
                reporteDetalle: maquinas,
            });

        }
        if (desde && desde === 'item') {

            itemCategoriasDb = await ItemCategoria.find({ item: id, estaEliminado: false }).exec();

            let reporteMedidas = [];

            for (const itemCategoriaDb of itemCategoriasDb) {

                let reporteMedidasDb = await ReporteMedida.find({ itemCategoria: itemCategoriaDb._id })
                    .populate({
                        path: 'itemCategoria',
                        select: 'nombre descripcion categoria',
                        populate: ({
                            path: 'categoria',
                            select: 'descripcion'
                        })
                    })
                    .populate({
                        path: 'reporte',
                        select: 'activo',
                        match: {
                            activo: true
                        }
                    })
                    .exec();

                reporteMedidasDb.filter(reporteMedida => {
                    if (reporteMedida.reporte !== null) {
                        reporteMedidas.push(reporteMedida)
                    }
                });
            }

            res.json({
                ok: true,
                reporteMedidas
            });
        }
    } else {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'El paramatreo indicado no corresponde a un reporte o un item.'
            }
        })
    }
});

//PUT 
app.put('/reporte-medida/:id', verificaToken, (req, res) => {
    if (ObjectId.isValid(req.params.id)) {
        let id = new ObjectId(req.params.id);

        let body = _.pick(req.body, ['valor']);

        ReporteMedida.findByIdAndUpdate(id, body, { new: true, runValidators: true }).populate({
            path: 'itemCategoria',
            select: 'nombre descripcion categoria',
            populate: ({
                path: 'categoria',
                select: 'descripcion'
            })
        })
        .populate({
            path: 'reporte',
            select: 'activo',
            match: {
                activo: true
            }
        })
        .exec((err, reporteMedidaDb) => {
            if (err) {
                return res.status(500).json({
                    ok: false,
                    err
                });
            }

            if (!reporteMedidaDb) {
                return res.status(400).json({
                    ok: false,
                    err: {
                        message: 'No se encontró el elemento indicado'
                    }
                });
            }

            res.json({
                ok: true,
                reporteMedidaDb
            });
        });

    } else {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'El paramatreo indicado no corresponde a un reporte o un item.'
            }
        })
    }

});


module.exports = app;