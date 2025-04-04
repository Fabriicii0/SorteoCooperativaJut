// Obtención de elementos del DOM
const btnGirar = document.getElementById("btnGirar"); // Botón para girar la ruleta
const btnDetener = document.getElementById("btnDetener"); // Botón para detener la ruleta
const btnEliminar = document.getElementById("btnEliminar"); // Botón para eliminar el número actual
const inputMinimo = document.getElementById("minimo"); // Input para el valor mínimo
const inputMaximo = document.getElementById("maximo"); // Input para el valor máximo
const numerosEliminados = document.getElementById("numerosEliminados"); // Elemento para mostrar números eliminados

// Variables globales
let animacionActual = null; // Referencia a la animación actual
let deteniendo = false; // Indica si se está deteniendo la ruleta
let numeroActual = 0; // Número seleccionado actualmente
let numerosEliminadosArray = []; // Array de números que ya han sido eliminados
let primeraVezGirada = false; // Indica si es la primera vez que se gira la ruleta

// Configuración de probabilidades para diferentes rangos de números
// Puedes ajustar estos valores para cambiar la probabilidad de que salgan ciertos números
const rangosPrioritarios = [
  { inicio: 1, fin: 200, peso: 0.4 }, // 40% de probabilidad para números entre 1-200
  { inicio: 201, fin: 700, peso: 0.25 }, // 25% de probabilidad para números entre 201-700
  { inicio: 701, fin: 1500, peso: 0.2 }, // 20% de probabilidad para números entre 701-1500
  // El 15% restante es para otros números fuera de estos rangos
];

// Función de animación para suavizar el efecto de frenado
function easeOutExpo(x) {
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
}

// Función para obtener un número aleatorio considerando los rangos prioritarios
// y excluyendo los números ya eliminados
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
        numero =
          Math.floor(Math.random() * (rango.fin - rango.inicio + 1)) +
          rango.inicio;
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
  } while (numerosEliminadosArray.includes(numero)); // Repetir si el número ya fue eliminado

  return numero;
}

// Actualiza el texto que muestra los números eliminados
function actualizarNumerosEliminados() {
  if (numerosEliminadosArray.length > 0) {
    numerosEliminados.textContent = `Números eliminados: ${numerosEliminadosArray
      .sort((a, b) => a - b)
      .join(", ")}`;
  } else {
    numerosEliminados.textContent = "";
  }
}

// Función para eliminar el número actual de futuros sorteos
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
      alert("No quedan números disponibles para girar");
    }
  }
}

// Valida que los valores de rango mínimo y máximo sean correctos
function validarRango() {
  let min = parseInt(inputMinimo.value);
  let max = parseInt(inputMaximo.value);

  // Valores por defecto si no son números válidos
  if (isNaN(min)) min = 1;
  if (isNaN(max)) max = 100;

  // Asegura que el máximo sea mayor que el mínimo
  if (min >= max) {
    max = min + 1;
  }

  // Actualiza los valores en los inputs
  inputMinimo.value = min;
  inputMaximo.value = max;

  return { min, max };
}

// Genera una secuencia de números intermedios entre inicio y fin
function generarNumerosIntermedios(inicio, fin, cantidad) {
  const numeros = [];
  for (let i = 0; i < cantidad; i++) {
    const progreso = i / (cantidad - 1);
    const numero = Math.round(inicio + (fin - inicio) * progreso);
    numeros.push(numero);
  }
  return numeros;
}

// Función para detener la ruleta antes de tiempo
function detenerRuleta() {
  if (animacionActual) {
    deteniendo = true;
    btnDetener.disabled = true;
  }
}

// Función para lanzar el efecto de confeti cuando se selecciona un número
// Asegúrate de que la librería confetti esté disponible (puedes incluirla en tu HTML)
// O, si estás usando un bundler como webpack, puedes importarla:
// import confetti from 'canvas-confetti';

// Si no estás usando importaciones, puedes declarar la función confetti aquí
// para evitar errores si la librería se carga de otra manera.
// Por ejemplo:
// declare var confetti: any;

