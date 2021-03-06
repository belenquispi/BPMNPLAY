var ctx = null;
var color1 = new Image();
var color2 = new Image();
var color3 = new Image();
var casillaInicio = new Image();
var casillaFin = new Image();
var casillaIncierto = new Image();
var per1 = new Image();
var per2 = new Image();
var per3 = new Image();
var per4 = new Image();
var filas, columnas, anchoCasilla, altoCasilla;
var gameMap = [];
var colorMap = [];
var patterColor1, patterColor2, patterColor3, patterInicio, patterIncierto, patterFin;
//var socket = io();
var socket = io.connect('https://polhibou.epn.edu.ec/');
var jugadores = [];
var turnoJugadores = [];
var respuestaCorrecta = false;
var idSocketActual;
var roomActual, rol, nombreEquipo;
var dado1 = -1, dado2 = -1, dadoAnterior1 = 1, dadoAnterior2 = 1, extras = 0;
var numCasillasMoverse = 0;
var memory_array = [];
var memory_values = [];
var memory_tile_ids = [];
var tiles_flipped = 0;
var preguntasOpcionMultiple = [];
var preguntasUnirVoltear = [];
var resCorrecta;
var respuestaUnir = [];
var imagenUnir = ['botonImagenAUnir1', 'botonImagenAUnir2', 'botonImagenAUnir3', 'botonImagenAUnir4'];
var textoUnir = ['textoAUnir1', 'textoAUnir2', 'textoAUnir3', 'textoAUnir4'];
var respuestaCorrectaUnir = [];
var fps = 30;
let tiempoVoltear = 0;
let respuestaVoltearATiempo = -1;
let directions = {
    up: 0,
    right: 1,
    down: 2,
    left: 3
};
let desafio = -1;
function Character(jugador) {
    this.nombreEquipo = jugador.nombreEquipo;
    this.tileFrom = jugador.tileFrom;
    this.tileTo = jugador.tileTo;
    this.timeMoved = jugador.timeMoved;
    this.dimensions = jugador.dimensions;
    this.position = jugador.position;
    this.delayMove = jugador.delayMove;
    this.direction = jugador.direction;
    this.casilla = jugador.casilla;
    this.iconoEquipo = jugador.iconoEquipo;
    this.boton = jugador.boton;
    this.moverseA = jugador.moverseA;
    this.listo = jugador.listo;
    this.idSocket = jugador.idSocket;
    this.maldicion = jugador.maldicion;
    this.numeroCasillas = jugador.numCasillasMoverseP;
}

function obtenerDatosQuienSeConecto() {
    roomActual = document.getElementById("idPartida").value;
    rol = document.getElementById("rol").value;
    nombreEquipo = document.getElementById("nombreEquipo").value;
}

window.onload = function () {
    obtenerDatosQuienSeConecto();
    socket.emit('new player', roomActual, rol, nombreEquipo);
    color1.src = 'static/imagenes/0.png';
    color2.src = 'static/imagenes/1.png';
    color3.src = 'static/imagenes/2.png';
    casillaInicio.src = 'static/imagenes/inicio.jpg';
    casillaIncierto.src = 'static/imagenes/incierto.png';
    casillaFin.src = 'static/imagenes/fin.jpg';
    ctx = document.getElementById('game').getContext("2d");
    setTimeout(function () {
        requestAnimationFrame(drawGame);
    }, 1000 / fps);
    ctx.font = "bold 10pt sans-serif";
};

socket.on('nombreRol', function (nombre) {
    document.getElementById("sesion").innerHTML = nombre;
});

socket.on('error', function (nombre) {
    alert(nombre);
});

socket.on('tuID', function () {
    idSocketActual = socket.io.engine.id;
    console.log("Mi socket: " + idSocketActual);
});

socket.on('partida', function (data) {
    filas = data.filas;
    columnas = data.colum;
    anchoCasilla = data.anchoCas;
    altoCasilla = data.altoCas;
    gameMap = data.gameM;
    colorMap = data.colorM;
    jugadores = [];
    console.log(JSON.stringify(data.jugadores));
    for (let x = 0; x < data.jugadores.length; x++) {
        jugadores.push(new Character(data.jugadores[x]))
    }
    preguntasOpcionMultiple = data.preguntasOpcionMultiple;
    preguntasUnirVoltear = data.preguntasUnirVoltear;
    if(indiceDelJugadorConTurno()>-1) {
        numCasillasMoverse = jugadores[indiceDelJugadorConTurno()].numeroCasillas;
    }
});

socket.on('mensajeMisterio', function (num) {
    if (num == 1) {
        misterioPositivo();
    }else {
        if (num == 0) {
            misterioNegativo();
        }
    }
});

socket.on('turnoPartida', function (data) {
    turnoJugadores = data;
    console.log("hola jugadores: " + turnoJugadores);
});

socket.on('dados', function (dadoN1, dadoN2, dadoAnteriorN1, dadoAnteriorN2, numDesafioMostrarse, idSocket) {
    dado1 = dadoN1;
    dado2 = dadoN2;
    dadoAnterior1 = dadoAnteriorN1;
    dadoAnterior2 = dadoAnteriorN2;
    moverDado();
    moverDado2();
    desafio = numDesafioMostrarse;
    mostrarDesafio(numDesafioMostrarse, idSocket);
});

socket.on('ocultarBoton', function (idSocket) {
    if (idSocket == idSocketActual) {
        if (document.getElementById("botonLanzar")) {
            document.getElementById("botonLanzar").classList.add("invisible");
            document.getElementById("botonLanzar").classList.add("disabledbutton")
        }
        document.getElementById("tarjeta").classList.add("disabledbutton")
    }
});

socket.on('respondiendoIndicePreguntaOpcionMultiple', function (indicePregunta) {
    cargarPreguntaOpcionMultiple(indicePregunta);
});

