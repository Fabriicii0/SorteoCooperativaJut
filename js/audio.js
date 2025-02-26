class AudioController {
    constructor() {
        // Sonido de click para botones
        this.buttonClickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3');
        
        // Sonido de tick para la ruleta
        this.tickSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2052/2052-preview.mp3');
        this.tickSound.volume = 0.5; // Volumen inicial
        
        this.isSpinning = false;
        this.tickInterval = null;
    }

    playButtonClick() {
        this.buttonClickSound.currentTime = 0;
        this.buttonClickSound.play().catch(error => console.log("Error reproduciendo sonido:", error));
    }

    startSpinningSound() {
        this.isSpinning = true;
        this.playTickSounds();
    }

    stopSpinningSound() {
        this.isSpinning = false;
        if (this.tickInterval) {
            clearInterval(this.tickInterval);
            this.tickInterval = null;
        }
    }

    playTickSounds() {
        let tickRate = 50; // Milisegundos entre ticks (ajustar según necesidad)
        let currentTickRate = tickRate;
        let time = 0;
        const duration = 4000; // Debe coincidir con la duración de la animación

        const playTick = () => {
            if (!this.isSpinning) return;

            // Clonar el sonido para poder reproducir múltiples instancias
            const tickClone = this.tickSound.cloneNode();
            
            // Ajustar volumen y velocidad basado en el progreso
            time += currentTickRate;
            const progress = Math.min(time / duration, 1);
            
            // Reducir el volumen gradualmente hacia el final
            tickClone.volume = Math.max(0.1, 1 - progress);
            
            // Reproducir el sonido
            tickClone.play().catch(error => console.log("Error reproduciendo tick:", error));

            // Aumentar el intervalo entre ticks gradualmente
            currentTickRate = tickRate + (progress * 200);
            
            // Programar el próximo tick
            if (this.isSpinning) {
                this.tickInterval = setTimeout(playTick, currentTickRate);
            }
        };

        // Iniciar la secuencia de ticks
        playTick();
    }
}

// Crear instancia del controlador de audio
const audioController = new AudioController();