function lanzarConfeti(
  duracionSegundos = 15,
  colores = ["#bb0000", "#ffffff"],
  particulas = 5,
  spread = 75
) {
  var end = Date.now() + duracionSegundos * 1000; // Duración en segundos

  (function frame() {
    confetti({
      particleCount: particulas, // Cantidad de partículas
      angle: 60,
      spread: spread, // Dispersión del confeti
      origin: { x: 0 }, // Lado izquierdo
      colors: colores,
    });
    confetti({
      particleCount: particulas, // Cantidad de partículas
      angle: 120,
      spread: spread, // Dispersión del confeti
      origin: { x: 1 }, // Lado derecho
      colors: colores,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  })();
}

// Función principal que inicia la animación de la ruleta
function iniciarRuleta() {
  if (animacionActual) {
    cancelAnimationFrame(animacionActual);
  }

  const { min, max } = validarRango();
  // Verificar si hay números disponibles
  const numerosDisponibles = max - min + 1 - numerosEliminadosArray.length;
  if (numerosDisponibles <= 0) {
    alert("No quedan números disponibles para girar");
    return;
  }

  // Deshabilita/habilita botones durante la animación
  btnGirar.disabled = true;
  btnDetener.disabled = false;
  btnEliminar.disabled = true;
  deteniendo = false;

  // Configuración de la animación
  const config = {
    duracionTotal: 15000, // Duración total en ms
    numerosRapidos: 400, // Números en la fase rápida
    numerosFinal: 120, // Números para la transición final
    alturaNumero: 50, // Altura de cada número en píxeles
  };

  const numeros = document.getElementById("numero");
  const numeroFinal = getRandomNumber(min, max); // Este será el número ganador
  numeroActual = numeroFinal;

  // Generar números para la animación
  const valores = [];

  // Fase rápida - genera números aleatorios sin repetir
  const numerosGenerados = new Set();
  while (numerosGenerados.size < config.numerosRapidos) {
    let nuevoNumero = getRandomNumber(min, max);
    if (!numerosGenerados.has(nuevoNumero)) {
      numerosGenerados.add(nuevoNumero);
    }
  }
  valores.push(...Array.from(numerosGenerados));

  // Últimos números antes del final - para dar sensación de transición
  const ultimoNumeroAleatorio = valores[valores.length - 1];
  const numerosTransicion = new Set();
  while (numerosTransicion.size < config.numerosFinal) {
    let nuevoNumero = getRandomNumber(min, max);
    if (!numerosTransicion.has(nuevoNumero) && nuevoNumero !== numeroFinal) {
      numerosTransicion.add(nuevoNumero);
    }
  }
  valores.push(...Array.from(numerosTransicion));

  // Añadir el número final al final del array
  valores.push(numeroFinal);

  // Insertar números en el DOM como divs
  numeros.innerHTML = valores.map((num) => `<div>${num}</div>`).join("");

  const inicio = performance.now();
  const posicionFinal = -config.alturaNumero * (valores.length - 1);

  // Función de animación que se ejecuta en cada frame
  function animar(tiempoActual) {
    const tiempoTranscurrido = tiempoActual - inicio;
    let progreso = Math.min(tiempoTranscurrido / config.duracionTotal, 1);

    // Si se está deteniendo, acelera el progreso
    if (deteniendo) {
      progreso = Math.min(progreso + 0.1, 1);
    }

    // Aplica la función de suavizado para que el movimiento sea más natural
    const progresoSuavizado = easeOutExpo(progreso);
    const posicionActual = progresoSuavizado * posicionFinal;

    // Mueve los números verticalmente
    numeros.style.transform = `translateY(${posicionActual}px)`;

    if (progreso < 1) {
      // Continúa la animación si no ha terminado
      animacionActual = requestAnimationFrame(animar);
    } else {
      // Cuando termine la animación, mostrar solo el número final
      numeros.style.transition = "transform 0.3s ease-out";
      numeros.innerHTML = `<div>${numeroFinal}</div>`;
      numeros.style.transform = "translateY(0)";

      // Restaura el estado de los botones y lanza confeti
      setTimeout(() => {
        numeros.style.transition = "none";
        btnGirar.disabled = false;
        btnDetener.disabled = true;
        btnEliminar.disabled = false;
        animacionActual = null;
        deteniendo = false;
        primeraVezGirada = true;
        // Lanza confeti con colores festivos
        lanzarConfeti(
          3, // Duración en segundos
          ["#ff0000", "#fbff07", "#1ec02b", "#5b64cf", "#db6fbf"], // Colores
          5, // Partículas
          50 // Dispersión
        );
      }, 300);
    }
  }

  // Inicia la animación
  animacionActual = requestAnimationFrame(animar);
}

// Inicialización al cargar la página
validarRango();
actualizarNumerosEliminados();

// Nota: Este código asume que existe una librería "confetti" ya cargada
// para el efecto de confeti y elementos HTML con los IDs correspondientes
