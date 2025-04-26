/**
 * CLASE PRINCIPAL TIMER
 * Representa cada temporizador individual con toda su funcionalidad
 */
class Timer {
    constructor() {
        // 1. INICIALIZACIÓN DEL ELEMENTO DOM
        // Clona la plantilla HTML para crear un nuevo temporizador
        this.element = document.getElementById('timer-template').content.cloneNode(true).querySelector('.timer-wrapper');
        
        // 2. OBTENER REFERENCIAS A ELEMENTOS
        this.timerElement = this.element.querySelector('.timer');
        this.timeDisplay = this.element.querySelector('.timer-time');
        this.nameDisplay = this.element.querySelector('.timer-name');
        
        // Crear y agregar el display de grado/nivel
        this.gradeDisplay = document.createElement('div');
        this.gradeDisplay.className = 'timer-grade';
        this.timerElement.appendChild(this.gradeDisplay);
        
        // 3. ELEMENTOS DE PROGRESO Y VISUALES
        this.progressFill = this.element.querySelector('.progress-fill');
        this.progressBar = this.element.querySelector('.progress-bar');
        this.progressContainer = this.element.querySelector('.progress-container');
        this.groupCircles = this.element.querySelector('.group-circles');
        this.contextMenu = this.element.querySelector('.context-menu');

        // 4. ESTADO INICIAL
        this.milliseconds = 0;      // Tiempo acumulado en ms
        this.isActive = false;      // Si el timer está en marcha
        this.interval = null;       // Referencia al intervalo
        this.longPressTimer = null; // Para detectar click largo
        this.currentColor = '#4a90e2'; // Color actual
        this.startTime = 0;         // Marca de tiempo al iniciar
        this.isDragging = false;    // Estado de arrastre
        this.offsetX = 0;           // Posición X inicial al arrastrar
        this.offsetY = 0;           // Posición Y inicial al arrastrar
        this.preventClick = false;  // Prevenir clicks después de arrastrar
        this.waveInterval = null;   // Intervalo para ondas visuales
        this.closeMenuHandler = null; // Manejador para cerrar menú

        // ID único para este temporizador
        this.element.dataset.id = Date.now() + Math.random().toString(36).substr(2, 9);

        // 5. PALETA DE COLORES POR NIVEL
        this.titleColors = {
            'Novato': '#4a90e2',    // Azul
            'Principiante': '#2ecc71', // Verde
            'Competente': '#f1c40f',   // Amarillo
            'Experto': '#e67e22',     // Naranja
            'Profesional': '#e74c3c', // Rojo
            'Maestro': '#ffd700'      // Dorado
        };

        // 6. CONFIGURACIÓN INICIAL
        this.setupEvents();       // Configurar eventos
        this.updateDisplay();     // Mostrar tiempo inicial
        this.adjustTextSize();    // Ajustar tamaño de texto

        // Posicionamiento inicial
        this.element.style.position = 'absolute';
        this.element.style.left = '0px';
        this.element.style.top = '0px';
    }

