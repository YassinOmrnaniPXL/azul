/**
 * Modal Service - Custom styled modals to replace standard JS alerts
 */
export class ModalService {
    constructor() {
        this.activeModals = [];
    }

    /**
     * Show a confirmation dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Options for the dialog
     * @returns {Promise<boolean>} True if confirmed, false if cancelled
     */
    confirm(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                message,
                type: 'confirm',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                confirmClass: options.confirmClass || 'bg-azulBlue hover:bg-opacity-90',
                onConfirm: () => {
                    this.closeModal(modal);
                    resolve(true);
                },
                onCancel: () => {
                    this.closeModal(modal);
                    resolve(false);
                }
            });
        });
    }

    /**
     * Show an alert dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Options for the dialog
     * @returns {Promise<void>}
     */
    alert(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                message,
                type: 'alert',
                confirmText: options.confirmText || 'OK',
                confirmClass: options.confirmClass || 'bg-azulBlue hover:bg-opacity-90',
                onConfirm: () => {
                    this.closeModal(modal);
                    resolve();
                }
            });
        });
    }

    /**
     * Show a prompt dialog
     * @param {string} title - Dialog title
     * @param {string} message - Dialog message
     * @param {Object} options - Options for the dialog
     * @returns {Promise<string|null>} The entered value or null if cancelled
     */
    prompt(title, message, options = {}) {
        return new Promise((resolve) => {
            const modal = this.createModal({
                title,
                message,
                type: 'prompt',
                placeholder: options.placeholder || '',
                defaultValue: options.defaultValue || '',
                confirmText: options.confirmText || 'OK',
                cancelText: options.cancelText || 'Cancel',
                confirmClass: options.confirmClass || 'bg-azulBlue hover:bg-opacity-90',
                onConfirm: (value) => {
                    this.closeModal(modal);
                    resolve(value);
                },
                onCancel: () => {
                    this.closeModal(modal);
                    resolve(null);
                }
            });
        });
    }

    /**
     * Create a modal element
     * @param {Object} config - Modal configuration
     * @returns {HTMLElement} The modal element
     */
    createModal(config) {
        const modal = document.createElement('div');
        modal.className = 'fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50';
        
        const content = document.createElement('div');
        content.className = 'bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all duration-200 scale-95 opacity-0';
        
        const header = document.createElement('div');
        header.className = 'px-6 py-4 border-b border-gray-200';
        header.innerHTML = `<h3 class="text-lg font-semibold text-azulBlue font-display">${config.title}</h3>`;
        
        const body = document.createElement('div');
        body.className = 'px-6 py-4';
        body.innerHTML = `<p class="text-gray-700 mb-4">${config.message}</p>`;
        
        // Add input field for prompt
        let inputField = null;
        if (config.type === 'prompt') {
            inputField = document.createElement('input');
            inputField.type = 'text';
            inputField.className = 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-azulBlue focus:border-azulBlue';
            inputField.placeholder = config.placeholder;
            inputField.value = config.defaultValue;
            body.appendChild(inputField);
        }
        
        const footer = document.createElement('div');
        footer.className = 'px-6 py-4 border-t border-gray-200 flex justify-end space-x-3';
        
        // Cancel button (for confirm and prompt)
        if (config.type === 'confirm' || config.type === 'prompt') {
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors duration-200';
            cancelBtn.textContent = config.cancelText;
            cancelBtn.onclick = () => config.onCancel();
            footer.appendChild(cancelBtn);
        }
        
        // Confirm button
        const confirmBtn = document.createElement('button');
        confirmBtn.className = `px-4 py-2 text-white rounded-md transition-colors duration-200 ${config.confirmClass}`;
        confirmBtn.textContent = config.confirmText;
        confirmBtn.onclick = () => {
            if (config.type === 'prompt') {
                config.onConfirm(inputField.value);
            } else {
                config.onConfirm();
            }
        };
        footer.appendChild(confirmBtn);
        
        content.appendChild(header);
        content.appendChild(body);
        content.appendChild(footer);
        modal.appendChild(content);
        
        // Add to DOM and animate in
        document.body.appendChild(modal);
        this.activeModals.push(modal);
        
        // Animate in
        requestAnimationFrame(() => {
            content.classList.remove('scale-95', 'opacity-0');
            content.classList.add('scale-100', 'opacity-100');
        });
        
        // Focus input field for prompt
        if (inputField) {
            setTimeout(() => inputField.focus(), 100);
            
            // Handle Enter key
            inputField.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    confirmBtn.click();
                }
            });
        }
        
        // Handle Escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                if (config.type === 'alert') {
                    config.onConfirm();
                } else {
                    config.onCancel();
                }
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
        
        // Handle backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                if (config.type === 'alert') {
                    config.onConfirm();
                } else {
                    config.onCancel();
                }
            }
        });
        
        return modal;
    }

    /**
     * Close a modal
     * @param {HTMLElement} modal - The modal to close
     */
    closeModal(modal) {
        const content = modal.querySelector('div');
        content.classList.add('scale-95', 'opacity-0');
        content.classList.remove('scale-100', 'opacity-100');
        
        setTimeout(() => {
            if (modal.parentNode) {
                modal.parentNode.removeChild(modal);
            }
            const index = this.activeModals.indexOf(modal);
            if (index > -1) {
                this.activeModals.splice(index, 1);
            }
        }, 200);
    }

    /**
     * Close all active modals
     */
    closeAll() {
        this.activeModals.forEach(modal => this.closeModal(modal));
    }
}

// Export a singleton instance
export const modalService = new ModalService(); 