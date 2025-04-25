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
        this.progressBar = this.element.querySelector('.progress-bar');
        this.progressContainer = this.element.querySelector('.progress-container');
        this.groupCircles = this.element.querySelector('.group-circles');
        this.contextMenu = this.element.querySelector('.context-menu');

        this.milliseconds = 0;
        this.isActive = false;
        this.interval = null;
        this.longPressTimer = null;
        this.currentColor = '#4a90e2';
        this.startTime = 0;
        this.isDragging = false;
        this.offsetX = 0;
        this.offsetY = 0;
        this.preventClick = false;
        this.waveInterval = null;
        this.closeMenuHandler = null;
        this.element.dataset.id = Date.now() + Math.random().toString(36).substr(2, 9);

        this.titleColors = {
            'Novato': '#4a90e2',
            'Principiante': '#2ecc71',
            'Competente': '#f1c40f',
            'Experto': '#e67e22',
            'Profesional': '#e74c3c',
            'Maestro': '#ffd700'
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
        if(this.isMaster()) {
            this.timerElement.classList.toggle('pulsing', this.isActive);
        }

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

    start() {
        this.stop();
        this.interval = setInterval(() => this.updateTime(), 100);
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
        document.querySelectorAll('.wave-ring').forEach(wave => {
            if(wave.parentNode) wave.remove();
        });
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
            { min: 0, max: 10, title: 'Novato' },
            { min: 11, max: 30, title: 'Principiante' },
            { min: 31, max: 60, title: 'Competente' },
            { min: 61, max: 90, title: 'Experto' },
            { min: 91, max: 99, title: 'Profesional' },
            { min: 100, max: 100, title: 'Maestro' }
        ];
        return titles.find(t => level >= t.min && level <= t.max) || { title: '', color: '' };
    }

    updateGroupCircles(currentLevel) {
        this.groupCircles.innerHTML = '';
        const currentDecade = Math.floor(currentLevel / 10);
        const currentLevelInDecade = currentLevel % 10;
        const isMaster = currentLevel >= 100;

        // Aro de progreso de niveles (interior)
        const levelProgress = (currentLevelInDecade / 10) * 360;
        const levelRing = document.createElement('div');
        levelRing.className = 'level-ring';
        levelRing.style.cssText = `
            transform: rotate(${levelProgress}deg);
            border-color: ${this.currentColor};
        `;
        this.groupCircles.appendChild(levelRing);

        // Aro de progreso de décadas (exterior)
        const decadeProgress = (Math.min(currentLevel, 100) / 100) * 360;
        const decadeRing = document.createElement('div');
        decadeRing.className = 'decade-ring';
        decadeRing.style.cssText = `
            transform: rotate(${decadeProgress}deg);
            border-color: ${this.currentColor};
        `;
        this.groupCircles.appendChild(decadeRing);

        // Puntos de nivel
        const radius = 70;
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90;
            const x = radius * Math.cos(angle * Math.PI / 180);
            const y = radius * Math.sin(angle * Math.PI / 180);
            
            const dot = document.createElement('div');
            dot.className = `level-dot ${i < currentLevelInDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${50 + x}%;
                top: ${50 + y}%;
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // Puntos de década
        const decadeRadius = 95;
        for(let i = 0; i < 10; i++) {
            const angle = (i * 36) - 90;
            const x = decadeRadius * Math.cos(angle * Math.PI / 180);
            const y = decadeRadius * Math.sin(angle * Math.PI / 180);
            
            const dot = document.createElement('div');
            dot.className = `decade-dot ${i < currentDecade ? 'active' : ''}`;
            dot.style.cssText = `
                left: ${50 + x}%;
                top: ${50 + y}%;
                background: ${this.currentColor};
            `;
            this.groupCircles.appendChild(dot);
        }

        // Efecto especial para Maestro
        if(isMaster) {
            const masterGlow = document.createElement('div');
            masterGlow.className = 'master-glow';
            masterGlow.style.cssText = `
                background: radial-gradient(circle, ${this.currentColor} 0%, transparent 70%);
            `;
            this.groupCircles.appendChild(masterGlow);
        }
    }

    getCurrentLevel() {
        const hours = this.milliseconds / 3600000;
        return Math.min(Math.floor(Math.sqrt(hours)), 100);
    }

    isMaster() {
        return this.getCurrentLevel() >= 100;
    }

    updateProgress() {
        const currentLevel = this.getCurrentLevel();
        const nextLevel = currentLevel + 1;
        const levelProgress = currentLevel < 100 ? 
            (Math.sqrt(this.milliseconds / 3600000) - currentLevel) : 1;

        const levelData = this.getTitle(currentLevel);
        this.currentColor = this.titleColors[levelData.title] || '#4a90e2';
        
        this.timerElement.dataset.grade = levelData.title;
        this.timerElement.style.setProperty('--timer-color', this.currentColor);
        this.progressFill.style.backgroundColor = this.currentColor;
        this.progressBar.style.backgroundColor = this.currentColor;
        
        const scaleFactor = 1 + (currentLevel * 0.015);
        this.timerElement.style.transform = `scale(${scaleFactor})`;
        
        this.progressBar.style.transform = `scale(${levelProgress})`;
        this.gradeDisplay.textContent = levelData.title;
        this.updateGroupCircles(currentLevel);
        
        this.timerElement.classList.toggle('master', currentLevel >= 100);
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
            this.progressBar.style.backgroundColor = this.currentColor;
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
    }

    delete() {
        this.element.remove();
        delete positions[this.element.dataset.id];
    }
}

let currentColorTimer = null;
let positions = {};
let gridMode = true;

function applyColor() {
    if(currentColorTimer) {
        currentColorTimer.progressFill.style.backgroundColor = currentColorTimer.currentColor;
        currentColorTimer.progressBar.style.backgroundColor = currentColorTimer.currentColor;
        document.querySelector('.color-picker').style.display = 'none';
    }
}

function sortByName() {
    gridMode = false;
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
    gridMode = false;
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

document.querySelector('.add-counter').addEventListener('click', () => {
    const newTimer = new Timer();
    const container = document.querySelector('.counters-container');
    
    const startX = (container.offsetWidth - newTimer.element.offsetWidth) / 2;
    const startY = (container.offsetHeight - newTimer.element.offsetHeight) / 2;
    
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
            timer.element.style.left = `${counter.position.x}px`;
            timer.element.style.top = `${counter.position.y}px`;

            timer.updateDisplay();
            timer.updateProgress();

            timer.timerElement.style.setProperty('--timer-color', timer.currentColor);
            timer.progressFill.style.backgroundColor = timer.currentColor;
            timer.progressBar.style.backgroundColor = timer.currentColor;

            timer.adjustTextSize();

            const container = document.querySelector('.counters-container');
            container.appendChild(timer.element);

            positions[timer.element.dataset.id] = counter.position;
            timer.element.timer = timer;
        });
    };
    reader.readAsText(file);
}