    /**
     * CONFIGURAR EVENTOS
     * Maneja todos los eventos de interacción del usuario
     */
    setupEvents() {
        // Click normal - Activa/desactiva el temporizador
        this.timerElement.addEventListener('click', (e) => {
            if (!this.isDragging && !this.preventClick) this.toggleTimer();
        });

        // Mouse down - Inicia posible arrastre o click largo
        this.timerElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return; // Solo botón izquierdo
            
            // Si el menú está abierto, prevenir acciones
            if (this.contextMenu.style.display === 'flex') {
                this.preventClick = true;
                return;
            }
            
            // Guardar posición inicial para detectar arrastre
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            // Configurar temporizador para click largo (muestra menú)
            this.longPressTimer = setTimeout(() => {
                this.showMenu();
                this.preventClick = true;
            }, 800);

            // Manejador para movimiento del ratón
            const handleMove = (moveEvent) => {
                if (!this.isDragging) {
                    // Calcular distancia movida
                    const dx = moveEvent.clientX - this.dragStartX;
                    const dy = moveEvent.clientY - this.dragStartY;
                    
                    // Si se movió suficiente, iniciar arrastre
                    if (Math.sqrt(dx*dx + dy*dy) > 10) {
                        this.startDragging(moveEvent);
                    }
                } else {
                    // Si ya está arrastrando, actualizar posición
                    this.handleDragMove(moveEvent);
                    this.checkCollisions();
                }
            };

            // Manejador para soltar el ratón
            const handleUp = () => {
                clearTimeout(this.longPressTimer);
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                
                // Finalizar arrastre si estaba activo
                if (this.isDragging) {
                    this.handleDragEnd();
                }
                
                // Resetear prevención de clicks
                if (this.preventClick) {
                    setTimeout(() => this.preventClick = false, 100);
                }
            };

            // Registrar manejadores de eventos
            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        });

        // Cancelar click largo si el ratón sale del elemento
        this.timerElement.addEventListener('mouseleave', () => {
            clearTimeout(this.longPressTimer);
        });

        // Manejadores para items del menú contextual
        this.element.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.stopPropagation(); // Evitar que el evento llegue al timer
                this.handleMenuClick(e);
                this.closeMenu();
            });
        });
    }

    /**
     * INICIAR ARRASTRE
     * Configura el estado para arrastrar el temporizador
     */
    startDragging(e) {
        this.isDragging = true;
        this.preventClick = true;
        this.element.classList.add('dragging');
        this.closeMenu();
        
        // Obtener dimensiones del contenedor
        const container = document.querySelector('.counters-container');
        this.containerRect = container.getBoundingClientRect();
        
        // Calcular offset para arrastre suave
        this.offsetX = e.clientX - this.element.offsetLeft;
        this.offsetY = e.clientY - this.element.offsetTop;
    }

    /**
     * MANEJAR MOVIMIENTO DE ARRASTRE
     * Actualiza la posición del temporizador mientras se arrastra
     */
    handleDragMove(e) {
        if (!this.isDragging) return;
        
        // Calcular nueva posición
        let x = e.clientX - this.offsetX;
        let y = e.clientY - this.offsetY;
        
        // Limitar al área del contenedor
        x = Math.max(0, Math.min(x, this.containerRect.width - this.element.offsetWidth));
        y = Math.max(0, Math.min(y, this.containerRect.height - this.element.offsetHeight));
        
        // Aplicar nueva posición
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    /**
     * VERIFICAR COLISIONES
     * Detecta si este temporizador está cerca de otros y aplica repulsión
     */
    checkCollisions() {
        const containers = document.querySelectorAll('.timer-wrapper');
        const currentRect = this.element.getBoundingClientRect();
        const currentId = this.element.dataset.id;
        
        containers.forEach(container => {
            if (container.dataset.id === currentId) return;
            
            const otherRect = container.getBoundingClientRect();
            const distance = this.calculateDistance(currentRect, otherRect);
            const minDistance = 100; // Distancia mínima entre timers
            
            // Si están muy cerca, aplicar fuerza de repulsión
            if (distance < minDistance) {
                this.applyRepulsion(currentRect, otherRect, container);
            }
        });
    }

    /**
     * CALCULAR DISTANCIA ENTRE DOS RECTÁNGULOS
     * Usa el centro de los elementos para medir distancia
     */
    calculateDistance(rect1, rect2) {
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
        
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    /**
     * APLICAR REPULSIÓN
     * Separa este temporizador de otro cercano
     */
    applyRepulsion(currentRect, otherRect, otherElement) {
        const repulsionForce = 5; // Fuerza de repulsión
        
        // Calcular centros
        const x1 = currentRect.left + currentRect.width / 2;
        const y1 = currentRect.top + currentRect.height / 2;
        const x2 = otherRect.left + otherRect.width / 2;
        const y2 = otherRect.top + otherRect.height / 2;
        
        // Calcular ángulo entre los dos elementos
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        // Calcular nueva posición para este elemento
        const newX = parseFloat(this.element.style.left) - Math.cos(angle) * repulsionForce;
        const newY = parseFloat(this.element.style.top) - Math.sin(angle) * repulsionForce;
        
        // Limitar al área del contenedor
        const boundedX = Math.max(0, Math.min(newX, this.containerRect.width - this.element.offsetWidth));
        const boundedY = Math.max(0, Math.min(newY, this.containerRect.height - this.element.offsetHeight));
        
        this.element.style.left = `${boundedX}px`;
        this.element.style.top = `${boundedY}px`;
        
        // Calcular nueva posición para el otro elemento
        const otherX = parseFloat(otherElement.style.left) + Math.cos(angle) * repulsionForce;
        const otherY = parseFloat(otherElement.style.top) + Math.sin(angle) * repulsionForce;
        
        // Limitar al área del contenedor
        const otherBoundedX = Math.max(0, Math.min(otherX, this.containerRect.width - otherElement.offsetWidth));
        const otherBoundedY = Math.max(0, Math.min(otherY, this.containerRect.height - otherElement.offsetHeight));
        
        otherElement.style.left = `${otherBoundedX}px`;
        otherElement.style.top = `${otherBoundedY}px`;
        
        // Actualizar posiciones en el objeto global
        positions[this.element.dataset.id] = {x: boundedX, y: boundedY};
        positions[otherElement.dataset.id] = {x: otherBoundedX, y: otherBoundedY};
    }

    /**
     * FINALIZAR ARRASTRE
     * Limpia el estado de arrastre y guarda la posición final
     */
    handleDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.element.classList.remove('dragging');
        
        // Guardar posición final
        positions[this.element.dataset.id] = {
            x: parseFloat(this.element.style.left),
            y: parseFloat(this.element.style.top)
        };
    }

    /**
     * MOSTRAR MENÚ CONTEXTUAL
     * Aparece con click largo en el temporizador
     */
    showMenu() {
        this.contextMenu.style.display = 'flex';
        
        // Manejador para cerrar el menú al hacer click fuera
        this.closeMenuHandler = (e) => {
            const clickedElement = e.target;
            const isMenuClick = clickedElement.closest('.context-menu') === this.contextMenu;
            const isTimerClick = clickedElement.closest('.timer') === this.timerElement;
            
            if (!isMenuClick && !isTimerClick) {
                this.closeMenu();
            }
        };
        
        document.addEventListener('pointerdown', this.closeMenuHandler);
    }

    /**
     * CERRAR MENÚ CONTEXTUAL
     */
    closeMenu() {
        this.contextMenu.style.display = 'none';
        if (this.closeMenuHandler) {
            document.removeEventListener('pointerdown', this.closeMenuHandler);
            this.closeMenuHandler = null;
        }
    }

    /**
     * ACTIVAR/DESACTIVAR TEMPORIZADOR
     * Alterna el estado de marcha del temporizador
     */
    toggleTimer() {
        this.isActive = !this.isActive;
        this.timerElement.classList.toggle('active', this.isActive);
        
        // Efectos visuales al activar
        if(this.isActive) {
            this.groupCircles.style.transform = 'scale(1) rotate(0deg)';
            this.timerElement.style.setProperty('--border-gap', '15px');
        } else {
            this.groupCircles.style.transform = 'scale(0.8) rotate(-180deg)';
            this.timerElement.style.setProperty('--border-gap', '5px');
        }
    
        // Efecto especial para nivel Maestro
        if(this.isMaster()) {
            this.timerElement.classList.toggle('pulsing', this.isActive);
        }
    
        // Lógica de inicio/detención
        if(this.isActive) {
            this.timerElement.style.setProperty('--border-style', 'solid');
            this.startTime = Date.now() - this.milliseconds;
            this.start();
            this.startWave();
        } else {
            this.timerElement.style.setProperty('--border-style', 'dashed');
            this.stop();
            this.stopWave();
        }
    }

    /**
     * INICIAR TEMPORIZADOR
     * Comienza a contar el tiempo
     */
    start() {
        this.stop(); // Limpiar intervalo previo
        this.interval = setInterval(() => this.updateTime(), 100);
    }

    /**
     * DETENER TEMPORIZADOR
     * Pausa el conteo de tiempo
     */
    stop() {
        clearInterval(this.interval);
    }

    /**
     * INICIAR ONDAS VISUALES
     * Crea el efecto de ondas que se expanden
     */
    startWave() {
        this.stopWave();
        this.createWave();
        this.waveInterval = setInterval(() => this.createWave(), 2500);
    }

    /**
     * CREAR ONDA VISUAL
     * Genera un elemento de onda animada
     */
    createWave() {
        const wave = document.createElement('div');
        wave.className = 'wave-ring';
        wave.style.cssText = `
            border-color: ${this.currentColor};
            filter: brightness(1.8) drop-shadow(0 0 10px ${this.currentColor});
        `;
        
        this.progressContainer.appendChild(wave);
        
        // Iniciar animación en el próximo frame
        requestAnimationFrame(() => {
            wave.style.animation = 'rippleWave 1.4s cubic-bezier(0.23, 1, 0.32, 1) forwards';
        });
        
        // Eliminar después de la animación
        setTimeout(() => {
            wave.remove();
        }, 1400);
    }

    /**
     * DETENER ONDAS VISUALES
     * Limpia todas las ondas y detiene la generación de nuevas
     */
    stopWave() {
        clearInterval(this.waveInterval);
        document.querySelectorAll('.wave-ring').forEach(wave => {
            if(wave.parentNode) wave.remove();
        });
    }

    /**
     * ACTUALIZAR TIEMPO
     * Calcula y muestra el tiempo transcurrido
     */
    updateTime() {
        this.milliseconds = Date.now() - this.startTime;
        this.updateDisplay();
        this.updateProgress();
    }

    /**
     * ACTUALIZAR DISPLAY
     * Formatea y muestra el tiempo en el elemento DOM
     */
    updateDisplay() {
        const hours = Math.floor(this.milliseconds / 3600000);
        const minutes = Math.floor((this.milliseconds % 3600000) / 60000);
        const seconds = Math.floor((this.milliseconds % 60000) / 1000);
        const decimals = Math.floor((this.milliseconds % 1000) / 100);
        
        // Formatear según la duración
        let timeString;
        if(hours > 0) {
            timeString = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else if(minutes > 0) {
            timeString = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        } else {
            timeString = `${seconds}.${decimals}s`;
        }
        
        this.timeDisplay.textContent = timeString;
        this.adjustTextSize();
    }

    /**
     * OBTENER TÍTULO DEL NIVEL
     * Devuelve el título correspondiente al nivel actual
     */
    getTitle(level) {
        const titles = [
            { min: 0, max: 10, title: 'Novato' },
            { min: 11, max: 30, title: 'Principiante' },
            { min: 31, max: 60, title: 'Competente' },
            { min: 61, max: 90, title: 'Experto' },
            { min: 91, max: 99, title: 'Profesional' },
            { min: 100, max: 100, title: 'Maestro' }
        ];
        return titles.find(t => level >= t.min && level <= t.max) || { title: '', color: '' };
    }

    /**
     * ACTUALIZAR CÍRCULOS DE GRUPO
     * Genera los elementos visuales que muestran el progreso
     */
    updateGroupCircles(currentLevel) {
        this.groupCircles.innerHTML = '';
        const currentDecade = Math.floor(currentLevel / 10);
        const currentLevelInDecade = currentLevel % 10;
        const isMaster = currentLevel >= 100;
        const dotSize = 8;
        const radius = 75;
        const decadeRadius = 105;
    
        // 3. PUNTOS DE NIVEL (interiores)
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90; // 36° por punto (360/10)
            const x = 50 + (radius * Math.cos(angle * Math.PI / 180));
            const y = 50 + (radius * Math.sin(angle * Math.PI / 180));
            
            const dot = document.createElement('div');
            dot.className = `level-dot ${i < currentLevelInDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                transform: translate(-${dotSize/2}px, -${dotSize/2}px);
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // 4. PUNTOS DE DÉCADA (exteriores)
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90;
            const x = 50 + (decadeRadius * Math.cos(angle * Math.PI / 180));
            const y = 50 + (decadeRadius * Math.sin(angle * Math.PI / 180));
            
            const dot = document.createElement('div');
            dot.className = `decade-dot ${i < currentDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                transform: translate(-${dotSize/2}px, -${dotSize/2}px);
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // 6. EFECTO ESPECIAL PARA MAESTROS
        if(isMaster) {
            const masterGlow = document.createElement('div');
            masterGlow.className = 'master-glow';
            masterGlow.style.cssText = `
                background: radial-gradient(circle, ${this.currentColor} 0%, transparent 70%);
            `;
            this.groupCircles.appendChild(masterGlow);
        }
    }

    /**
     * OBTENER NIVEL ACTUAL
     * Calcula el nivel basado en horas de práctica (raíz cuadrada)
     */
    getCurrentLevel() {
        const hours = this.milliseconds / 3600000;
        return Math.min(Math.floor(Math.sqrt(hours)), 100); // Máximo nivel 100
    }

    /**
     * VERIFICAR SI ES MAESTRO
     * Comprueba si alcanzó el nivel máximo (100)
     */
    isMaster() {
        return this.getCurrentLevel() >= 100;
    }

    /**
     * ACTUALIZAR PROGRESO
     * Calcula y muestra todos los elementos de progreso
     */
    updateProgress() {
        const currentLevel = this.getCurrentLevel();
        const levelProgress = currentLevel < 100 ? 
            (Math.sqrt(this.milliseconds / 3600000) - currentLevel) : 1;

        // Obtener datos del nivel actual
        const levelData = this.getTitle(currentLevel);
        this.currentColor = this.titleColors[levelData.title] || '#4a90e2';
        
        // Actualizar elementos visuales
        this.timerElement.dataset.grade = levelData.title;
        this.timerElement.style.setProperty('--timer-color', this.currentColor);
        this.progressFill.style.backgroundColor = this.currentColor;
        this.progressBar.style.backgroundColor = this.currentColor;
        
        // Escalar según nivel
        const scaleFactor = 1 + (currentLevel * 0.015);
        this.timerElement.style.transform = `scale(${scaleFactor})`;
        
        // Actualizar barra de progreso
        this.progressBar.style.transform = `scale(${levelProgress})`;
        this.gradeDisplay.textContent = levelData.title;
        this.updateGroupCircles(currentLevel);
        
        // Aplicar clase especial para maestros
        this.timerElement.classList.toggle('master', currentLevel >= 100);
    }

    /**
     * AJUSTAR TAMAÑO DE TEXTO
     * Asegura que el texto del tiempo siempre sea visible
     */
    adjustTextSize() {
        const containerWidth = this.timerElement.offsetWidth;
        const textWidth = this.timeDisplay.scrollWidth;
        const currentFontSize = parseFloat(this.timeDisplay.style.fontSize) || 1.4;
        
        // Reducir tamaño si es necesario
        if(textWidth > containerWidth * 0.7) {
            const newSize = Math.min(1.4, (containerWidth * 0.7) / textWidth * 1.4);
            if(Math.abs(newSize - currentFontSize) > 0.01) {
                this.timeDisplay.style.fontSize = `${newSize}em`;
            }
        } else if(currentFontSize < 1.4) {
            // Restaurar tamaño por defecto si hay espacio
            this.timeDisplay.style.fontSize = '1.4em';
        }
    }

    /**
     * MANEJAR CLIC EN MENÚ
     * Ejecuta la acción correspondiente al ítem del menú
     */
    handleMenuClick(e) {
        const action = e.target.dataset.action;
        switch(action) {
            case 'rename': this.rename(); break;
            case 'edit-time': this.editTime(); break;
            case 'color': this.changeColor(); break;
            case 'reset': this.reset(); break;
            case 'delete': this.delete(); break;
        }
    }

    /**
     * RENOMBRAR TEMPORIZADOR
     * Pide nuevo nombre al usuario y lo actualiza
     */
    rename() {
        const newName = prompt('Nuevo nombre:', this.nameDisplay.textContent);
        if(newName) this.nameDisplay.textContent = newName;
    }

    /**
     * EDITAR TIEMPO MANUALMENTE
     * Permite al usuario ingresar un tiempo específico
     */
    editTime() {
        const currentSeconds = Math.floor(this.milliseconds / 1000);
        const hours = Math.floor(currentSeconds / 3600);
        const minutes = Math.floor((currentSeconds % 3600) / 60);
        const seconds = currentSeconds % 60;

        const newTime = prompt(
            'Introduce el tiempo en formato HH:MM:SS',
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
        );

        if (newTime) {
            // Parsear el tiempo ingresado
            const parts = newTime.split(':');
            const hh = parseInt(parts[0]) || 0;
            const mm = parseInt(parts[1]) || 0;
            const ss = parseInt(parts[2]) || 0;
            
            // Actualizar tiempo y estado
            this.milliseconds = (hh * 3600 + mm * 60 + ss) * 1000;
            this.startTime = Date.now() - this.milliseconds;
            this.updateDisplay();
            this.updateProgress();
            
            // Efecto visual de actualización
            this.element.classList.add('animating');
            setTimeout(() => this.element.classList.remove('animating'), 300);
        }
    }

    /**
     * CAMBIAR COLOR
     * Muestra el selector de color y aplica cambios
     */
    changeColor() {
        currentColorTimer = this; // Guardar referencia global
        const colorPicker = document.getElementById('color-input');
        colorPicker.value = this.currentColor;
        
        // Manejador para cambios en tiempo real
        const updateColor = (e) => {
            this.currentColor = e.target.value;
            this.timerElement.style.setProperty('--timer-color', this.currentColor);
            this.progressFill.style.backgroundColor = this.currentColor;
            this.progressBar.style.backgroundColor = this.currentColor;
            this.updateGroupCircles(this.getCurrentLevel());
        };
        
        colorPicker.addEventListener('input', updateColor);
        document.querySelector('.color-picker').style.display = 'block';
        
        // Limpiar al finalizar
        colorPicker.addEventListener('change', () => {
            colorPicker.removeEventListener('input', updateColor);
            document.querySelector('.color-picker').style.display = 'none';
        }, {once: true});
    }

    /**
     * REINICIAR TEMPORIZADOR
     * Vuelve a cero y detiene el conteo
     */
    reset() {
        this.milliseconds = 0;
        this.startTime = Date.now();
        this.updateDisplay();
        this.updateProgress();
        this.stop();
        this.stopWave();
        this.isActive = false;
        this.timerElement.classList.remove('active');
        this.timerElement.style.setProperty('--border-style', 'dashed');
    }

    /**
     * ELIMINAR TEMPORIZADOR
     * Remueve el elemento del DOM y limpia sus referencias
     */
    delete() {
        this.element.remove();
        delete positions[this.element.dataset.id];
    }
}

// VARIABLES GLOBALES
let currentColorTimer = null; // Temporizador actual siendo editado
let positions = {};           // Almacena posiciones de todos los timers
let gridMode = true;          // Modo de organización (rejilla/lista)

/**
 * APLICAR COLOR SELECCIONADO
 * Función global para el botón del selector de color
 */
function applyColor() {
    if(currentColorTimer) {
        currentColorTimer.progressFill.style.backgroundColor = currentColorTimer.currentColor;
        currentColorTimer.progressBar.style.backgroundColor = currentColorTimer.currentColor;
        document.querySelector('.color-picker').style.display = 'none';
    }
}

/**
 * ORDENAR POR NOMBRE
 * Organiza los temporizadores alfabéticamente
 */
function sortByName() {
    gridMode = false;
    const container = document.querySelector('.counters-container');
    const timers = Array.from(container.children).sort((a, b) => {
        return a.querySelector('.timer-name').textContent.localeCompare(b.querySelector('.timer-name').textContent);
    });
    
    const timerWidth = timers[0]?.offsetWidth || 140;
    const margin = 30;
    
    // Posicionar en fila horizontal
    timers.forEach((timer, index) => {
        const x = index * (timerWidth + margin);
        const y = 100;
        timer.style.left = `${x}px`;
        timer.style.top = `${y}px`;
        positions[timer.dataset.id] = {x, y};
    });
}

/**
 * ORDENAR POR TIEMPO
 * Organiza los temporizadores por tiempo acumulado (mayor a menor)
 */
function sortByTime() {
    gridMode = false;
    const container = document.querySelector('.counters-container');
    const timers = Array.from(container.children).sort((a, b) => {
        return b.timer.milliseconds - a.timer.milliseconds;
    });
    
    const timerWidth = timers[0]?.offsetWidth || 140;
    const margin = 30;
    
    // Posicionar en fila horizontal
    timers.forEach((timer, index) => {
        const x = index * (timerWidth + margin);
        const y = 100;
        timer.style.left = `${x}px`;
        timer.style.top = `${y}px`;
        positions[timer.dataset.id] = {x, y};
    });
}

/**
 * AÑADIR NUEVO TEMPORIZADOR
 * Crea un temporizador y lo coloca en el centro del contenedor
 */
document.querySelector('.add-counter').addEventListener('click', () => {
    const newTimer = new Timer();
    const container = document.querySelector('.counters-container');
    
    // Posicionar en el centro
    const startX = (container.offsetWidth - newTimer.element.offsetWidth) / 2;
    const startY = (container.offsetHeight - newTimer.element.offsetHeight) / 2;
    
    newTimer.element.style.left = `${startX}px`;
    newTimer.element.style.top = `${startY}px`;
    
    container.appendChild(newTimer.element);
    positions[newTimer.element.dataset.id] = {x: startX, y: startY};
    newTimer.element.timer = newTimer;
    
    // Ajustar tamaño de texto después de añadir
    requestAnimationFrame(() => {
        newTimer.adjustTextSize();
    });
});

/**
 * MANEJAR CAMBIOS EN SELECTOR DE COLOR
 * Actualiza el color en tiempo real mientras se selecciona
 */
document.getElementById('color-input').addEventListener('input', (e) => {
    if(currentColorTimer) {
        currentColorTimer.timerElement.style.setProperty('--timer-color', e.target.value);
    }
});

/**
 * GUARDAR TEMPORIZADORES
 * Exporta todos los temporizadores a un archivo JSON
 */
function Save() {
    const counters = Array.from(document.querySelectorAll('.timer-wrapper')).map(timer => {
        const timerInstance = timer.timer;
        return {
            id: timer.dataset.id,
            name: timerInstance.nameDisplay.textContent,
            milliseconds: timerInstance.milliseconds,
            position: positions[timer.dataset.id],
            color: timerInstance.currentColor,
        };
    });

    // Crear y descargar archivo
    const blob = new Blob([JSON.stringify(counters, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'counters.json';
    link.click();
}

/**
 * CARGAR TEMPORIZADORES
 * Importa temporizadores desde un archivo JSON
 */
function Load(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const counters = JSON.parse(e.target.result);
        
        // Crear cada temporizador guardado
        counters.forEach(counter => {
            const timer = new Timer();
            timer.nameDisplay.textContent = counter.name;
            timer.milliseconds = counter.milliseconds;
            timer.currentColor = counter.color;
            timer.element.style.left = `${counter.position.x}px`;
            timer.element.style.top = `${counter.position.y}px`;

            // Actualizar visuales
            timer.updateDisplay();
            timer.updateProgress();
            timer.timerElement.style.setProperty('--timer-color', timer.currentColor);
            timer.progressFill.style.backgroundColor = timer.currentColor;
            timer.progressBar.style.backgroundColor = timer.currentColor;
            timer.adjustTextSize();

            // Añadir al contenedor
            const container = document.querySelector('.counters-container');
            container.appendChild(timer.element);

            // Guardar posición
            positions[timer.element.dataset.id] = counter.position;
            timer.element.timer = timer;
        });
    };
    
    reader.readAsText(file);
}