class Timer {
    constructor() {
        this.element = document.getElementById('timer-template').content.cloneNode(true).querySelector('.timer-wrapper');
        this.timerElement = this.element.querySelector('.timer');
        this.timeDisplay = this.element.querySelector('.timer-time');
        this.nameDisplay = this.element.querySelector('.timer-name');
        
        this.gradeDisplay = document.createElement('div');
        this.gradeDisplay.className = 'timer-grade';
        this.timerElement.appendChild(this.gradeDisplay);
        
        this.progressFill = this.element.querySelector('.progress-fill');
        this.progressContainer = this.element.querySelector('.progress-container');
        this.groupCircles = this.element.querySelector('.group-circles');
        this.contextMenu = this.element.querySelector('.context-menu');

        // Nuevas referencias para la barra de progreso
        this.currentLevelElement = this.element.querySelector('.current-level');
        this.nextLevelElement = this.element.querySelector('.next-level');
        this.levelProgressFill = this.element.querySelector('.level-progress .progress-fill');

        this.milliseconds = 0;
        this.isActive = false;
        this.interval = null;
        this.longPressTimer = null;
        this.currentColor = '#4a90e2';
        this.startTime = 0;
        this.isDragging = false;
        this.preventClick = false;
        this.waveInterval = null;
        this.closeMenuHandler = null;
        this.previousLevel = 0;
        this.activeDot = null;

        this.element.dataset.id = Date.now() + Math.random().toString(36).substr(2, 9);

        this.titleColors = {
            'Novato I': '#4a90e2', 'Novato II': '#3a80d2', 'Novato III': '#2a70c2',
            'Aprendiz I': '#2ecc71', 'Aprendiz II': '#25b362', 'Aprendiz III': '#1c9953',
            'Principiante I': '#f1c40f', 'Principiante II': '#e6b80e', 'Principiante III': '#daa90d',
            'Competente I': '#e67e22', 'Competente II': '#d66f18', 'Competente III': '#c6600e',
            'Experto I': '#e74c3c', 'Experto II': '#d43d2d', 'Experto III': '#c12e1e',
            'Profesional I': '#9b59b6', 'Profesional II': '#8a4aa5', 'Profesional III': '#793b94',
            'Maestro I': '#ffd700', 'Maestro II': '#e6c200', 'Maestro III': '#ccad00',
            'Gran Maestro': '#00ff9d', 'Leyenda': '#ff00ff'
        };

        this.achievements = {
            '1h': { 
                unlocked: false, 
                icon: '👣', 
                name: 'Primeros Pasos',
                description: 'Completa 1 hora de práctica' 
            },
            '24h': { 
                unlocked: false, 
                icon: '🌅', 
                name: 'Maratón Diario',
                description: '24 horas acumuladas' 
            },
            '100h': { 
                unlocked: false, 
                icon: '🚀', 
                name: 'Cohete de Habilidad',
                description: '100 horas de dedicación' 
            },
            '500h': {
                unlocked: false,
                icon: '🦸',
                name: 'Super Aprendiz',
                description: '500 horas de maestría'
            },
            '1000h': { 
                unlocked: false, 
                icon: '🎖️', 
                name: 'Maestro Legendario',
                description: '1000 horas de excelencia' 
            }
        };

        this.setupEvents();
        this.updateDisplay();
        this.adjustTextSize();

        this.element.style.position = 'absolute';
        this.element.style.left = '0px';
        this.element.style.top = '0px';
    }

