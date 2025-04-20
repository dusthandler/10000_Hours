class Timer {
    constructor() {
        this.element = document.getElementById('timer-template').content.cloneNode(true).querySelector('.timer-wrapper');
        this.timerElement = this.element.querySelector('.timer');
        this.timeDisplay = this.element.querySelector('.timer-time');
        this.nameDisplay = this.element.querySelector('.timer-name');
        this.progressFill = this.element.querySelector('.progress-fill');
        this.progressBar = this.element.querySelector('.progress-bar');
        this.progressContainer = this.element.querySelector('.progress-container');
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
            if (e.button !== 0) return; // Solo botón izquierdo
            
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

            // Configuración para arrastrar
            const handleMove = (moveEvent) => {
                if (!this.isDragging) {
                    const dx = moveEvent.clientX - this.dragStartX;
                    const dy = moveEvent.clientY - this.dragStartY;
                    if (Math.sqrt(dx*dx + dy*dy) > 10) {
                        this.startDragging(moveEvent);
                    }
                } else {
                    this.handleDragMove(moveEvent);
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
        
        // Limitar al contenedor
        x = Math.max(0, Math.min(x, this.containerRect.width - this.element.offsetWidth));
        y = Math.max(0, Math.min(y, this.containerRect.height - this.element.offsetHeight));
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
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

    isMaster() {
        return this.milliseconds >= 36000000000;
    }

    updateProgress() {
        const totalHours = 36000000000;
        const progress = Math.min(this.milliseconds / totalHours, 1);
        
        const sizeFactor = 1 + (progress * 1.2);
        this.timerElement.style.setProperty('--size-factor', sizeFactor);
        
        this.progressBar.style.transform = `scale(${progress})`;
        
        const isMaster = this.isMaster();
        this.timerElement.classList.toggle('master', isMaster);
        
        if(isMaster) {
            this.timerElement.style.setProperty('--timer-color', this.currentColor);
            this.progressFill.style.backgroundColor = this.currentColor;
            this.progressBar.style.backgroundColor = this.currentColor;
        }
    }

    adjustTextSize() {
        const containerWidth = this.timerElement.offsetWidth;
        const textWidth = this.timeDisplay.scrollWidth;
        
        if(textWidth > containerWidth * 0.7) {
            const newSize = Math.min(1.4, (containerWidth * 0.7) / textWidth * 1.4);
            this.timeDisplay.style.fontSize = `${newSize}em`;
        } else {
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

function organizeGrid() {
    gridMode = true;
    const container = document.querySelector('.counters-container');
    const timers = Array.from(container.children);
    const containerWidth = container.offsetWidth;
    const itemWidth = 140;
    const margin = 20;
    const itemsPerRow = Math.floor((containerWidth - margin) / (itemWidth + margin));

    timers.forEach((timer, index) => {
        const col = index % itemsPerRow;
        const row = Math.floor(index / itemsPerRow);
        
        const x = col * (itemWidth + margin);
        const y = row * (itemWidth + margin);
        
        timer.style.transition = 'all 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
        timer.style.left = `${x}px`;
        timer.style.top = `${y}px`;
        
        positions[timer.dataset.id] = {x, y};
    });
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

window.addEventListener('load', () => {
    setTimeout(organizeGrid, 100);
});