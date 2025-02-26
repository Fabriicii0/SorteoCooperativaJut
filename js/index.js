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

// Configuración de probabilidades (puedes ajustar estos valores)
const rangosPrioritarios = [
    { inicio: 1, fin: 150, peso: 0.30 },    // 15% probabilidad
    { inicio: 151, fin: 1500, peso: 0.30 },
    { inicio: 1501, fin: 2500, peso: 0.30 },

    // 20% restante para otros números
];

function easeOutExpo(x) {
    return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

function getRandomNumber(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    let numero;
    do {
        const random = Math.random();
        let acumulado = 0;

        // Intentar generar número en rangos prioritarios
        let numeroGenerado = false;
        for (const rango of rangosPrioritarios) {
            acumulado += rango.peso;
            if (random < acumulado && rango.inicio >= min && rango.fin <= max) {
                numero = Math.floor(Math.random() * (rango.fin - rango.inicio + 1)) + rango.inicio;
                if (!numerosEliminadosArray.includes(numero)) {
                    numeroGenerado = true;
                    break;
                }
            }
        }

        // Si no se generó en rangos prioritarios, usar rango normal
        if (!numeroGenerado) {
            numero = Math.floor(Math.random() * (max - min + 1)) + min;
        }
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

//Animacion de Confetti
function lanzarConfeti(duracionSegundos = 15, colores = ['#bb0000', '#ffffff'], particulas = 5, spread = 75) {
    var end = Date.now() + (duracionSegundos * 1000); // Duración en segundos

    (function frame() {
        confetti({
            particleCount: particulas, // Cantidad de partículas
            angle: 60,
            spread: spread, // Dispersión del confeti
            origin: { x: 0 }, // Lado izquierdo
            colors: colores
        });
        confetti({
            particleCount: particulas, // Cantidad de partículas
            angle: 120,
            spread: spread, // Dispersión del confeti
            origin: { x: 1 }, // Lado derecho
            colors: colores
        });

        if (Date.now() < end) {
            requestAnimationFrame(frame);
        }
    }());
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
        alturaNumero: 50,      // Altura de cada número en píxeles
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
            lanzarConfeti(3, ['#ff0000', '#fbff07', '#1ec02b', '#5b64cf', '#db6fbf'], 5, 50);
        }
    }

    animacionActual = requestAnimationFrame(animar);
}

// Inicialización
validarRango();
actualizarNumerosEliminados();