socket.on('respondiendoIndicePreguntaUnir', function (arrayIndices, arrayTexto) {
    respuestaCorrectaUnir = [];
    for (let i = 0; i < arrayIndices.length; i++) {
        respuestaCorrectaUnir.push("botonImagenAUnir" + (i + 1));
        respuestaCorrectaUnir.push(preguntasUnirVoltear[arrayIndices[i]].texto);
        cargarPreguntaUnirVoltear(arrayIndices[i], arrayTexto[i], (i + 1));
    }
});

socket.on('respondiendoIndicePreguntaVoltear', function (memory) {
    memory_array = memory;
    newBoard();
});

socket.on('enviandoParEncontrado', function (memory_tile_ids, idSocketN) {
    if (idSocketN != idSocketActual) {
        for (let i = 0; i < memory_tile_ids.length; i++) {
            document.getElementById(memory_tile_ids[i]).click();
        }
    }
});

socket.on('enviandoRespuestaOpcionMultiple', function (botonSeleccionado, idSocketN) {
    if (idSocketN != idSocketActual) {
        document.getElementById(botonSeleccionado).click();
    }
});

socket.on('enviandoRespuestaUnir', function (respuestaUnir, idSocketN) {
    if (idSocketN != idSocketActual) {
        reiniciarUnir();
        for (var i = 0; i < respuestaUnir.length; i++) {
            document.getElementById(respuestaUnir[i]).click();
        }
    }
});

socket.on('enviandoVerificarUnir', function (idSocketN) {
    if (idSocketN != idSocketActual) {
        verificarRespuestaUnir();
    }
});

socket.on('enviandoDarLaVuelta', function (idSocketN) {
    if (idSocketN != idSocketActual) {
        darLaVuelta();
    }
});

socket.on('avisoTiempoTerminado', function (idSocketN) {
    if (idSocketN != idSocketActual) {
        console.log("Recibi el emit del tiempo terminado");
        tiempoVoltear = 0;
    }
});

socket.on('partidaFinalizada', function () {
    document.getElementById("botonFinalizacion").removeAttribute("disabled");
    document.getElementById("botonFinalizacion").click();
});

socket.on('partidaCancelada', function () {
    document.getElementById("linkCancelarPartida").click();
});

function agregarNumerosCasilla() {
    for (var y = 0; y < filas; ++y) {
        for (var x = 0; x < columnas; ++x) {
            switch (gameMap[((y * columnas) + x)]) {
                case -1:
                case 0 :
                case 34:
                case 7:
                case 13:
                case 21:
                case 27:
                    break;
                default:
                    ctx.fillStyle = "#000000";
                    ctx.fillText(gameMap[((y * columnas) + x)], x * anchoCasilla + anchoCasilla / 2, y * altoCasilla + (anchoCasilla / 4), anchoCasilla);
            }
        }
    }
}

function drawGame() {
    if (ctx == null) {
        return;
    }
    if (numCasillasMoverse > 0 && respuestaCorrecta == true) {
        var gameTime = Date.now();
        var indiceJugadorConTurno = indiceDelJugadorConTurno();
        if (!jugadores[indiceJugadorConTurno].processMovement(gameTime)) {
            if (jugadores[indiceJugadorConTurno].casilla < 34) {
                if (jugadores[indiceJugadorConTurno].canMoveUp()) {
                    jugadores[indiceJugadorConTurno].moveUp(gameTime);
                }
                else if (jugadores[indiceJugadorConTurno].canMoveDown()) {
                    jugadores[indiceJugadorConTurno].moveDown(gameTime);
                }
                else if (jugadores[indiceJugadorConTurno].canMoveLeft()) {
                    jugadores[indiceJugadorConTurno].moveLeft(gameTime);
                }
                else if (jugadores[indiceJugadorConTurno].canMoveRight()) {
                    jugadores[indiceJugadorConTurno].moveRight(gameTime);
                }
            }
        }
    } else {
        respuestaCorrecta = false;
        bloquearBoton();
        if (jugadores.length > 0 && numCasillasMoverse == 0 && turnoJugadores.length > 0 && (turnoJugadores[0] == idSocketActual) && (jugadores[jugadores.map(function (value) {
            return value.idSocket
        }).indexOf(idSocketActual)].boton == 0)) {
            desbloquearBoton();
        }
        mostrarJugadorActual();
    }

    for (let y = 0; y < filas; ++y) {
        for (let x = 0; x < columnas; ++x) {
            patterColor1 = ctx.createPattern(color1, "repeat");
            patterColor2 = ctx.createPattern(color2, "repeat");
            patterColor3 = ctx.createPattern(color3, "repeat");
            patterInicio = ctx.createPattern(casillaInicio, "repeat");
            patterIncierto = ctx.createPattern(casillaIncierto, "repeat");
            patterFin = ctx.createPattern(casillaFin, "repeat");

            switch (gameMap[((y * columnas) + x)]) {
                case -1:
                    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    break;
                case 0:
                    ctx.fillStyle = patterInicio;
                    break;
                case 7:
                case 13:
                case 21:
                case 27:
                    ctx.fillStyle = patterIncierto;
                    break;
                case 34:
                    ctx.fillStyle = patterFin;
                    break;
                default:
                    switch (colorMap[((y * columnas) + x)]) {
                        case 0:
                            ctx.fillStyle = patterColor1;
                            break;
                        case 1:
                            ctx.fillStyle = patterColor2;
                            break;
                        case 2:
                            ctx.fillStyle = patterColor3;
                            break;
                        default:
                            ctx.fillStyle = 'rgba(0, 0, 0, 0)';
                    }
            }
            ctx.fillRect(x * anchoCasilla, y * altoCasilla, anchoCasilla, altoCasilla);
        }
    }
    agregarNumerosCasilla();
    dibujarJugador();
    dibujarLlegarA();
    habilitarTablaJugador();
    requestAnimationFrame(drawGame);
}