    setupEvents() {
        this.timerElement.addEventListener('click', (e) => {
            if (!this.isDragging && !this.preventClick) this.toggleTimer();
        });

        this.timerElement.addEventListener('mousedown', (e) => {
            if (e.button !== 0) return;
            
            if (this.contextMenu.style.display === 'flex') {
                this.preventClick = true;
                return;
            }
            
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            
            this.longPressTimer = setTimeout(() => {
                this.showMenu();
                this.preventClick = true;
            }, 800);

            const handleMove = (moveEvent) => {
                if (!this.isDragging) {
                    const dx = moveEvent.clientX - this.dragStartX;
                    const dy = moveEvent.clientY - this.dragStartY;
                    
                    if (Math.sqrt(dx*dx + dy*dy) > 10) {
                        this.startDragging(moveEvent);
                    }
                } else {
                    this.handleDragMove(moveEvent);
                    this.checkCollisions();
                }
            };

            const handleUp = () => {
                clearTimeout(this.longPressTimer);
                document.removeEventListener('mousemove', handleMove);
                document.removeEventListener('mouseup', handleUp);
                
                if (this.isDragging) {
                    this.handleDragEnd();
                }
                
                if (this.preventClick) {
                    setTimeout(() => this.preventClick = false, 100);
                }
            };

            document.addEventListener('mousemove', handleMove);
            document.addEventListener('mouseup', handleUp);
        });

        this.timerElement.addEventListener('mouseleave', () => {
            clearTimeout(this.longPressTimer);
        });

        this.element.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('mousedown', (e) => {
                e.stopPropagation();
                this.handleMenuClick(e);
                this.closeMenu();
            });
        });
    }

    startDragging(e) {
        this.isDragging = true;
        this.preventClick = true;
        this.element.classList.add('dragging');
        this.closeMenu();
        
        const container = document.querySelector('.counters-container');
        this.containerRect = container.getBoundingClientRect();
        
        this.offsetX = e.clientX - this.element.offsetLeft;
        this.offsetY = e.clientY - this.element.offsetTop;
    }

    handleDragMove(e) {
        if (!this.isDragging) return;
        
        let x = e.clientX - this.offsetX;
        let y = e.clientY - this.offsetY;
        
        x = Math.max(0, Math.min(x, this.containerRect.width - this.element.offsetWidth));
        y = Math.max(0, Math.min(y, this.containerRect.height - this.element.offsetHeight));
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    checkCollisions() {
        const containers = document.querySelectorAll('.timer-wrapper');
        const currentRect = this.element.getBoundingClientRect();
        const currentId = this.element.dataset.id;
        
        containers.forEach(container => {
            if (container.dataset.id === currentId) return;
            
            const otherRect = container.getBoundingClientRect();
            const distance = this.calculateDistance(currentRect, otherRect);
            const minDistance = 100;
            
            if (distance < minDistance) {
                this.applyRepulsion(currentRect, otherRect, container);
            }
        });
    }

    calculateDistance(rect1, rect2) {
        const x1 = rect1.left + rect1.width / 2;
        const y1 = rect1.top + rect1.height / 2;
        const x2 = rect2.left + rect2.width / 2;
        const y2 = rect2.top + rect2.height / 2;
        
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    }

    applyRepulsion(currentRect, otherRect, otherElement) {
        const repulsionForce = 5;
        
        const x1 = currentRect.left + currentRect.width / 2;
        const y1 = currentRect.top + currentRect.height / 2;
        const x2 = otherRect.left + otherRect.width / 2;
        const y2 = otherRect.top + otherRect.height / 2;
        
        const angle = Math.atan2(y2 - y1, x2 - x1);
        
        const newX = parseFloat(this.element.style.left) - Math.cos(angle) * repulsionForce;
        const newY = parseFloat(this.element.style.top) - Math.sin(angle) * repulsionForce;
        
        const boundedX = Math.max(0, Math.min(newX, this.containerRect.width - this.element.offsetWidth));
        const boundedY = Math.max(0, Math.min(newY, this.containerRect.height - this.element.offsetHeight));
        
        this.element.style.left = `${boundedX}px`;
        this.element.style.top = `${boundedY}px`;
        
        const otherX = parseFloat(otherElement.style.left) + Math.cos(angle) * repulsionForce;
        const otherY = parseFloat(otherElement.style.top) + Math.sin(angle) * repulsionForce;
        
        const otherBoundedX = Math.max(0, Math.min(otherX, this.containerRect.width - otherElement.offsetWidth));
        const otherBoundedY = Math.max(0, Math.min(otherY, this.containerRect.height - otherElement.offsetHeight));
        
        otherElement.style.left = `${otherBoundedX}px`;
        otherElement.style.top = `${otherBoundedY}px`;
        
        positions[this.element.dataset.id] = {x: boundedX, y: boundedY};
        positions[otherElement.dataset.id] = {x: otherBoundedX, y: otherBoundedY};
    }

    handleDragEnd() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.element.classList.remove('dragging');
        
        positions[this.element.dataset.id] = {
            x: parseFloat(this.element.style.left),
            y: parseFloat(this.element.style.top)
        };
    }

    showMenu() {
        this.contextMenu.style.display = 'flex';
        
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

    closeMenu() {
        this.contextMenu.style.display = 'none';
        if (this.closeMenuHandler) {
            document.removeEventListener('pointerdown', this.closeMenuHandler);
            this.closeMenuHandler = null;
        }
    }

    toggleTimer() {
        this.isActive = !this.isActive;
        this.timerElement.classList.toggle('active', this.isActive);
        
        if(this.isActive) {
            this.groupCircles.style.transform = 'scale(1) rotate(0deg)';
            this.timerElement.style.setProperty('--border-gap', '15px');
            this.timerElement.style.setProperty('--border-style', 'solid');
            this.startTime = Date.now() - this.milliseconds;
            this.start();
            this.startWave();
            
            if(this.activeDot) {
                this.activeDot.classList.add('active-current');
            }
        } else {
            this.groupCircles.style.transform = 'scale(0.8) rotate(-360deg)';
            this.timerElement.style.setProperty('--border-gap', '5px');
            this.timerElement.style.setProperty('--border-style', 'dashed');
            this.stop();
            this.stopWave();
            
            if(this.activeDot) {
                this.activeDot.classList.remove('active-current');
            }
        }
        
        if(this.isMaster()) {
            this.timerElement.classList.toggle('pulsing', this.isActive);
        }
    }

    start() {
        this.stop();
        this.interval = setInterval(() => {
            this.updateTime();
            this.checkAchievements();
        }, 100);
    }

    stop() {
        clearInterval(this.interval);
    }

    startWave() {
        this.stopWave();
        this.createWave();
        this.waveInterval = setInterval(() => this.createWave(), 2500);
    }

    createWave() {
        const wave = document.createElement('div');
        wave.className = 'wave-ring';
        wave.style.cssText = `
            border-color: ${this.currentColor};
            filter: brightness(1.8) drop-shadow(0 0 10px ${this.currentColor});
        `;
        
        this.progressContainer.appendChild(wave);
        
        requestAnimationFrame(() => {
            wave.style.animation = 'rippleWave 1.4s cubic-bezier(0.23, 1, 0.32, 1) forwards';
        });
        
        setTimeout(() => {
            wave.remove();
        }, 1400);
    }

    stopWave() {
        clearInterval(this.waveInterval);
        document.querySelectorAll('.wave-ring').forEach(wave => wave.remove());
    }

    updateTime() {
        this.milliseconds = Date.now() - this.startTime;
        this.updateDisplay();
        this.updateProgress();
    }

    updateDisplay() {
        const hours = Math.floor(this.milliseconds / 3600000);
        const minutes = Math.floor((this.milliseconds % 3600000) / 60000);
        const seconds = Math.floor((this.milliseconds % 60000) / 1000);
        const decimals = Math.floor((this.milliseconds % 1000) / 100);
        
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

    getTitle(level) {
        const titles = [
            { min: 0, max: 5, title: 'Novato I' }, { min: 6, max: 10, title: 'Novato II' },
            { min: 11, max: 15, title: 'Aprendiz I' }, { min: 16, max: 20, title: 'Aprendiz II' },
            { min: 21, max: 25, title: 'Principiante I' }, { min: 26, max: 30, title: 'Principiante II' },
            { min: 31, max: 35, title: 'Competente I' }, { min: 36, max: 40, title: 'Competente II' },
            { min: 41, max: 45, title: 'Experto I' }, { min: 46, max: 50, title: 'Experto II' },
            { min: 51, max: 55, title: 'Profesional I' }, { min: 56, max: 60, title: 'Profesional II' },
            { min: 61, max: 70, title: 'Maestro I' }, { min: 71, max: 85, title: 'Maestro II' },
            { min: 86, max: 99, title: 'Maestro III' }, { min: 100, max: 1000, title: 'Gran Maestro' },
            { min: 1001, max: Infinity, title: 'Leyenda' }
        ];
        return titles.find(t => level >= t.min && level <= t.max) || { title: '', color: '' };
    }

    updateGroupCircles(currentLevel) {
        this.groupCircles.innerHTML = '';
        const currentDecade = Math.floor(currentLevel / 10);
        const currentLevelInDecade = currentLevel % 10;
        const isMaster = currentLevel >= 100;
        const radius = 85;
        const decadeRadius = 105;
    
        // Puntos de nivel (interiores)
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90;
            const x = 50 + (radius * Math.cos(angle * Math.PI / 180));
            const y = 50 + (radius * Math.sin(angle * Math.PI / 180));
            
            const dot = document.createElement('div');
            dot.className = `level-dot ${i < currentLevelInDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // Puntos de década (exteriores)
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90;
            const x = 50 + (decadeRadius * Math.cos(angle * Math.PI / 180));
            const y = 50 + (decadeRadius * Math.sin(angle * Math.PI / 180));
            
            const dot = document.createElement('div');
            dot.className = `decade-dot ${i < currentDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${x}%;
                top: ${y}%;
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // Punto activo actual
        if(currentLevelInDecade > 0 && currentLevel % 10 !== 0) {
            const currentIndex = currentLevelInDecade - 1;
            this.activeDot = this.groupCircles.children[currentIndex];
            if(this.isActive) {
                this.activeDot.classList.add('active-current');
            }
        }

        // Crear arcos entre puntos completados
        this.createLevelArcs(currentLevelInDecade);

        // Efecto especial para maestros
        if(isMaster) {
            const masterGlow = document.createElement('div');
            masterGlow.className = 'master-glow';
            masterGlow.style.cssText = `
                background: radial-gradient(circle, ${this.currentColor} 0%, transparent 70%);
            `;
            this.groupCircles.appendChild(masterGlow);

            // Partículas orbitales para maestros
            const particles = 15;
            for(let i = 0; i < particles; i++) {
                const particle = document.createElement('div');
                particle.className = 'master-particle';
                particle.style.cssText = `
                    background: ${this.currentColor};
                    transform: rotate(${i * (360/particles)}deg) translate(120%);
                `;
                this.groupCircles.appendChild(particle);
            }
        }
    }

    createLevelArcs(currentLevelInDecade) {
        document.querySelectorAll('.level-arc').forEach(arc => arc.remove());

        for(let i = 0; i < currentLevelInDecade; i++) {
            const startAngle = (i * 36) - 90;
            const arc = document.createElement('div');
            arc.className = 'level-arc';
            arc.style.cssText = `
                --start-angle: ${startAngle}deg;
                border-color: ${this.currentColor};
                transform: rotate(${startAngle}deg);
                clip-path: inset(0 0 0 ${i === currentLevelInDecade - 1 ? '50%' : '100%'});
            `;
            this.groupCircles.appendChild(arc);
        }
    }

    getCurrentLevel() {
        const hours = this.milliseconds / 3600000;
        // Primeros niveles más rápidos (hasta nivel 20)
        if (hours < 20) {
            return Math.floor(hours * 1.5); // 1.5x más rápido
        }
        return Math.min(Math.floor(Math.sqrt(hours) * 4), 1000);
    }

    isMaster() {
        return this.getCurrentLevel() >= 100;
    }

    updateProgress() {
        const currentLevel = this.getCurrentLevel();
        const levelProgress = currentLevel < 100 ? 
            (Math.sqrt(this.milliseconds / 3600000) * 4) - currentLevel : 1;

        // Actualizar elementos de nivel
        this.currentLevelElement.textContent = currentLevel;
        this.nextLevelElement.textContent = currentLevel + 1;
        
        // Actualizar barra de progreso
        this.levelProgressFill.style.width = `${levelProgress * 100}%`;
        this.levelProgressFill.style.backgroundColor = this.currentColor;
        
        if(currentLevel > this.previousLevel) {
            this.animateLevelTransition(currentLevel);
            this.previousLevel = currentLevel;
        }

        const levelData = this.getTitle(currentLevel);
        this.currentColor = this.titleColors[levelData.title] || '#4a90e2';
        
        this.timerElement.dataset.grade = levelData.title;
        this.timerElement.style.setProperty('--timer-color', this.currentColor);
        this.progressFill.style.backgroundColor = this.currentColor;
        
        // Reducir el crecimiento máximo (1% por nivel, máximo 50%)
        const scaleFactor = 1 + (Math.min(currentLevel, 50) * 0.01);
        this.timerElement.style.transform = `scale(${scaleFactor})`;
        
        this.gradeDisplay.textContent = levelData.title;
        this.updateGroupCircles(currentLevel);
        
        this.timerElement.classList.toggle('master', currentLevel >= 100);
    }

    animateLevelTransition(newLevel) {
        if(this.activeDot) {
            const line = document.createElement('div');
            line.className = 'progress-line';
            
            const angle = ((newLevel % 10 - 1) * 36) - 90;
            line.style.cssText = `
                --line-angle: ${angle}deg;
                background: ${this.currentColor};
                animation: lineEmission 0.5s ease-out forwards;
            `;
            
            this.progressContainer.appendChild(line);
            setTimeout(() => line.remove(), 500);
        }
        
        if(this.activeDot) {
            this.activeDot.classList.remove('active-current');
        }
    }

    checkAchievements() {
        const hours = this.milliseconds / 3600000;
        const achievementsToCheck = [
            { threshold: 1, key: '1h' },
            { threshold: 24, key: '24h' },
            { threshold: 100, key: '100h' },
            { threshold: 500, key: '500h' },
            { threshold: 1000, key: '1000h' }
        ];

        achievementsToCheck.forEach(({ threshold, key }) => {
            if (hours >= threshold && !this.achievements[key].unlocked) {
                this.showAchievement(key);
            }
        });
    }

    showAchievement(achievement) {
        this.achievements[achievement].unlocked = true;
        const toast = document.createElement('div');
        toast.className = 'achievement-toast';
        toast.innerHTML = `
            <div class="achievement-icon">${this.achievements[achievement].icon}</div>
            <div class="achievement-text">
                <div class="achievement-name">${this.achievements[achievement].name}</div>
                <div class="achievement-description">${this.achievements[achievement].description}</div>
            </div>
        `;
        toast.style.setProperty('--timer-color', this.currentColor);
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('remove');
            setTimeout(() => toast.remove(), 500);
        }, 2500);
    }

    adjustTextSize() {
        const containerWidth = this.timerElement.offsetWidth;
        const textWidth = this.timeDisplay.scrollWidth;
        const currentFontSize = parseFloat(this.timeDisplay.style.fontSize) || 1.4;
        
        if(textWidth > containerWidth * 0.7) {
            const newSize = Math.min(1.4, (containerWidth * 0.7) / textWidth * 1.4);
            if(Math.abs(newSize - currentFontSize) > 0.01) {
                this.timeDisplay.style.fontSize = `${newSize}em`;
            }
        } else if(currentFontSize < 1.4) {
            this.timeDisplay.style.fontSize = '1.4em';
        }
    }

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

    rename() {
        const newName = prompt('Nuevo nombre:', this.nameDisplay.textContent);
        if(newName) this.nameDisplay.textContent = newName;
    }

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
            const parts = newTime.split(':');
            const hh = parseInt(parts[0]) || 0;
            const mm = parseInt(parts[1]) || 0;
            const ss = parseInt(parts[2]) || 0;
            
            this.milliseconds = (hh * 3600 + mm * 60 + ss) * 1000;
            this.startTime = Date.now() - this.milliseconds;
            this.updateDisplay();
            this.updateProgress();
            
            this.element.classList.add('animating');
            setTimeout(() => this.element.classList.remove('animating'), 300);
        }
    }

    changeColor() {
        currentColorTimer = this;
        const colorPicker = document.getElementById('color-input');
        colorPicker.value = this.currentColor;
        
        const updateColor = (e) => {
            this.currentColor = e.target.value;
            this.timerElement.style.setProperty('--timer-color', this.currentColor);
            this.progressFill.style.backgroundColor = this.currentColor;
            this.updateGroupCircles(this.getCurrentLevel());
        };
        
        colorPicker.addEventListener('input', updateColor);
        document.querySelector('.color-picker').style.display = 'block';
        
        colorPicker.addEventListener('change', () => {
            colorPicker.removeEventListener('input', updateColor);
            document.querySelector('.color-picker').style.display = 'none';
        }, {once: true});
    }

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
        this.previousLevel = 0;
    }

    delete() {
        this.element.remove();
        delete positions[this.element.dataset.id];
    }
}

