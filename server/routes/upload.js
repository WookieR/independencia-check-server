const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();

const fs = require('fs');
const path = require('path');

const Maquina = require('../models/maquina');
const Sector = require('../models/sector');
const { verificaToken, verificaAdminRol } = require('../middlewares/autenticacion');

app.use(fileUpload());

app.put('/upload/:tipo/:id', [verificaToken, verificaAdminRol], (req, res) => {

    let tipo = req.params.tipo;
    let id = req.params.id;

    let tiposValidos = ['maquina', 'sector'];

    if (tiposValidos.indexOf(tipo) < 0) {
        return res.status(400).json({
            ok: false,
            message: 'Tipo invalido'
        });
    }

    if (!req.files) {
        return res.status(400).json({
            ok: false,
            message: 'No se ha seleccionado ningun archivo'
        });
    }

    let archivo = req.files.archivo;

    let nombreArchivo = archivo.name.split('.');

    let extension = nombreArchivo[nombreArchivo.length - 1];

    //EXTENSIONES PERMITIDAS
    let extensionesValidas = ['jpg', 'png', 'gif', 'jpeg'];

    if (extensionesValidas.indexOf(extension) < 0) {
        return res.status(400).json({
            ok: false,
            err: {
                message: 'Las extensiones permitidas son ' + extensionesValidas
            }
        });
    }

    //CAMBIAR NOMBRE AL ARCHIVO
    let nuevoNombre = `${id}-${new Date().getMilliseconds() }.${extension}`;

    archivo.mv(`uploads/${tipo}/${nuevoNombre}`, (err) => {
        if (err) {
            return res.status(400).json({
                ok: false,
                err
            });
        }

        //IMAGEN CARGADA
        if (tipo === 'maquina') {
            imagenMaquina(id, res, nuevoNombre);
        } else {
            imagenSector(id, res, nuevoNombre);
        }
    });
});

function imagenMaquina(id, res, nuevoNombre) {
    Maquina.findById(id, (err, maquinaDb) => {
        if (err) {
            borraArchivo(nuevoNombre, 'maquina')
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!maquinaDb) {
            borraArchivo(maquinaDb.img, 'maquina')
            return res.status(400).json({
                ok: false,
                err
            });
        }

        //BORRAR
        borraArchivo(maquinaDb.img, 'maquina')

        maquinaDb.img = nuevoNombre;
        maquinaDb.save((err, maquinaGuardada) => {
            res.json({
                ok: true,
                maquinaGuardada,
                img: nuevoNombre
            });
        });
    });
}

function imagenSector(id, res, nuevoNombre) {

    Sector.findById(id, (err, sectorDb) => {
        if (err) {
            borraArchivo(nuevoNombre, 'sector')
            return res.status(400).json({
                ok: false,
                err
            });
        }

        if (!sectorDb) {
            borraArchivo(sectorDb.img, 'sector')
            return res.status(400).json({
                ok: false,
                err
            });
        }

        //BORRAR
        borraArchivo(sectorDb.img, 'sector')

        sectorDb.img = nuevoNombre;
        sectorDb.save();
        sectorDb.populate('maquina', (err, sectorGuardado) => {
            res.json({
                ok: true,
                sectorGuardado,
                img: nuevoNombre
            });
        });
    });

    // Sector.findById(id, (err, sectorDb) => {
    //     if (err) {
    //         borraArchivo(nuevoNombre, 'sector')
    //         return res.status(400).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     if (!sectorDb) {
    //         borraArchivo(sectorDb.img, 'sector')
    //         return res.status(400).json({
    //             ok: false,
    //             err
    //         });
    //     }

    //     //BORRAR
    //     borraArchivo(sectorDb.img, 'sector')

    //     sectorDb.img = nuevoNombre;
    //     sectorDb.save((err, sectorGuardado) => {
    //         res.json({
    //             ok: true,
    //             sectorGuardado,
    //             img: nuevoNombre
    //         });
    //     });
    // });
}

function borraArchivo(nombreImagen, tipo) {
    let pathImagen = path.resolve(__dirname, `../../uploads/${tipo}/${nombreImagen}`);

    if (fs.existsSync(pathImagen)) {
        fs.unlinkSync(pathImagen);
    }
}

module.exports = app;