function controlarTiempo() {
    let temporizador = setInterval(function () {
        tiempoVoltear--;
        if (tiempoVoltear > 0) {
            document.getElementById("progreso").style.width = tiempoVoltear - 2 + "%";
        } else {
            clearTimeout(temporizador);
            if (respuestaVoltearATiempo == 0) {
                if (turnoJugadores[0] == idSocketActual) {
                    socket.emit('tiempoTerminado', roomActual);
                }
            }
            if (respuestaVoltearATiempo != 1) {
                tiempoVoltear = 0;
                desafioIncorrectoVoltear();
                voltearTarjeta(2000);
            }
        }
    }, 400);
}

function dibujarJugador() {
    for (let i = 0; i < jugadores.length; i++) {
        if (jugadores[i].idSocket != "") {
            ctx.fillStyle = jugadores[i].colorP;
            switch (i) {
                case 0:
                    per1.src = 'static/imagenes/equipo' + jugadores[i].iconoEquipo + '.svg';
                    ctx.drawImage(per1, jugadores[i].position[0], jugadores[i].position[1], (jugadores[i].dimensions[0] / 2), (jugadores[i].dimensions[1] / 2));
                    break;
                case 1:
                    per2.src = 'static/imagenes/equipo' + jugadores[i].iconoEquipo + '.svg';
                    ctx.drawImage(per2, jugadores[i].position[0] + jugadores[i].dimensions[1] / 2, jugadores[i].position[1], jugadores[i].dimensions[0] / 2, jugadores[i].dimensions[1] / 2);
                    break;
                case 2:
                    per3.src = 'static/imagenes/equipo' + jugadores[i].iconoEquipo + '.svg';
                    ctx.drawImage(per3, jugadores[i].position[0], jugadores[i].position[1] + jugadores[i].dimensions[0] / 2, jugadores[i].dimensions[0] / 2, jugadores[i].dimensions[1] / 2);
                    break;
                case 3:
                    per4.src = 'static/imagenes/equipo' + jugadores[i].iconoEquipo + '.svg';
                    ctx.drawImage(per4, jugadores[i].position[0] + jugadores[i].dimensions[0] / 2, jugadores[i].position[1] + jugadores[i].dimensions[0] / 2, jugadores[i].dimensions[0] / 2, jugadores[i].dimensions[1] / 2);
                    break;
                default:
            }
        }
    }
}

function dibujarLlegarA() {
    if (jugadores.length > 0) {
        if (indiceDelJugadorConTurno() >= 0 && jugadores[indiceDelJugadorConTurno()].moverseA > 0) {
            let moverseA = jugadores[indiceDelJugadorConTurno()].moverseA;
            if (moverseA != jugadores[indiceDelJugadorConTurno()].casilla) {
                let casilla = jugadores[indiceDelJugadorConTurno()].casilla;
                for (let y = 0; y < filas; ++y) {
                    for (let x = 0; x < columnas; ++x) {
                        let caso = gameMap[((y * columnas) + x)];
                        switch (true) {
                            case (caso == casilla):
                            case (caso == moverseA):
                                break;
                            case (caso >= 0 && caso < 35):
                                ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
                                ctx.fillRect(x * anchoCasilla, y * altoCasilla, anchoCasilla, altoCasilla);
                                break;
                            default:
                        }
                    }
                }
            }

        }
    }
}

function indiceDelJugadorConTurno() {
    let indice = -1;
    if (jugadores.length > 0) {
        indice = jugadores.map(function (value) {
            return value.idSocket;
        }).indexOf(turnoJugadores[0]);
    } else {
        indice = -1;
    }
    return indice;
}

function desbloquearBoton() {

    if (document.getElementById("botonLanzar")) {
        document.getElementById("botonLanzar").classList.remove("invisible");
        document.getElementById("botonLanzar").classList.remove("disabledbutton")
    }
    document.getElementById("tarjeta").classList.add("disabledbutton")
}

function bloquearBoton() {
    if (document.getElementById("botonLanzar")) {
        document.getElementById("botonLanzar").classList.add("invisible");
        document.getElementById("botonLanzar").classList.add("disabledbutton")
    }
    document.getElementById("tarjeta").classList.add("disabledbutton");

    if (turnoJugadores.length > 0 && turnoJugadores[0] == idSocketActual) {
        document.getElementById("tarjeta").classList.remove("disabledbutton")
    }
}

function lanzarDado() {
    bloquearBoton();
    var misterio = jugadores[jugadores.map(function (value) {
        return value.idSocket;
    }).indexOf(idSocketActual)].maldicion;
    extras = 0;
    document.getElementById('sonidoDados').play();
    if (misterio == 1) {
        dado1 = 1;
        dado2 = 1;
    } else {
        if (misterio == 2) {
            extras = Math.floor(Math.random() * 3 + 1);
            movimientoExtra();
            document.getElementById("casillasExtras").innerText = "" + extras + "";
        }
        dadoRandomico();
    }
    moverDado();
    moverDado2();
    dadoAnterior1 = dado1;
    dadoAnterior2 = dado2;
    numCasillasMoverse = dado1 + dado2 + extras;
    socket.emit('dados', dado1, dado2, roomActual, dadoAnterior1, dadoAnterior2, numCasillasMoverse, misterio);
}

function dadoRandomico() {
    dado1 = Math.floor(Math.random() * 6 + 1);
    dado2 = Math.floor(Math.random() * 6 + 1);
   if (dado1 == dadoAnterior1 || dado2 == dadoAnterior2) {
        dadoRandomico();
    }
}

function moverDado() {
    var element;
    switch (dado1) {
        case 1:
            element = document.getElementById("radio-uno");
            element.checked = "true";
            break;
        case 2:
            element = document.getElementById("radio-dos");
            element.checked = "true";
            break;
        case 3:
            element = document.getElementById("radio-tres");
            element.checked = "true";
            break;
        case 4:
            element = document.getElementById("radio-top");
            element.checked = "true";
            break;
        case 5:
            element = document.getElementById("radio-bottom");
            element.checked = "true";
            break;
        case 6:
            element = document.getElementById("radio-back");
            element.checked = "true";
            break;
    }

}