let currentColorTimer = null;
let positions = {};
let achievementsPanelOpen = false;
let achievementsCloseHandler = null;

function applyColor() {
    if(currentColorTimer) {
        document.querySelector('.color-picker').style.display = 'none';
    }
}

function sortByName() {
    const container = document.querySelector('.counters-container');
    const timers = Array.from(container.children).sort((a, b) => {
        return a.querySelector('.timer-name').textContent.localeCompare(b.querySelector('.timer-name').textContent);
    });
    
    const timerWidth = timers[0]?.offsetWidth || 140;
    const margin = 30;
    
    timers.forEach((timer, index) => {
        const x = index * (timerWidth + margin);
        const y = 100;
        timer.style.left = `${x}px`;
        timer.style.top = `${y}px`;
        positions[timer.dataset.id] = {x, y};
    });
}

function sortByTime() {
    const container = document.querySelector('.counters-container');
    const timers = Array.from(container.children).sort((a, b) => {
        return b.timer.milliseconds - a.timer.milliseconds;
    });
    
    const timerWidth = timers[0]?.offsetWidth || 140;
    const margin = 30;
    
    timers.forEach((timer, index) => {
        const x = index * (timerWidth + margin);
        const y = 100;
        timer.style.left = `${x}px`;
        timer.style.top = `${y}px`;
        positions[timer.dataset.id] = {x, y};
    });
}

