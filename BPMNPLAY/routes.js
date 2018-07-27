var Profesor = require("./models/profesor").Profesor;
var Estudiante = require("./models/estudiante").Estudiante;
var Usuario = require("./models/usuario").Usuario;


exports.get_inicio = function (req, res) {
    res.render('paginas/index');
};
exports.get_inicio_sesion = function (req, res) {
    res.render('paginas/inicioSesion');
};
exports.post_inicio_sesion = function (req, res) {

    Usuario.findOne({usuario: req.body.usuario}, function (error, doc) {

        req.session.nombre = doc.nombre;
        req.session.usuario = doc.usuario;
        if(doc.rol == "profesor") {
            res.redirect('/ingresoProfesor');
        } else
        {
            if(doc.rol == "estudiante") {
                res.redirect('/ingresoEstudiante');
            }
        }
    })
};
exports.get_ingreso_profesor = function (req, res) {
    if (req.session.nombre) {
        Profesor.findOne({usuario : req.session.usuario}, function (error, doc) {
            var materias = [];
            for(var i = 0 ; i < doc.materias.length; i++)
            {
                materias.push(doc.materias[i].nombre);

            }
            res.render('paginas/inicioProfesor', {nombre: req.session.nombre, usuario: req.session.usuario, materias: materias});

        });

    }
    else {
        res.redirect('/inicioSesion');
    }
};
exports.get_ingreso_estudiante = function (req, res) {

    if (req.session.nombre) {
        res.render('paginas/inicioEstudiante', {nombre: req.session.nombre});
    }
    else {
        res.redirect('/inicioSesion');
    }
};

exports.post_creacion_cuenta = function (req, res) {

    var usuario = new Usuario ({
        nombre: req.body.nombre,
        usuario: req.body.usuario,
        contrasenia: req.body.contrasenia,
        rol : req.body.rol,
        contrasenia_confirmada : req.body.contrasenia_confirmada
    })

        usuario.save();

    if (req.body.rol == "profesor") {

        var profesor = new Profesor({
            usuario: req.body.usuario,
        })

        profesor.save(function (error) {
            
        });
    } else {
        if (req.body.rol == "estudiante") {

            var estudiante = new Estudiante({
                usuario: req.body.usuario,
            })

            estudiante.save(function (error) {
                
            });
        }
    }
    res.redirect('/inicioSesion');
};

exports.post_ingreso_materia = function (req, res) {

    console.log(req.session.usuario)

    Profesor.findOne({usuario: req.session.usuario}, function (error, doc) {
        var materia = {
            nombre: req.body.nombreMateria
        }
        doc.materias.push(materia);

        doc.save(function (err, docActualizado) {
            if (err) return console.log(err);
            res.redirect('/ingresoProfesor');

        })
    });

};

exports.get_preguntas_opcion = function (req, res) {
    if (req.session.nombre && req.params.materia) {
        Profesor.findOne({usuario : req.session.usuario}, function (error, doc) {
            if(error)
            {
                console.log("Error: "+error)
            }

            var indice = doc.materias.map(function (e) {
                return e.nombre
            }).indexOf(req.params.materia);
            var idPreguntas = [];
            var enunciadoPreguntas = [];
            for(var i = 0; i < doc.materias[indice].preguntasOpcionMultiple.length; i++)
            {
                idPreguntas.push(doc.materias[indice].preguntasOpcionMultiple[i]._id);
                enunciadoPreguntas.push(doc.materias[indice].preguntasOpcionMultiple[i].enunciado);
            }
            res.render('paginas/listaPreguntaOpcionMultiple', {nombre: req.session.nombre, materia: req.params.materia, idPreguntas: idPreguntas, enunciadoPreguntas: enunciadoPreguntas });


        });

    }
    else {
        res.redirect('/inicioSesion');
    }

}

exports.post_preguntas_opcion = function (req, res) {

    console.log(req.body)

 Profesor.findOne({usuario: req.session.usuario}, function (error, doc) {

     if(error)
     {
         console.log("Error: "+error)
     }

     var indice = doc.materias.map(function (e) {
         return e.nombre
     }).indexOf(req.body.materia);
     var preguntaOpcionMultiple = {
         enunciado : req.body.enunciado,
         respuestaCorrecta :  req.body.respuestaCorrecta
     }

     if(req.body.imagenEnunciado != ""){
         preguntaOpcionMultiple.imagenEnunciado = req.body.imagenEnunciado
     }

     if(req.body.res1 != ""){
         preguntaOpcionMultiple.res1 = req.body.res1;
         preguntaOpcionMultiple.res2 = req.body.res2;
         preguntaOpcionMultiple.res3 = req.body.res3;
         preguntaOpcionMultiple.res4 = req.body.res4;
     }else {
         preguntaOpcionMultiple.imagenRes1 = req.body.imagenRes1;
         preguntaOpcionMultiple.imagenRes2 = req.body.imagenRes2;
         preguntaOpcionMultiple.imagenRes3 = req.body.imagenRes3;
         preguntaOpcionMultiple.imagenRes4 = req.body.imagenRes4;
     }

     if(indice >=0){
         doc.materias[indice].preguntasOpcionMultiple.push(preguntaOpcionMultiple);
         doc.save(function (err, docActualizado) {
             if (err) return console.log(err);
             res.redirect('/preguntasOpcionMultiple/'+req.body.materia);

         })
     }

    });

};

exports.post_detalle_opcion_multiple = function(req, res){

    Profesor.findOne({usuario: req.session.usuario}, function (error, doc) {

        if(error)
        {
            console.log("Error: "+error)
        }

        var indice = doc.materias.map(function (e) {
            console.log("ma:"+ e.nombre)
            return e.nombre
        }).indexOf(req.body.materia);

        var indicePregunta = doc.materias[indice].preguntasOpcionMultiple.map(function (e) {
            console.log("ee:"+ e._id)
            return e._id
        }).indexOf("5b5a25f4ed1e1b02f4270c04")

        console.log("arra: "+doc.materias[indice].preguntasOpcionMultiple);
        console.log("id: "+req.body.idPregunta );
        console.log("indice: "+indicePregunta );

        if(indicePregunta >= 0) {


            var preguntaOpcionMultiple = {
                enunciado: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].enunciado,
                imagenEnunciado: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].imagenEnunciado,
                res1: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].res1,
                res2: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].res2,
                res3: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].res3,
                res4: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].res4,
                imagenRes1: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].imagenRes1,
                imagenRes2: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].imagenRes2,
                imagenRes3: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].imagenRes3,
                imagenRes4: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].imagenRes4,
                respuestaCorrecta: doc.materias[indice].preguntasOpcionMultiple[indicePregunta].respuestaCorrecta
            }

            console.log(preguntaOpcionMultiple);
        }
    });


//    res.render('paginas/detalleOpcionMultiple', {nombre: req.session.nombre, materia: req.body.materia});
}

exports.salir = function (req, res) {
    req.session.usuario = null;
    res.redirect('/');
};