function moverDado2() {
    var element2;
    switch (dado2) {
        case 1:
            element2 = document.getElementById("radio-uno-2");
            element2.checked = "true";
            break;
        case 2:
            element2 = document.getElementById("radio-dos-2");
            element2.checked = "true";
            break;
        case 3:
            element2 = document.getElementById("radio-tres-2");
            element2.checked = "true";
            break;
        case 4:
            element2 = document.getElementById("radio-top-2");
            element2.checked = "true";
            break;
        case 5:
            element2 = document.getElementById("radio-bottom-2");
            element2.checked = "true";
            break;
        case 6:
            element2 = document.getElementById("radio-back-2");
            element2.checked = "true";
            break;
    }
}

function habilitarTablaJugador() {
    for (let i = 0; i < jugadores.length; i++) {
        if (jugadores[i].idSocket != "") {
            document.getElementById("tablajug" + (i + 1)).style.visibility = 'visible';
        }
    }
}

function mostrarJugadorActual() {
    for (let i = 0; i < jugadores.length; i++) {
        document.getElementById("turno" + (i + 1)).setAttribute("hidden", "");
    }

    for (let j = 0; j < jugadores.length; j++) {
        if (!document.getElementById("imagenJugador" + (j + 1)) && jugadores[j].idSocket != "") {
            let images = document.createElement("IMG");
            images.setAttribute("src", "static/imagenes/equipo" + (jugadores[j].iconoEquipo) + ".svg");
            images.setAttribute("id", "imagenJugador" + (j + 1));
            images.setAttribute("height", "50");
            images.setAttribute("width", "50");
            document.getElementById("columna" + (j + 1)).appendChild(images);
            document.getElementById("nombreEquipo" + (j + 1)).innerHTML = (jugadores[j].nombreEquipo).toLocaleUpperCase();
        }
    }
    let indiceJugadorActual = indiceDelJugadorConTurno();

    if (indiceJugadorActual >= 0 && turnoJugadores.length > 0) {
        if (document.getElementById("tablajug" + (indiceJugadorActual + 1))) {
            document.getElementById("turno" + (indiceJugadorActual + 1)).removeAttribute("hidden");
            document.getElementById("tablajug" + (indiceJugadorActual + 1)).classList.add('miTurno');
            cambiarImagen(indiceJugadorActual);
        }
    }
}

function cambiarImagen(num) {
    for (var j = 0; j < turnoJugadores.length; j++) {
        if (j == num) {
            document.getElementById("imagenJugador" + (j + 1)).src = "static/imagenes/equipo" + jugadores[j].iconoEquipo + ".svg";
        } else {
            if (document.getElementById("imagenJugador" + (j + 1))) {
                document.getElementById("imagenJugador" + (j + 1)).src = "static/imagenes/equipo" + jugadores[j].iconoEquipo + ".svg";
            }
        }
    }
}

function mostrarDesafio(colorCa, idSocket) {
    respuestaVoltearATiempo = -1;
    document.getElementById('tipoJuego').innerText = "VOLTÉAME";
    switch (colorCa) {
        case 0:
            document.getElementById('tarjeta').style.backgroundColor = "rgba(242, 245, 169, 0.3)";
            document.getElementById('desafios').style.backgroundColor = "rgba(242, 245, 169, 0.3)";
            if (idSocket == idSocketActual) {
                socket.emit('solicitarPreguntaVoltear', roomActual);
                respuestaVoltearATiempo = 0;
            }
            document.getElementById("tipoJuego").innerHTML = "Voltear";
            document.getElementById("desafios").removeAttribute("hidden");
            document.getElementById("memory_boardMulti").removeAttribute("hidden");
            document.getElementById("barraTiempoUnir").removeAttribute("hidden");
            document.getElementById("respuestaUnirVoltear").removeAttribute("hidden");
            document.getElementById("ultimoPar").setAttribute("src", "../../../static/imagenes/imagenVacia.svg");
            document.getElementById("ultimoNombre").innerHTML = "";
            document.getElementById("unir").setAttribute("hidden", "");
            document.getElementById("opcionMultiple").setAttribute("hidden", "");
            break;
        case 1:
            document.getElementById('tarjeta').style.backgroundColor = "rgba(255, 185, 240, 0.3)";
            document.getElementById('desafios').style.backgroundColor = "rgba(255, 185, 240, 0.3)";
            respuestaUnir = [];
            if (idSocket == idSocketActual) {
                socket.emit('solicitarPreguntaUnir', roomActual);
            }
            document.getElementById("tipoJuego").innerHTML = "Emparejar";
            document.getElementById("desafios").removeAttribute("hidden");
            document.getElementById("unir").removeAttribute("hidden");
            document.getElementById("memory_boardMulti").setAttribute("hidden", "");
            document.getElementById("barraTiempoUnir").setAttribute("hidden", "");
            document.getElementById("respuestaUnirVoltear").setAttribute("hidden", "");
            document.getElementById("opcionMultiple").setAttribute("hidden", "");
            break;
        case 2:
            document.getElementById('tarjeta').style.backgroundColor = "rgba(129, 218, 245, 0.3)";
            document.getElementById('desafios').style.backgroundColor = "rgba(129, 218, 245, 0.3)";
            if (idSocket == idSocketActual) {
                socket.emit('solicitarPreguntaOpcionMultiple', roomActual);
            }
            document.getElementById("tipoJuego").innerHTML = "Opción Múltiple";
            document.getElementById("desafios").removeAttribute("hidden");
            document.getElementById("opcionMultiple").removeAttribute("hidden");
            document.getElementById("unir").setAttribute("hidden", "");
            document.getElementById("memory_boardMulti").setAttribute("hidden", "");
            document.getElementById("barraTiempoUnir").setAttribute("hidden", "");
            document.getElementById("respuestaUnirVoltear").setAttribute("hidden", "");
            break;
        default:
    }
}