function toggleAchievements() {
  const panel = document.querySelector('.achievements-panel');
  
  if (panel.style.display === 'block') {
    closeAchievements();
  } else {
    openAchievements();
  }
}

function openAchievements() {
  const panel = document.querySelector('.achievements-panel');
  panel.style.display = 'block';
  achievementsPanelOpen = true;
  
  const list = panel.querySelector('.achievements-list');
  list.innerHTML = '';
  
  document.querySelectorAll('.timer-wrapper').forEach(timer => {
    const timerInstance = timer.timer;
    const timerHeader = document.createElement('div');
    timerHeader.className = 'achievement-timer-header';
    timerHeader.innerHTML = `
      <span class="achievement-timer-name">${timerInstance.nameDisplay.textContent}</span>
      <span class="achievement-timer-time">${timerInstance.timeDisplay.textContent}</span>
    `;
    list.appendChild(timerHeader);
    
    const achievements = timerInstance.achievements;
    let hasAchievements = false;
    
    Object.entries(achievements).forEach(([key, data]) => {
      if (data.unlocked) {
        hasAchievements = true;
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.innerHTML = `
          <div class="achievement-icon">${data.icon}</div>
          <div>
            <div class="achievement-name">${data.name}</div>
            <div class="achievement-description">${data.description}</div>
          </div>
        `;
        list.appendChild(item);
      }
    });
    
    if (!hasAchievements) {
      const emptyMsg = document.createElement('div');
      emptyMsg.className = 'achievement-empty';
      emptyMsg.textContent = 'Aún no hay logros desbloqueados';
      list.appendChild(emptyMsg);
    }
  });
  
  // Configurar el evento para cerrar al hacer clic fuera
  achievementsCloseHandler = (e) => {
    if (!e.target.closest('.achievements-panel') && !e.target.classList.contains('achievements-btn')) {
      closeAchievements();
    }
  };
  
  document.addEventListener('click', achievementsCloseHandler);
}

