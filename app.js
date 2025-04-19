class Timer {
    constructor() {
        this.element = document.getElementById('timer-template').content.cloneNode(true).querySelector('.timer-wrapper');
        this.timerElement = this.element.querySelector('.timer');
        this.timeDisplay = this.element.querySelector('.timer-time');
        this.nameDisplay = this.element.querySelector('.timer-name');
        this.progressFill = this.element.querySelector('.progress-fill');
        this.progressBar = this.element.querySelector('.progress-bar');
        this.progressContainer = this.element.querySelector('.progress-container');
        
        this.milliseconds = 0;
        this.isActive = false;
        this.interval = null;
        this.longPressTimer = null;
        this.currentColor = '#4a90e2';
        this.startTime = 0;
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.preventClick = false;
        this.waveInterval = null;

        this.setupEvents();
        this.updateDisplay();
        this.adjustTextSize();
    }

    setupEvents() {
        this.timerElement.addEventListener('click', (e) => {
            if(!this.isDragging && !this.preventClick) this.toggleTimer();
        });

        this.timerElement.addEventListener('mousedown', (e) => {
            this.dragStartX = e.clientX;
            this.dragStartY = e.clientY;
            this.longPressTimer = setTimeout(() => {
                this.showMenu();
                this.preventClick = true;
            }, 800);
        });

        this.timerElement.addEventListener('mouseup', (e) => {
            clearTimeout(this.longPressTimer);
            const dx = e.clientX - this.dragStartX;
            const dy = e.clientY - this.dragStartY;
            if(Math.sqrt(dx*dx + dy*dy) > 10) this.preventClick = true;
            if(this.preventClick) {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(() => this.preventClick = false, 100);
            }
        });

        this.timerElement.addEventListener('mouseleave', () => {
            clearTimeout(this.longPressTimer);
        });

        this.element.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                this.handleMenuClick(e);
                this.closeMenu();
            });
        });

        this.element.addEventListener('dragstart', (e) => this.handleDragStart(e));
        this.element.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.element.addEventListener('drop', (e) => this.handleDrop(e));
        this.element.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }

    toggleTimer() {
        this.isActive = !this.isActive;
        this.timerElement.classList.toggle('active', this.isActive);
        
        if(this.isActive) {
            this.startTime = Date.now() - this.milliseconds;
            this.start();
            this.startWave();
        } else {
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
        return this.milliseconds >= 36000000000; // 10,000 horas
    }

    updateProgress() {
        const totalHours = 36000000000; // 10,000 horas
        const progress = Math.min(this.milliseconds / totalHours, 1);
        
        // Tamaño dinámico
        const sizeFactor = 1 + (progress * 0.5);
        this.timerElement.style.setProperty('--size-factor', sizeFactor);
        
        this.progressBar.style.transform = `scale(${progress})`;
        
        // Estado Master
        this.timerElement.classList.toggle('master', this.isMaster());
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

    showMenu() {
        const menu = this.element.querySelector('.context-menu');
        menu.style.display = 'flex';
        
        const closeMenu = (e) => {
            if (!menu.contains(e.target)) {
                this.closeMenu();
                document.removeEventListener('click', closeMenu);
            }
        };
        
        setTimeout(() => {
            document.addEventListener('click', closeMenu);
        }, 10);
    }

    closeMenu() {
        const menu = this.element.querySelector('.context-menu');
        menu.style.display = 'none';
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
        
        // Actualizar solo el borde temporalmente
        colorPicker.addEventListener('input', (e) => {
            this.timerElement.style.setProperty('--timer-color', e.target.value);
        }, {once: true});
        
        document.querySelector('.color-picker').style.display = 'block';
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
    }

    delete() {
        this.element.remove();
    }

    handleDragStart(e) {
        this.isDragging = true;
        this.element.classList.add('dragging');
        e.dataTransfer.setData('text/plain', '');
        this.dragStartX = e.clientX;
        this.dragStartY = e.clientY;
    }

    handleDragOver(e) {
        e.preventDefault();
        const draggingElement = document.querySelector('.dragging');
        if(draggingElement && draggingElement !== this.element) {
            const rect = this.element.getBoundingClientRect();
            const nextElement = (e.clientY < rect.top + rect.height/2) ? 
                this.element : this.element.nextSibling;
            
            document.querySelector('.counters-container').insertBefore(
                draggingElement, 
                nextElement
            );
        }
    }

    handleDrop(e) {
        e.preventDefault();
        this.element.classList.remove('drag-over');
    }

    handleDragEnd(e) {
        this.isDragging = false;
        this.element.classList.remove('dragging');
    }
}

let currentColorTimer = null;

function applyColor() {
    if(currentColorTimer) {
        const colorValue = document.getElementById('color-input').value;
        currentColorTimer.currentColor = colorValue;
        // Aplicar a todos los elementos
        currentColorTimer.progressFill.style.backgroundColor = colorValue;
        currentColorTimer.progressBar.style.backgroundColor = colorValue;
        document.querySelector('.color-picker').style.display = 'none';
    }
}

document.querySelector('.add-counter').addEventListener('click', () => {
    const newTimer = new Timer();
    document.querySelector('.counters-container').appendChild(newTimer.element);
    requestAnimationFrame(() => {
        newTimer.adjustTextSize();
    });
});

document.getElementById('color-input').addEventListener('input', (e) => {
    if(currentColorTimer) {
        currentColorTimer.timerElement.style.setProperty('--timer-color', e.target.value);
    }
});

document.querySelector('.counters-container').addEventListener('dragover', (e) => {
    e.preventDefault();
    const draggingElement = document.querySelector('.dragging');
    if(draggingElement) {
        const closestElement = getClosestElement(e.clientY);
        if(closestElement) {
            document.querySelectorAll('.timer-wrapper').forEach(el => el.classList.remove('drag-over'));
            closestElement.classList.add('drag-over');
        }
    }
});

function getClosestElement(y) {
    const elements = [...document.querySelectorAll('.timer-wrapper:not(.dragging)')];
    return elements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height/2;
        if(offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}