function newBoard() {
    tiles_flipped = 0;
    let output = '';
    for (let i = 0; i < memory_array.length; i++) {
        if (idSocketActual == turnoJugadores[0]) {
            output += '<img id="tile_' + i + '" alt="" onclick="memoryFlipTile(this,\'' + memory_array[i] + '\')">';
        }
        else {
            output += '<img id="tile_' + i + '"  class = "disabledbutton" alt="" onclick="memoryFlipTile(this,\'' + memory_array[i] + '\')">';
        }
    }
    document.getElementById('memory_boardMulti').innerHTML = output;
}

function memoryFlipTile(tile, val) {
    if (tile.alt == "" && memory_values.length < 2) {
        tile.src = val;
        tile.alt = val;
        if (memory_values.length == 0) {
            memory_values.push(val);
            memory_tile_ids.push(tile.id);
        } else if (memory_values.length == 1) {
            memory_values.push(val);
            memory_tile_ids.push(tile.id);
            if (memory_values[0] == memory_values[1]) {
                tiles_flipped += 2;
                mostrarMensajeParEncontrado(memory_values[0]);
                if (turnoJugadores[0] == idSocketActual) {
                    socket.emit('parEncontrado', roomActual, memory_tile_ids);
                }
                // Clear both arrays
                memory_values = [];
                memory_tile_ids = [];
                // Check to see if the whole board is cleared
                if (tiles_flipped == memory_array.length) {
                    tiempoVoltear = 0;
                    respuestaVoltearATiempo = 1;
                    desafioCorrecto();
                    voltearTarjeta(2000);
                }
            } else {
                function flip2Back() {
                    // Flip the 2 tiles back over
                    var tile_1 = document.getElementById(memory_tile_ids[0]);
                    var tile_2 = document.getElementById(memory_tile_ids[1]);
                    // tile_1.style.background = 'url(corona.png) no-repeat';
                    tile_1.src = "corona.png";
                    tile_1.alt = "";
                    tile_1.removeAttribute("src");
                    //tile_2.style.background = 'url(corona.png) no-repeat';
                    tile_2.src = "corona.png";
                    tile_2.alt = "";
                    tile_2.removeAttribute("src");
                    // Clear both arrays
                    memory_values = [];
                    memory_tile_ids = [];
                }
                setTimeout(flip2Back, 700);
            }
        }
    }
}

function cargarPreguntaOpcionMultiple(indicePregunta) {
    if (idSocketActual != turnoJugadores[0]) {
        document.getElementById("opcionMultiple").classList.add("disabledbutton")
    } else {
        if (document.getElementById("opcionMultiple").classList.contains("disabledbutton")) {
            document.getElementById("opcionMultiple").classList.remove("disabledbutton")
        }
    }
    document.getElementById("enunciado").innerHTML = preguntasOpcionMultiple[indicePregunta].enunciado;
    if (preguntasOpcionMultiple[indicePregunta].hasOwnProperty("imagenEnunciado") && preguntasOpcionMultiple[indicePregunta].imagenEnunciado != "") {
        document.getElementById("imagenEnunciado").src = preguntasOpcionMultiple[indicePregunta].imagenEnunciado;
    } else {
        document.getElementById("imagenEnunciado").src = "static/imagenes/imagenVacia.svg";
    }
    document.getElementById("divRespuestasOpcionMultiple").removeAttribute("hidden");

    if (document.getElementById("res1")) {
        for (let j = 0; j < 4; j++) {
            let elemento = document.getElementById("res" + (j + 1));
            elemento.parentNode.removeChild(elemento);
        }
    }
    for (let j = 0; j < 4; j++) {
        let boton = document.createElement("BUTTON");
        boton.setAttribute("id", "res" + (j + 1));
        boton.setAttribute("onclick", "validarRespuesta(this)");
        boton.setAttribute("class", "btn btn-block btn-outline-dark cortaPalabra");
        boton.setAttribute("style", "font-weight: bold");
        boton.setAttribute("type", "button");
        boton.style.margin = "0px 5px";
        document.getElementById("botonTextoUnir" + (j + 1)).appendChild(boton);
    }
    if (preguntasOpcionMultiple[indicePregunta].hasOwnProperty("imagenRes1") && preguntasOpcionMultiple[indicePregunta].imagenRes1 != "") {
        for (let j = 0; j < 4; j++) {
            let images = document.createElement("IMG");
            switch (j) {
                case 0:
                    images.setAttribute("src", preguntasOpcionMultiple[indicePregunta].imagenRes1);
                    break;
                case 1:
                    images.setAttribute("src", preguntasOpcionMultiple[indicePregunta].imagenRes2);
                    break;
                case 2:
                    images.setAttribute("src", preguntasOpcionMultiple[indicePregunta].imagenRes3);
                    break;
                case 3:
                    images.setAttribute("src", preguntasOpcionMultiple[indicePregunta].imagenRes4);
                    break;
            }
            images.setAttribute("id", "imagenRes" + (j + 1));
            images.setAttribute("class", "img-thumbnail");
            images.setAttribute("height", "50");
            images.setAttribute("width", "50");
            document.getElementById("res" + (j + 1)).appendChild(images);
        }
    }    else {
        for (let j = 0; j < 4; j++) {
            let texto = "";
            document.getElementById("res" + (j + 1)).setAttribute("value", "res");
            switch (j) {
                case 0:
                    texto = document.createTextNode(preguntasOpcionMultiple[indicePregunta].res1);
                    break;
                case 1:
                    texto = document.createTextNode(preguntasOpcionMultiple[indicePregunta].res2);
                    break;
                case 2:
                    texto = document.createTextNode(preguntasOpcionMultiple[indicePregunta].res3);
                    break;
                case 3:
                    texto = document.createTextNode(preguntasOpcionMultiple[indicePregunta].res4);
                    break;
            }
            document.getElementById("res" + (j + 1)).appendChild(texto);

        }
    }
    resCorrecta = preguntasOpcionMultiple[indicePregunta].respuestaCorrecta;
}