function closeAchievements() {
  const panel = document.querySelector('.achievements-panel');
  panel.style.display = 'none';
  achievementsPanelOpen = false;
  
  if (achievementsCloseHandler) {
    document.removeEventListener('click', achievementsCloseHandler);
    achievementsCloseHandler = null;
  }
}

document.querySelector('.add-counter').addEventListener('click', function(e)  {
    const newTimer = new Timer();
    const container = document.querySelector('.counters-container');
    
    const startX = (container.offsetWidth - newTimer.element.offsetWidth) / 2;
    const startY = (container.offsetHeight - newTimer.element.offsetHeight) / 2;
    
    const btn = e.currentTarget;
    btn.classList.add('clicked');
  
    setTimeout(() => {
        btn.classList.remove('clicked');
    }, 600);

    newTimer.element.style.left = `${startX}px`;
    newTimer.element.style.top = `${startY}px`;
    
    container.appendChild(newTimer.element);
    positions[newTimer.element.dataset.id] = {x: startX, y: startY};
    newTimer.element.timer = newTimer;
    
    requestAnimationFrame(() => {
        newTimer.adjustTextSize();
    });
});

document.getElementById('color-input').addEventListener('input', (e) => {
    if(currentColorTimer) {
        currentColorTimer.timerElement.style.setProperty('--timer-color', e.target.value);
    }
});

