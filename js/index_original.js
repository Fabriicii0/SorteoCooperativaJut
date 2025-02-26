const btnGirar = document.getElementById('btnGirar');
const btnDetener = document.getElementById('btnDetener');
const btnEliminar = document.getElementById('btnEliminar');
const inputMinimo = document.getElementById('minimo');
const inputMaximo = document.getElementById('maximo');
const numerosEliminados = document.getElementById('numerosEliminados');
let animacionActual = null;
let deteniendo = false;
let numeroActual = 0;
let numerosEliminadosArray = [];
let primeraVezGirada = false;

function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let numero;
    do {
        numero = Math.floor(Math.random() * (max - min + 1)) + min;
    } while (numerosEliminadosArray.includes(numero));
    return numero;
}

function actualizarNumerosEliminados() {
    if (numerosEliminadosArray.length > 0) {
        numerosEliminados.textContent = `Números eliminados: ${numerosEliminadosArray.sort((a, b) => a - b).join(', ')}`;
    } else {
        numerosEliminados.textContent = '';
    }
}

function eliminarNumero() {
    if (numeroActual !== 0 && !numerosEliminadosArray.includes(numeroActual)) {
        numerosEliminadosArray.push(numeroActual);
        actualizarNumerosEliminados();
        btnEliminar.disabled = true;

        // Verificar si quedan números disponibles
        const { min, max } = validarRango();
        const numerosDisponibles = max - min + 1 - numerosEliminadosArray.length;
        if (numerosDisponibles <= 0) {
            btnGirar.disabled = true;
            alert('No quedan números disponibles para girar');
        }
    }
}

function validarRango() {
    let min = parseInt(inputMinimo.value);
    let max = parseInt(inputMaximo.value);

    if (isNaN(min)) min = 1;
    if (isNaN(max)) max = 100;

    if (min >= max) {
        max = min + 1;
    }

    inputMinimo.value = min;
    inputMaximo.value = max;

    return { min, max };
}

function generarNumerosIntermedios(inicio, fin, cantidad) {
    const numeros = [];
    for (let i = 0; i < cantidad; i++) {
        const progreso = i / (cantidad - 1);
        const numero = Math.round(inicio + (fin - inicio) * progreso);
        numeros.push(numero);
    }
    return numeros;
}

function detenerRuleta() {
    if (animacionActual) {
        deteniendo = true;
        btnDetener.disabled = true;
    }
}

function iniciarRuleta() {
    if (animacionActual) {
        cancelAnimationFrame(animacionActual);
    }

    const { min, max } = validarRango();
    // Verificar si hay números disponibles
    const numerosDisponibles = max - min + 1 - numerosEliminadosArray.length;
    if (numerosDisponibles <= 0) {
        alert('No quedan números disponibles para girar');
        return;
    }

    btnGirar.disabled = true;
    btnDetener.disabled = false;
    btnEliminar.disabled = true;
    deteniendo = false;

    const config = {
        duracionTotal: 15000,    // Duración total en ms
        numerosRapidos: 400,     // Números en la fase rápida
        numerosFinal: 75,       // Números para la transición final
        alturaNumero: 50        // Altura de cada número en píxeles
    };

    const numeros = document.getElementById("numero");
    const numeroFinal = getRandomNumber(min, max);
    numeroActual = numeroFinal;

    // Generar números
    const valores = [];

    // Fase rápida
    for (let i = 0; i < config.numerosRapidos; i++) {
        valores.push(getRandomNumber(min, max));
    }

    // Últimos números antes del final
    const ultimoNumeroAleatorio = valores[valores.length - 1];
    const numerosTransicion = generarNumerosIntermedios(
        ultimoNumeroAleatorio,
        numeroFinal,
        config.numerosFinal
    );
    valores.push(...numerosTransicion);

    // Insertar números en el DOM
    numeros.innerHTML = valores.map(num => `<div>${num}</div>`).join("");

    const inicio = performance.now();
    const posicionFinal = -config.alturaNumero * (valores.length - 1);

    function animar(tiempoActual) {
        const tiempoTranscurrido = tiempoActual - inicio;
        let progreso = Math.min(tiempoTranscurrido / config.duracionTotal, 1);

        if (deteniendo) {
            progreso = Math.min(progreso + 0.1, 1);
        }

        const progresoSuavizado = easeOutExpo(progreso);
        const posicionActual = progresoSuavizado * posicionFinal;

        numeros.style.transform = `translateY(${posicionActual}px)`;

        if (progreso < 1) {
            animacionActual = requestAnimationFrame(animar);
        } else {
            numeros.style.transition = 'transform 0.3s ease-out';
            numeros.innerHTML = `<div>${numeroFinal}</div>`;
            numeros.style.transform = "translateY(0px)";

            setTimeout(() => {
                numeros.style.transition = 'none';
                btnGirar.disabled = false;
                btnDetener.disabled = true;
                btnEliminar.disabled = false;
                animacionActual = null;
                deteniendo = false;
                primeraVezGirada = true;
            }, 300);
        }
    }

    animacionActual = requestAnimationFrame(animar);
}



// Inicialización
validarRango();
actualizarNumerosEliminados();