function cargarPreguntaUnirVoltear(indicePregunta, texto, a) {
    if (idSocketActual != turnoJugadores[0]) {
        document.getElementById("unir").classList.add("disabledbutton");
        document.getElementById("reiniciarUnir").classList.add("invisible");
        document.getElementById("enviarUnir").classList.add("invisible")

    }
    else {
        if (document.getElementById("unir").classList.contains("disabledbutton")) {
            document.getElementById("unir").classList.remove("disabledbutton")
        }
        if (document.getElementById("reiniciarUnir").classList.contains("invisible")) {
            document.getElementById("reiniciarUnir").classList.remove("invisible")
        }
        if (document.getElementById("enviarUnir").classList.contains("invisible")) {
            document.getElementById("enviarUnir").classList.remove("invisible")
        }
    }
    document.getElementById("botonImagenAUnir" + (a)).setAttribute("nombre", preguntasUnirVoltear[indicePregunta].imagen);
    document.getElementById("imagenAUnir" + (a)).src = preguntasUnirVoltear[indicePregunta].imagen;
    document.getElementById("textoAUnir" + (a)).innerHTML = texto;
}

function obtenerId(e) {
    let id = e.id;
    switch (true) {

        case respuestaUnir.length < 2:
            document.getElementById(id).style.border = "thick solid #B78E4C";
            document.getElementById(id).style.background = "#B78E4C";
            document.getElementById(id).style.color = "black";
            break;
        case respuestaUnir.length < 4:
            document.getElementById(id).style.border = "thick solid #4CB0B7";
            document.getElementById(id).style.background = "#4CB0B7";
            document.getElementById(id).style.color = "black";

            break;
        case respuestaUnir.length < 6:
            document.getElementById(id).style.border = "thick solid #864CB7";
            document.getElementById(id).style.background = "#864CB7";
            document.getElementById(id).style.color = "black";

            break;
        case respuestaUnir.length < 8:
            document.getElementById(id).style.border = "thick solid #F9B052";
            document.getElementById(id).style.background = "#F9B052";
            document.getElementById(id).style.color = "black";

            break;

    }
    respuestaUnir.push(id);

    if (turnoJugadores[0] == idSocketActual) {
        socket.emit("respuestaUnir", roomActual, respuestaUnir);
    }

    if (imagenUnir.indexOf(id) >= 0) {
        for (let i = 0; i < imagenUnir.length; i++) {
            document.getElementById(imagenUnir[i]).setAttribute("disabled", "");
        }
        for (let j = 0; j < textoUnir.length; j++) {
            if (respuestaUnir.indexOf(textoUnir[j]) > 0) {
                document.getElementById(textoUnir[j]).setAttribute("disabled", "");
            } else {
                document.getElementById(textoUnir[j]).removeAttribute("disabled");
            }
        }
    } else if (textoUnir.indexOf(id) >= 0) {
        for (let k = 0; k < textoUnir.length; k++) {
            document.getElementById(textoUnir[k]).setAttribute("disabled", "");
        }

        for (let l = 0; l < imagenUnir.length; l++) {
            if (respuestaUnir.indexOf(imagenUnir[l]) >= 0) {
                document.getElementById(imagenUnir[l]).setAttribute("disabled", "");
            } else {
                document.getElementById(imagenUnir[l]).removeAttribute("disabled");
            }
        }
    }
}

function verificarCompletoUnir() {
    if (respuestaUnir.length != 8) {
        document.getElementById("enviarUnir").setAttribute("disabled", "");
    }
    else {
        document.getElementById("enviarUnir").removeAttribute("disabled");
    }
}

function reiniciarUnir() {
    for (let i = 0; i < respuestaUnir.length; i++) {
        document.getElementById(respuestaUnir[i]).removeAttribute("style");
        document.getElementById(respuestaUnir[i]).style.border = "gray";
        if (imagenUnir.indexOf(respuestaUnir[i]) >= 0) {
            document.getElementById(respuestaUnir[i]).removeAttribute("disabled");
        }
    }

    for (let j = respuestaUnir.length; j > 0; j--) {
        respuestaUnir.pop();
    }
    if (turnoJugadores[0] == idSocketActual) {
        socket.emit("respuestaUnir", roomActual, respuestaUnir);
    }
}

function mostrarMensajeParEncontrado(url) {
    let indicePreguntaUnir = preguntasUnirVoltear.map(function (e) {
        return e.imagen
    }).indexOf(url);
    if (indicePreguntaUnir >= 0) {
        document.getElementById("ultimoPar").setAttribute("src", url);
        document.getElementById("ultimoNombre").innerHTML = preguntasUnirVoltear[indicePreguntaUnir].texto;
        document.getElementById("sonidoCorrecto").play();
    }

}

function validarRespuesta(boton) {
    if (turnoJugadores[0] == idSocketActual) {
        socket.emit("respuestaOpcionMultiple", roomActual, boton.id);
    }
    if (boton.id == resCorrecta) {
        desafioCorrecto();
        document.getElementById(boton.id).classList.remove('btn-outline-dark');
        document.getElementById(boton.id).classList.add('btn-success');
    }
    else {
        desafioIncorrecto();
        document.getElementById(boton.id).classList.remove("btn-outline-dark");
        document.getElementById(boton.id).classList.add("btn-danger");
        document.getElementById(resCorrecta).classList.remove("btn-outline-dark");
        document.getElementById(resCorrecta).classList.add("btn-success");
    }

    voltearTarjeta(2000);
}