function Save() {
    const counters = Array.from(document.querySelectorAll('.timer-wrapper')).map(timer => {
        const timerInstance = timer.timer;
        return {
            id: timer.dataset.id,
            name: timerInstance.nameDisplay.textContent,
            milliseconds: timerInstance.milliseconds,
            position: positions[timer.dataset.id],
            color: timerInstance.currentColor,
            achievements: timerInstance.achievements
        };
    });

    const blob = new Blob([JSON.stringify(counters, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'counters.json';
    link.click();
}

function Load(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        const counters = JSON.parse(e.target.result);
        
        counters.forEach(counter => {
            const timer = new Timer();
            timer.nameDisplay.textContent = counter.name;
            timer.milliseconds = counter.milliseconds;
            timer.currentColor = counter.color;
            timer.achievements = counter.achievements || {};
            timer.element.style.left = `${counter.position.x}px`;
            timer.element.style.top = `${counter.position.y}px`;

            timer.updateDisplay();
            timer.updateProgress();
            timer.timerElement.style.setProperty('--timer-color', timer.currentColor);
            timer.progressFill.style.backgroundColor = timer.currentColor;
            timer.adjustTextSize();

            const container = document.querySelector('.counters-container');
            container.appendChild(timer.element);

            positions[timer.element.dataset.id] = counter.position;
            timer.element.timer = timer;
        });
    };
    
    reader.readAsText(file);
}