function verificarRespuestaUnir() {
    if (turnoJugadores[0] == idSocketActual) {
        socket.emit('verificarUnir', roomActual);
    }
    let contadorRespuestas = 0;
    for (let j = 0; j < respuestaUnir.length - 1; j = j + 2) {
        for (let k = 0; k < respuestaCorrectaUnir.length - 1; k++) {
            let idBoton1 = respuestaUnir[j];
            let idBoton2 = respuestaUnir[j + 1];
            if (idBoton1 == respuestaCorrectaUnir[k]
                && document.getElementById(idBoton2).textContent == respuestaCorrectaUnir[k + 1]) {
                contadorRespuestas++;
                k = respuestaUnir.length;
            }
            else {
                k++;
            }
        }
    }
    let texto = [];
    for (let a = 0; a < respuestaUnir.length - 1; a = a + 2) {
        texto.push(document.getElementById(respuestaUnir[a + 1]).textContent);
    }
    for (let x = 0; x < respuestaCorrectaUnir.length - 1; x = x + 2) {
        for (let y = 0; y < respuestaUnir.length - 1; y = y + 2) {
            if (respuestaCorrectaUnir[x] == respuestaUnir[y]) {
                document.getElementById("textoAUnir" + ((x / 2) + 1)).textContent = texto[y / 2];
                y = respuestaUnir.length;
            }
        }
    }
    for (let c = 0; c < respuestaCorrectaUnir.length - 1; c = c + 2) {
        for (let d = 1; d < 5; d++) {
            if (respuestaCorrectaUnir[c + 1] == document.getElementById("textoAUnir" + d).textContent) {
                document.getElementById("textoAUnir" + (d)).style.background = document.getElementById(respuestaCorrectaUnir[c]).style.background;
                d = 5;
            }
        }
    }

    mostrarRespuestaCorrectaUnir();
    if (contadorRespuestas == 4) {
        desafioCorrecto();
    } else {
        desafioIncorrecto();
    }
    if (document.getElementById("botonLanzar")) {
        document.getElementById("botonLanzar").classList.add("disabledbutton");
        document.getElementById("botonLanzar").classList.add("invible");
    }
    voltearTarjeta(2000);
    setTimeout(function () {
        reiniciarUnir();
    }, 2000)
}

function desafioIncorrecto() {
    mostrarMensaje("snackbarIn");
    console.log("El desafío es incorrecto en el tiempo");
    respuestaCorrecta = false;
    if (turnoJugadores[0] == idSocketActual) {
        socket.emit('pasarTurno', roomActual);
    }
    document.getElementById('sonidoError').play();

}

function desafioIncorrectoVoltear() {
    mostrarMensaje("snackbarIn");
    console.log("El desafío es incorrecto en el tiempo");
    respuestaCorrecta = false;
    document.getElementById('sonidoError').play();
}

function desafioCorrecto() {
    mostrarMensaje("snackbar");
    document.getElementById('sonidoCorrecto').play();
    respuestaCorrecta = true;
}

function misterioPositivo() {
    mostrarMensaje("snackbarPositivo");
    document.getElementById('sonidoCorrecto').play();
}

function misterioNegativo() {
    mostrarMensaje("snackbarNegativo");
    document.getElementById('sonidoError').play();
}

function movimientoExtra() {
    mostrarMensaje("snackbarExtras");
    document.getElementById('sonidoCorrecto').play();
}

function mostrarMensaje(texto) {
    let x = document.getElementById(texto);
    x.className = "show";
    setTimeout(function () {
        x.className = x.className.replace("show", "");
    }, 4000);
}

function mostrarRespuestaCorrectaUnir() {
    for (let i = 0; i < 4; i++) {
        if (document.getElementById("textoAUnir" + (i + 1)).textContent == respuestaCorrectaUnir[(i * 2) + 1]) {
            document.getElementById("textoAUnir" + (i + 1)).style.border = "thick solid green";
            document.getElementById("botonImagenAUnir" + (i + 1)).style.border = "thick solid green";
        } else {
            document.getElementById("textoAUnir" + (i + 1)).style.border = "thick solid red";
            document.getElementById("botonImagenAUnir" + (i + 1)).style.border = "thick solid red";
        }
    }
}

function darLaVuelta() {
    document.getElementById("tarjeta").style.transform = "perspective( 600px ) rotateY( -180deg )";
    document.getElementById("desafios").style.transform = "perspective( 600px ) rotateY( 0deg )";
    console.log("Se dio la vuelta");
    if (turnoJugadores[0] == idSocketActual) {
        socket.emit('darLaVuelta', roomActual);
    }
    if(desafio == 0) {
        tiempoVoltear = 100;
        controlarTiempo();
    }
}

function voltearTarjeta(t) {
    console.log("Se va a dar la vuelta en dos segundos");
    setTimeout(function () {
            document.getElementById("desafios").style.transform = "perspective( 600px ) rotateY( 180deg )";
            document.getElementById('tarjeta').style.backgroundColor = "rgba(120, 118, 118, 0.73)";
            document.getElementById("tarjeta").style.transform = "perspective( 600px ) rotateY( 0deg )";
            setTimeout(function () {
                document.getElementById('desafios').style.backgroundColor = "rgba(120, 118, 118, 0.73)";
            }, 1000);
        }
        , t);
}

function finalizarPartida() {
    let r = confirm("¿Está seguro de finalizar la partida?");
    if (r == true) {
        socket.emit('partidaCancelada', roomActual);
        document.getElementById('linkCancelarPartida').click();
    }
}

Character.prototype.placeAt = function (x, y) {
    this.tileFrom = [x, y];
    this.tileTo = [x, y];
    this.position = [((anchoCasilla * x) + ((anchoCasilla - this.dimensions[0]) / 2)), ((altoCasilla * y) + ((altoCasilla - this.dimensions[1]) / 2))];
};

Character.prototype.processMovement = function (t) {
    if (this.tileFrom[0] == this.tileTo[0] && this.tileFrom[1] == this.tileTo[1]) {
        return false;
    }
    if (this.casilla == 34) {
        numCasillasMoverse = 0;
        console.log("Enviar aviso que ya se termino, pero solo manda el emit cuando el cliente que llego corresponde al id socket actual");
        if(turnoJugadores[0] == idSocketActual){
            socket.emit('movimientoFinalizado', roomActual, this);
        }
        /*if (partidas[indicePartidaActual].lugaresJugadores.indexOf(this.idSocket) == -1) {
        }*/
        //Verificar en el servidor, si al retirar el jugador que llego a la 34 los turno jugadores es menor < 2 para finalizar la partida.
    }
    if ((t - this.timeMoved) >= this.delayMove) {
        this.placeAt(this.tileTo[0], this.tileTo[1]);
        if (numCasillasMoverse > 0) {
            if (this.canMoveDirection(this.direction)) {
                this.moveDirection(this.direction, t);
            }
            else {
                this.nuevaDireccion();
                this.moveDirection(this.direction, t);
            }
            numCasillasMoverse = numCasillasMoverse - 1;
            if (this.casilla < this.moverseA) {
                this.casilla += 1;
            }
            if (turnoJugadores[0] == idSocketActual && numCasillasMoverse == 0) {
                console.log("Se manda emit");
                socket.emit('movimientoFinalizado', roomActual, this);
                if(this.casilla == 7 || this.casilla == 13 || this.casilla == 21 || this.casilla == 27){
                    socket.emit('solicitarMisterio', roomActual, this);
                }
            }
        }
        else {
            numCasillasMoverse = 0;
            console.log("Se manda emit www");
            if (turnoJugadores[0] == idSocketActual) {
                socket.emit('movimientoFinalizado', roomActual, this);
                if(this.casilla == 7 || this.casilla == 13 || this.casilla == 21 || this.casilla == 27){
                    socket.emit('solicitarMisterio', roomActual, this);
                }
            }
            //Avisar al servidor que ya se ha finalizado el movimiento de jugador localmente
            //En el caso de llegar a las casillas 7, 13, 21 y 27 solicitar el misterio asignado
            // En caso de que la casilla en la que se esta el servidor deberá enviarle al final  de la lista de turno jugadores

        }
    }
    else {
        this.position[0] = (this.tileFrom[0] * anchoCasilla) + ((anchoCasilla - this.dimensions[0]) / 2);
        this.position[1] = (this.tileFrom[1] * altoCasilla) + ((altoCasilla - this.dimensions[1]) / 2);

        if (this.tileTo[0] != this.tileFrom[0]) {
            var diff = (anchoCasilla / this.delayMove) * (t - this.timeMoved);
            this.position[0] += (this.tileTo[0] < this.tileFrom[0] ? 0 - diff : diff);
        }
        if (this.tileTo[1] != this.tileFrom[1]) {
            var diff = (altoCasilla / this.delayMove) * (t - this.timeMoved);
            this.position[1] += (this.tileTo[1] < this.tileFrom[1] ? 0 - diff : diff);
        }

        this.position[0] = Math.round(this.position[0]);
        this.position[1] = Math.round(this.position[1]);
    }
    return true;
};

Character.prototype.canMoveTo = function (x, y) {
    if (x < 0 || x >= columnas || y < 0 || y >= filas) {
        return false;
    }
    else {
        if ([gameMap[toIndex(x, y)]] == -1) {
            return false;
        }
        else {
            return [gameMap[((y * columnas) + x)]] > this.casilla;
        }
    }
};

Character.prototype.canMoveUp = function () {
    return this.canMoveTo(this.tileFrom[0], this.tileFrom[1] - 1);
};

Character.prototype.canMoveDown = function () {
    return this.canMoveTo(this.tileFrom[0], this.tileFrom[1] + 1);
};

Character.prototype.canMoveLeft = function () {
    return this.canMoveTo(this.tileFrom[0] - 1, this.tileFrom[1]);
};

Character.prototype.canMoveRight = function () {
    return this.canMoveTo(this.tileFrom[0] + 1, this.tileFrom[1]);
};

Character.prototype.canMoveDirection = function (d) {
    switch (d) {
        case directions.up:
            return this.canMoveUp();
        case directions.down:
            return this.canMoveDown();
        case directions.left:
            return this.canMoveLeft();
        default:
            return this.canMoveRight();
    }
};

Character.prototype.nuevaDireccion = function () {
    if (this.canMoveRight()) {
        this.direction = directions.right
    }
    else {
        if (this.canMoveLeft()) {
            this.direction = directions.left
        }
        else {
            if (this.canMoveDown()) {
                this.direction = directions.down
            }
            else {
                if (this.canMoveUp()) {
                    this.direction = directions.up
                }
            }
        }
    }
};

Character.prototype.moveLeft = function (t) {
    this.tileTo[0] -= 1;
    this.timeMoved = t;
    this.direction = 3;

};

Character.prototype.moveRight = function (t) {
    this.tileTo[0] += 1;
    this.timeMoved = t;
    this.direction = 1;
};

Character.prototype.moveUp = function (t) {
    this.tileTo[1] -= 1;
    this.timeMoved = t;
    this.direction = 0;
};

Character.prototype.moveDown = function (t) {
    this.tileTo[1] += 1;
    this.timeMoved = t;
    this.direction = 2;
};

Character.prototype.moveDirection = function (d, t) {
    switch (d) {
        case directions.up:
            return this.moveUp(t);
        case directions.down:
            return this.moveDown(t);
        case directions.left:
            return this.moveLeft(t);
        default:
            return this.moveRight(t);
    }
};

function toIndex(x, y) {
    return ((y * columnas) + x);
};