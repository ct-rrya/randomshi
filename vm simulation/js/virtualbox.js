/**
 * System Administration Simulator - VirtualBox Simulation
 * Recreates the Oracle VM VirtualBox Manager interface,
 * VM creation wizard, Settings dialog, and VM execution window chrome.
 */

class VirtualBoxManager {
    constructor() {
        this.selectedVm = null;
        this.activeTab = 'details';
        this.init();
    }

    init() {
        // Subscribe to state updates
        window.systemState.subscribe((state, changeKey) => {
            if (changeKey === 'vm' || changeKey === 'all') {
                this.render();
            }
        });

        this.bindEvents();
        this.render();
    }

    bindEvents() {
        // Top menu actions
        document.getElementById('vbox-menu-file')?.addEventListener('click', (e) => this.showMenuDropdown(e, 'file'));
        document.getElementById('vbox-menu-machine')?.addEventListener('click', (e) => this.showMenuDropdown(e, 'machine'));
        document.getElementById('vbox-menu-help')?.addEventListener('click', (e) => this.showMenuDropdown(e, 'help'));

        // Toolbar buttons
        document.getElementById('vbox-btn-new')?.addEventListener('click', () => this.openNewVmModal());
        document.getElementById('vbox-btn-settings')?.addEventListener('click', () => this.openSettingsModal('system'));
        document.getElementById('vbox-btn-start')?.addEventListener('click', () => this.handleStartVm());
        document.getElementById('vbox-btn-discard')?.addEventListener('click', () => this.handleDiscardVm());
        document.getElementById('vbox-btn-network')?.addEventListener('click', () => this.openSettingsModal('network'));
        document.getElementById('vbox-btn-storage')?.addEventListener('click', () => this.openSettingsModal('storage'));

        // VM Window controls
        document.getElementById('vm-win-close')?.addEventListener('click', () => this.promptCloseVm());
        document.getElementById('vm-win-minimize')?.addEventListener('click', () => this.minimizeVmWindow());
        document.getElementById('vm-win-maximize')?.addEventListener('click', () => this.toggleMaximizeVmWindow());

        // VM Menu Bar
        document.getElementById('vm-menu-machine')?.addEventListener('click', (e) => this.showVmMachineMenu(e));
        document.getElementById('vm-menu-input')?.addEventListener('click', (e) => this.showVmInputMenu(e));
        document.getElementById('vm-menu-devices')?.addEventListener('click', (e) => this.showVmDevicesMenu(e));
    }

    render() {
        const state = window.systemState.getState();
        const vmListEl = document.getElementById('vbox-vm-list');
        const mainPaneEl = document.getElementById('vbox-main-pane');
        const btnSettings = document.getElementById('vbox-btn-settings');
        const btnStart = document.getElementById('vbox-btn-start');
        const btnDiscard = document.getElementById('vbox-btn-discard');
        const btnNetwork = document.getElementById('vbox-btn-network');
        const btnStorage = document.getElementById('vbox-btn-storage');

        if (!vmListEl || !mainPaneEl) return;

        // Render VM List
        if (!state.vm.created) {
            vmListEl.innerHTML = `
                <div class="vbox-empty-vm-list">
                    <span class="vbox-icon-subtle">💻</span>
                    <span class="vbox-no-vms-label">No virtual machines</span>
                    <small>Click "New" on the toolbar to create a new virtual machine.</small>
                </div>
            `;
            if (btnSettings) btnSettings.disabled = true;
            if (btnStart) btnStart.disabled = true;
            if (btnDiscard) btnDiscard.disabled = true;
            if (btnNetwork) btnNetwork.disabled = true;
            if (btnStorage) btnStorage.disabled = true;

            // Render Empty Main Pane
            mainPaneEl.innerHTML = `
                <div class="vbox-welcome-pane">
                    <div class="vbox-welcome-content">
                        <div class="vbox-big-logo">
                            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                                <rect width="64" height="64" rx="8" fill="#1b498b"/>
                                <path d="M12 16L32 6L52 16V48L32 58L12 48V16Z" stroke="#4fc3f7" stroke-width="3" fill="#0d2b56"/>
                                <path d="M32 6V58" stroke="#4fc3f7" stroke-width="2"/>
                                <path d="M12 16L52 48" stroke="#4fc3f7" stroke-width="1.5"/>
                                <path d="M52 16L12 48" stroke="#4fc3f7" stroke-width="1.5"/>
                            </svg>
                        </div>
                        <h2>Welcome to Oracle VM VirtualBox Manager!</h2>
                        <p>The left part of this window lists all virtual machines on your computer. You currently have no virtual machines.</p>
                        <p>Press the <b>New</b> button on the toolbar or press <b>Ctrl+N</b> to create a new virtual machine.</p>
                        <button class="vbox-btn vbox-btn-primary" onclick="window.vboxManager.openNewVmModal()">
                            ✨ Create Virtual Machine...
                        </button>
                    </div>
                </div>
            `;
            return;
        }

        // We have a VM created
        if (btnSettings) btnSettings.disabled = (state.vm.status === 'running');
        if (btnNetwork) btnNetwork.disabled = (state.vm.status === 'running');
        if (btnStorage) btnStorage.disabled = (state.vm.status === 'running');
        if (btnStart) {
            btnStart.disabled = false;
            btnStart.innerHTML = state.vm.status === 'running' 
                ? `<span class="vbox-tb-icon">🟢</span><span>Running</span>`
                : `<span class="vbox-tb-icon">▶️</span><span>Start</span>`;
        }
        if (btnDiscard) btnDiscard.disabled = (state.vm.status !== 'running' && state.vm.status !== 'saved');

        // Render VM List Item
        const statusBadgeClass = state.vm.status === 'running' ? 'status-running' : 'status-powered-off';
        const statusLabel = state.vm.status === 'running' ? 'Running' : (state.vm.status === 'saved' ? 'Saved' : 'Powered Off');

        vmListEl.innerHTML = `
            <div class="vbox-vm-item selected" onclick="window.vboxManager.selectVm('${state.vm.name}')">
                <div class="vbox-vm-icon">
                    <svg width="24" height="24" viewBox="0 0 24 24">
                        <rect x="2" y="2" width="9" height="9" fill="#0078d7"/>
                        <rect x="13" y="2" width="9" height="9" fill="#0078d7"/>
                        <rect x="2" y="13" width="9" height="9" fill="#0078d7"/>
                        <rect x="13" y="13" width="9" height="9" fill="#0078d7"/>
                    </svg>
                </div>
                <div class="vbox-vm-info">
                    <div class="vbox-vm-title">${state.vm.name}</div>
                    <div class="vbox-vm-subtitle ${statusBadgeClass}">
                        <span class="vbox-status-dot"></span>${statusLabel}
                    </div>
                </div>
            </div>
        `;

        // Render Details in Main Pane
        mainPaneEl.innerHTML = `
            <div class="vbox-vm-details-view">
                <div class="vbox-details-header">
                    <div class="vbox-details-title-row">
                        <div class="vbox-details-os-icon">
                            <svg width="32" height="32" viewBox="0 0 32 32">
                                <rect x="2" y="2" width="13" height="13" fill="#0078d7"/>
                                <rect x="17" y="2" width="13" height="13" fill="#0078d7"/>
                                <rect x="2" y="17" width="13" height="13" fill="#0078d7"/>
                                <rect x="17" y="17" width="13" height="13" fill="#0078d7"/>
                            </svg>
                        </div>
                        <div>
                            <h2 class="vbox-details-vm-name">${state.vm.name}</h2>
                            <span class="vbox-details-os-name">${state.vm.osVersion}</span>
                        </div>
                    </div>
                    <div class="vbox-details-actions">
                        <button class="vbox-btn" onclick="window.vboxManager.openSettingsModal('system')" ${state.vm.status === 'running' ? 'disabled' : ''}>⚙️ Settings</button>
                        <button class="vbox-btn vbox-btn-accent" onclick="window.vboxManager.handleStartVm()">${state.vm.status === 'running' ? 'Show VM Window' : '▶️ Start'}</button>
                    </div>
                </div>

                <div class="vbox-section-accordion">
                    <!-- General -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">General</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Name:</span><span class="v">${state.vm.name}</span></div>
                            <div class="vbox-kv"><span class="k">Operating System:</span><span class="v">${state.vm.osVersion}</span></div>
                        </div>
                    </div>

                    <!-- System -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">System</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Base Memory:</span><span class="v">${state.vm.ram} MB</span></div>
                            <div class="vbox-kv"><span class="k">Processors:</span><span class="v">${state.vm.processors}</span></div>
                            <div class="vbox-kv"><span class="k">Boot Order:</span><span class="v">${state.vm.bootOrder ? state.vm.bootOrder.join(', ') : 'Floppy, Optical, Hard Disk'}</span></div>
                            <div class="vbox-kv"><span class="k">Acceleration:</span><span class="v">VT-x/AMD-V, Nested Paging, PAE/NX</span></div>
                        </div>
                    </div>

                    <!-- Display -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">Display</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Video Memory:</span><span class="v">${state.vm.videoMemory || 128} MB</span></div>
                            <div class="vbox-kv"><span class="k">Graphics Controller:</span><span class="v">VBoxSVGA</span></div>
                            <div class="vbox-kv"><span class="k">Remote Desktop Server:</span><span class="v">Disabled</span></div>
                        </div>
                    </div>

                    <!-- Storage -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">Storage</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv">
                                <span class="k">Controller: SATA</span>
                                <span class="v">SATA Port 0: <b>${state.vm.name}.vdi</b> (${state.vm.storage}.00 GB, Dynamically allocated)</span>
                            </div>
                            <div class="vbox-kv">
                                <span class="k">Controller: IDE</span>
                                <span class="v">IDE Secondary Master: <b>${state.vm.isoAttached || '[Optical Drive] Empty'}</b></span>
                            </div>
                        </div>
                    </div>

                    <!-- Audio -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">Audio</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Host Driver:</span><span class="v">Windows DirectSound</span></div>
                            <div class="vbox-kv"><span class="k">Controller:</span><span class="v">Intel HD Audio</span></div>
                        </div>
                    </div>

                    <!-- Network -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">Network</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Adapter 1:</span><span class="v">Intel PRO/1000 MT Desktop (${state.vm.networkAttachedTo || 'NAT'})</span></div>
                        </div>
                    </div>

                    <!-- USB -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">USB</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Device Filters:</span><span class="v">0 (0 active)</span></div>
                            <div class="vbox-kv"><span class="k">Controller:</span><span class="v">USB 3.0 (xHCI) Controller</span></div>
                        </div>
                    </div>

                    <!-- Shared Folders -->
                    <div class="vbox-accordion-section">
                        <div class="vbox-accordion-header" onclick="this.parentElement.classList.toggle('collapsed')">
                            <span class="vbox-caret">▼</span>
                            <span class="vbox-sec-title">Shared Folders</span>
                        </div>
                        <div class="vbox-accordion-body">
                            <div class="vbox-kv"><span class="k">Shared Folders:</span><span class="v">None</span></div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    selectVm(name) {
        this.selectedVm = name;
        this.render();
    }

    // Modal: Create Virtual Machine 4-Step Wizard
    openNewVmModal() {
        this.wizardStep = 1;
        const currentVm = window.systemState.getState().vm;
        this.newVmTemp = {
            name: currentVm.name || "WinServer2022",
            folder: currentVm.folder || "C:\\Users\\Student\\VirtualBox VMs",
            isoAttached: currentVm.isoAttached || "Windows_Server_2022.iso",
            osType: "Microsoft Windows",
            osVersion: currentVm.osVersion || "Windows 2022 (64-bit)",
            ram: currentVm.ram || 4096,
            processors: currentVm.processors || 2,
            storage: currentVm.storage || 50.00,
            diskType: "VDI",
            allocation: "Dynamically allocated"
        };
        this.renderNewVmWizardModal();
    }

    renderNewVmWizardModal() {
        const modalId = 'modal-vbox-new-vm';
        const step = this.wizardStep || 1;
        const data = this.newVmTemp;

        let stepContent = '';
        if (step === 1) {
            // Step 1: Name and Operating System
            stepContent = `
                <div class="vbox-wizard-header">
                    <div class="vbox-wizard-icon">💻</div>
                    <div class="vbox-wizard-desc">
                        <h3>Name and Operating System</h3>
                        <p>Please choose a descriptive name and destination folder for the new virtual machine and select the type of operating system you intend to install on it.</p>
                    </div>
                </div>
                <div class="vbox-form-section">
                    <div class="vbox-form-row">
                        <label for="new-vm-name">Name:</label>
                        <input type="text" id="new-vm-name" value="${data.name}" class="vbox-input" oninput="window.vboxManager.newVmTemp.name = this.value" />
                    </div>
                    <div class="vbox-form-row">
                        <label for="new-vm-folder">Folder:</label>
                        <input type="text" id="new-vm-folder" value="${data.folder}" class="vbox-input" oninput="window.vboxManager.newVmTemp.folder = this.value" />
                    </div>
                    <div class="vbox-form-row">
                        <label for="new-vm-iso">ISO Image:</label>
                        <select id="new-vm-iso" class="vbox-select" onchange="window.vboxManager.newVmTemp.isoAttached = this.value">
                            <option value="Windows_Server_2022.iso" ${data.isoAttached === 'Windows_Server_2022.iso' ? 'selected' : ''}>Windows_Server_2022.iso (4.72 GB)</option>
                            <option value="" ${!data.isoAttached ? 'selected' : ''}>[None / Leave Empty]</option>
                        </select>
                    </div>
                    <div class="vbox-form-row">
                        <label for="new-vm-type">Type:</label>
                        <select id="new-vm-type" class="vbox-select" disabled>
                            <option value="Microsoft Windows" selected>Microsoft Windows</option>
                        </select>
                    </div>
                    <div class="vbox-form-row">
                        <label for="new-vm-version">Version:</label>
                        <select id="new-vm-version" class="vbox-select" onchange="window.vboxManager.newVmTemp.osVersion = this.value">
                            <option value="Windows 2022 (64-bit)" ${data.osVersion.includes('2022') ? 'selected' : ''}>Windows 2022 (64-bit)</option>
                            <option value="Windows 2019 (64-bit)" ${data.osVersion.includes('2019') ? 'selected' : ''}>Windows 2019 (64-bit)</option>
                            <option value="Windows 10 (64-bit)" ${data.osVersion.includes('10') ? 'selected' : ''}>Windows 10 (64-bit)</option>
                        </select>
                    </div>
                </div>
            `;
        } else if (step === 2) {
            // Step 2: Hardware
            stepContent = `
                <div class="vbox-wizard-header">
                    <div class="vbox-wizard-icon">⚙️</div>
                    <div class="vbox-wizard-desc">
                        <h3>Hardware Configuration</h3>
                        <p>Configure the amount of virtual memory (RAM) and virtual CPU cores allocated to the virtual machine.</p>
                    </div>
                </div>
                <div class="vbox-form-section">
                    <div class="vbox-form-row">
                        <label>Base Memory (RAM):</label>
                        <div class="vbox-range-group">
                            <input type="range" id="new-vm-ram-range" min="1024" max="16384" step="512" value="${data.ram}" 
                                   oninput="document.getElementById('new-vm-ram').value = this.value; window.vboxManager.newVmTemp.ram = parseInt(this.value, 10);" />
                            <div class="vbox-input-with-unit">
                                <input type="number" id="new-vm-ram" value="${data.ram}" min="1024" max="16384" step="512" 
                                       oninput="document.getElementById('new-vm-ram-range').value = this.value; window.vboxManager.newVmTemp.ram = parseInt(this.value, 10);" class="vbox-input vbox-input-sm" />
                                <span>MB</span>
                            </div>
                        </div>
                    </div>
                    <div class="vbox-form-row">
                        <label>Processors (CPUs):</label>
                        <div class="vbox-range-group">
                            <input type="range" id="new-vm-cpu-range" min="1" max="8" step="1" value="${data.processors}" 
                                   oninput="document.getElementById('new-vm-cpu').value = this.value; window.vboxManager.newVmTemp.processors = parseInt(this.value, 10);" />
                            <div class="vbox-input-with-unit">
                                <input type="number" id="new-vm-cpu" value="${data.processors}" min="1" max="8" 
                                       oninput="document.getElementById('new-vm-cpu-range').value = this.value; window.vboxManager.newVmTemp.processors = parseInt(this.value, 10);" class="vbox-input vbox-input-sm" />
                                <span>CPU</span>
                            </div>
                        </div>
                    </div>
                    <div class="vbox-form-row" style="margin-top: 15px;">
                        <label style="width: auto;"><input type="checkbox" checked disabled /> Enable EFI (special OSes only)</label>
                    </div>
                </div>
            `;
        } else if (step === 3) {
            // Step 3: Virtual Hard Disk
            stepContent = `
                <div class="vbox-wizard-header">
                    <div class="vbox-wizard-icon">💽</div>
                    <div class="vbox-wizard-desc">
                        <h3>Virtual Hard Disk</h3>
                        <p>Create a virtual hard disk file to hold the guest operating system and virtual machine data.</p>
                    </div>
                </div>
                <div class="vbox-form-section">
                    <div class="vbox-form-row">
                        <label><input type="radio" checked disabled /> Create a Virtual Hard Disk Now</label>
                    </div>
                    <div class="vbox-form-row">
                        <label>Disk Size:</label>
                        <div class="vbox-input-with-unit">
                            <input type="number" id="new-vm-storage" value="${data.storage}" step="1.0" min="20" max="500" 
                                   oninput="window.vboxManager.newVmTemp.storage = parseFloat(this.value) || 50;" class="vbox-input vbox-input-sm" />
                            <span>GB</span>
                        </div>
                    </div>
                    <div class="vbox-form-row">
                        <label>Hard Disk File Type:</label>
                        <input type="text" value="VDI (VirtualBox Disk Image)" class="vbox-input" disabled />
                    </div>
                    <div class="vbox-form-row">
                        <label>Storage on Physical Disk:</label>
                        <input type="text" value="Dynamically allocated" class="vbox-input" disabled />
                    </div>
                </div>
            `;
        } else if (step === 4) {
            // Step 4: Summary
            stepContent = `
                <div class="vbox-wizard-header">
                    <div class="vbox-wizard-icon">📋</div>
                    <div class="vbox-wizard-desc">
                        <h3>Summary</h3>
                        <p>Please review the configuration settings before creating the virtual machine.</p>
                    </div>
                </div>
                <div class="vbox-form-section" style="background: #fdfdfd; border: 1px solid #dcdcdc; padding: 12px; border-radius: 4px;">
                    <table class="win-table" style="font-size: 12px;">
                        <tbody>
                            <tr><td style="width: 170px; font-weight: bold;">Machine Name:</td><td>${data.name}</td></tr>
                            <tr><td style="font-weight: bold;">Machine Base Folder:</td><td>${data.folder}</td></tr>
                            <tr><td style="font-weight: bold;">ISO Image:</td><td>${data.isoAttached || '[None]'}</td></tr>
                            <tr><td style="font-weight: bold;">Guest OS:</td><td>${data.osVersion}</td></tr>
                            <tr><td style="font-weight: bold;">Base Memory:</td><td>${data.ram} MB</td></tr>
                            <tr><td style="font-weight: bold;">Processors:</td><td>${data.processors} CPU(s)</td></tr>
                            <tr><td style="font-weight: bold;">Virtual Hard Disk:</td><td>${data.storage} GB (VDI, Dynamically allocated)</td></tr>
                        </tbody>
                    </table>
                </div>
            `;
        }

        const html = `
            <div class="vbox-dialog new-vm-dialog" style="width: 580px;">
                <div class="vbox-dialog-titlebar">
                    <span class="vbox-dialog-title">Create Virtual Machine (Step ${step} of 4)</span>
                    <button class="vbox-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="vbox-dialog-body" style="min-height: 290px;">
                    ${stepContent}
                </div>
                <div class="vbox-dialog-footer" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="vbox-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                    ${step > 1 ? `<button class="vbox-btn" onclick="window.vboxManager.prevNewVmStep()">&lt; Back</button>` : ''}
                    ${step < 4 ? `<button class="vbox-btn vbox-btn-primary" onclick="window.vboxManager.nextNewVmStep()">Next &gt;</button>` : ''}
                    ${step === 4 ? `<button class="vbox-btn vbox-btn-primary" onclick="window.vboxManager.submitNewVm()">Finish</button>` : ''}
                </div>
            </div>
        `;

        const existingModal = document.getElementById(modalId);
        if (existingModal) {
            existingModal.innerHTML = html;
        } else {
            window.windowsManager.openModal({
                id: modalId,
                title: 'Create Virtual Machine',
                html
            });
        }
    }

    nextNewVmStep() {
        if (this.wizardStep === 1) {
            const nameIn = document.getElementById('new-vm-name');
            if (nameIn && !nameIn.value.trim()) {
                alert("Please enter a virtual machine name.");
                return;
            }
        }
        this.wizardStep = Math.min(4, (this.wizardStep || 1) + 1);
        this.renderNewVmWizardModal();
    }

    prevNewVmStep() {
        this.wizardStep = Math.max(1, (this.wizardStep || 1) - 1);
        this.renderNewVmWizardModal();
    }

    submitNewVm() {
        const data = this.newVmTemp || {};
        window.systemState.createVM({
            name: data.name || 'WinServer2022',
            folder: data.folder || 'C:\\Users\\Student\\VirtualBox VMs',
            osType: "Microsoft Windows",
            osVersion: data.osVersion || "Windows 2022 (64-bit)",
            ram: data.ram || 4096,
            processors: data.processors || 2,
            storage: data.storage || 50.00,
            diskType: "VDI",
            allocation: "Dynamically allocated",
            isoAttached: data.isoAttached || "Windows_Server_2022.iso"
        });

        window.windowsManager.closeModal('modal-vbox-new-vm');
    }

    // Modal: VM Settings Dialog (Detailed multi-tab layout with all 8 categories)
    openSettingsModal(initialTab = 'system') {
        const state = window.systemState.getState();
        if (!state.vm.created) return;

        const modalId = 'modal-vbox-settings';
        const html = `
            <div class="vbox-dialog vbox-settings-dialog">
                <div class="vbox-dialog-titlebar">
                    <span class="vbox-dialog-title">${state.vm.name} - Settings</span>
                    <button class="vbox-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="vbox-settings-body">
                    <!-- Left Tab Sidebar (All 8 Categories) -->
                    <div class="vbox-settings-sidebar">
                        <div class="vbox-tab-item ${initialTab === 'general' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('general')">
                            <span class="tab-icon">🖥️</span> General
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'system' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('system')">
                            <span class="tab-icon">⚙️</span> System
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'display' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('display')">
                            <span class="tab-icon">📺</span> Display
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'storage' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('storage')">
                            <span class="tab-icon">💽</span> Storage
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'audio' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('audio')">
                            <span class="tab-icon">🔊</span> Audio
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'network' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('network')">
                            <span class="tab-icon">🌐</span> Network
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'usb' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('usb')">
                            <span class="tab-icon">🔌</span> USB
                        </div>
                        <div class="vbox-tab-item ${initialTab === 'shared' ? 'active' : ''}" onclick="window.vboxManager.switchSettingsTab('shared')">
                            <span class="tab-icon">📁</span> Shared Folders
                        </div>
                    </div>

                    <!-- Right Content Area -->
                    <div class="vbox-settings-content">
                        <!-- GENERAL TAB -->
                        <div id="vbox-tab-general" class="vbox-settings-tab-panel ${initialTab === 'general' ? 'active' : ''}">
                            <h3 class="panel-heading">General Settings</h3>
                            <div class="vbox-form-row">
                                <label>Name:</label>
                                <input type="text" id="settings-name" value="${state.vm.name}" class="vbox-input" />
                            </div>
                            <div class="vbox-form-row">
                                <label>Type:</label>
                                <input type="text" value="${state.vm.osType}" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>Version:</label>
                                <input type="text" value="${state.vm.osVersion}" class="vbox-input" disabled />
                            </div>
                        </div>

                        <!-- SYSTEM TAB -->
                        <div id="vbox-tab-system" class="vbox-settings-tab-panel ${initialTab === 'system' ? 'active' : ''}">
                            <h3 class="panel-heading">Motherboard & Processor</h3>
                            <div class="vbox-form-row">
                                <label>Base Memory:</label>
                                <div class="vbox-range-group">
                                    <input type="range" id="settings-ram-range" min="1024" max="16384" step="512" value="${state.vm.ram}" oninput="document.getElementById('settings-ram').value = this.value" />
                                    <div class="vbox-input-with-unit">
                                        <input type="number" id="settings-ram" value="${state.vm.ram}" min="1024" max="16384" step="512" class="vbox-input vbox-input-sm" oninput="document.getElementById('settings-ram-range').value = this.value" />
                                        <span>MB</span>
                                    </div>
                                </div>
                            </div>
                            <div class="vbox-form-row">
                                <label>Processors:</label>
                                <div class="vbox-range-group">
                                    <input type="range" id="settings-cpu-range" min="1" max="8" step="1" value="${state.vm.processors}" oninput="document.getElementById('settings-cpu').value = this.value" />
                                    <div class="vbox-input-with-unit">
                                        <input type="number" id="settings-cpu" value="${state.vm.processors}" min="1" max="8" class="vbox-input vbox-input-sm" oninput="document.getElementById('settings-cpu-range').value = this.value" />
                                        <span>CPU</span>
                                    </div>
                                </div>
                            </div>
                            <div class="vbox-form-row">
                                <label>Boot Order:</label>
                                <div class="vbox-checkbox-list">
                                    <div><input type="checkbox" id="boot-floppy" checked> Floppy</div>
                                    <div><input type="checkbox" id="boot-optical" checked> Optical Drive</div>
                                    <div><input type="checkbox" id="boot-hdd" checked> Hard Disk</div>
                                    <div><input type="checkbox" id="boot-net"> Network</div>
                                </div>
                            </div>
                        </div>

                        <!-- DISPLAY TAB -->
                        <div id="vbox-tab-display" class="vbox-settings-tab-panel ${initialTab === 'display' ? 'active' : ''}">
                            <h3 class="panel-heading">Screen</h3>
                            <div class="vbox-form-row">
                                <label>Video Memory:</label>
                                <input type="text" value="128 MB" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>Graphics Controller:</label>
                                <input type="text" value="VBoxSVGA" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>Remote Desktop Server:</label>
                                <input type="text" value="Disabled" class="vbox-input" disabled />
                            </div>
                        </div>

                        <!-- STORAGE TAB -->
                        <div id="vbox-tab-storage" class="vbox-settings-tab-panel ${initialTab === 'storage' ? 'active' : ''}">
                            <h3 class="panel-heading">Storage Devices</h3>
                            <div class="vbox-storage-split">
                                <div class="vbox-storage-tree">
                                    <div class="tree-header">Storage Devices Tree</div>
                                    <div class="tree-node parent">
                                        <span class="tree-icon">🎛️</span> Controller: SATA
                                    </div>
                                    <div class="tree-node child">
                                        <span class="tree-icon">💽</span> ${state.vm.name}.vdi (${state.vm.storage} GB)
                                    </div>
                                    <div class="tree-node parent">
                                        <span class="tree-icon">🎛️</span> Controller: IDE
                                    </div>
                                    <div class="tree-node child selected">
                                        <span class="tree-icon">💿</span> <span id="vbox-storage-tree-iso">${state.vm.isoAttached || '[Empty Optical Drive]'}</span>
                                    </div>
                                </div>
                                <div class="vbox-storage-details">
                                    <div class="form-title">Optical Drive Attributes</div>
                                    <div class="vbox-form-row">
                                        <label>Optical Drive:</label>
                                        <select id="settings-iso-select" class="vbox-select">
                                            <option value="Windows_Server_2022.iso" ${state.vm.isoAttached === 'Windows_Server_2022.iso' ? 'selected' : ''}>Windows_Server_2022.iso (4.72 GB)</option>
                                            <option value="" ${!state.vm.isoAttached ? 'selected' : ''}>[Remove disk from virtual drive / Empty]</option>
                                        </select>
                                    </div>
                                    <div class="vbox-info-box">
                                        <small>Mounting the Windows Server 2022 ISO file allows the virtual machine to boot the Windows Setup installer.</small>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- AUDIO TAB -->
                        <div id="vbox-tab-audio" class="vbox-settings-tab-panel ${initialTab === 'audio' ? 'active' : ''}">
                            <h3 class="panel-heading">Audio Configuration</h3>
                            <div class="vbox-form-row">
                                <label><input type="checkbox" id="settings-audio-enable" checked /> Enable Audio</label>
                            </div>
                            <div class="vbox-form-row">
                                <label>Host Audio Driver:</label>
                                <input type="text" value="Windows DirectSound" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>Audio Controller:</label>
                                <input type="text" value="Intel HD Audio" class="vbox-input" disabled />
                            </div>
                        </div>

                        <!-- NETWORK TAB -->
                        <div id="vbox-tab-network" class="vbox-settings-tab-panel ${initialTab === 'network' ? 'active' : ''}">
                            <h3 class="panel-heading">Adapter 1</h3>
                            <div class="vbox-form-row">
                                <label><input type="checkbox" id="settings-net-enable" checked /> Enable Network Adapter</label>
                            </div>
                            <div class="vbox-form-row">
                                <label>Attached to:</label>
                                <select id="settings-net-attached" class="vbox-select">
                                    <option value="NAT" ${(!state.vm.networkAttachedTo || state.vm.networkAttachedTo === 'NAT') ? 'selected' : ''}>NAT</option>
                                    <option value="Bridged Adapter" ${state.vm.networkAttachedTo === 'Bridged Adapter' ? 'selected' : ''}>Bridged Adapter</option>
                                    <option value="Internal Network" ${state.vm.networkAttachedTo === 'Internal Network' ? 'selected' : ''}>Internal Network</option>
                                    <option value="Host-only Adapter" ${state.vm.networkAttachedTo === 'Host-only Adapter' ? 'selected' : ''}>Host-only Adapter</option>
                                </select>
                            </div>
                            <div class="vbox-form-row">
                                <label>Adapter Type:</label>
                                <input type="text" value="Intel PRO/1000 MT Desktop (82540EM)" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>Promiscuous Mode:</label>
                                <input type="text" value="Deny" class="vbox-input" disabled />
                            </div>
                            <div class="vbox-form-row">
                                <label>MAC Address:</label>
                                <input type="text" value="080027A1B2C3" class="vbox-input" disabled />
                            </div>
                        </div>

                        <!-- USB TAB -->
                        <div id="vbox-tab-usb" class="vbox-settings-tab-panel ${initialTab === 'usb' ? 'active' : ''}">
                            <h3 class="panel-heading">USB Configuration</h3>
                            <div class="vbox-form-row">
                                <label><input type="checkbox" id="settings-usb-enable" checked /> Enable USB Controller</label>
                            </div>
                            <div class="vbox-form-row">
                                <label><input type="radio" checked disabled /> USB 3.0 (xHCI) Controller</label>
                            </div>
                        </div>

                        <!-- SHARED TAB -->
                        <div id="vbox-tab-shared" class="vbox-settings-tab-panel ${initialTab === 'shared' ? 'active' : ''}">
                            <h3 class="panel-heading">Shared Folders</h3>
                            <p style="color: #666; font-size: 12px; margin-bottom: 12px;">Machine Folders:</p>
                            <div class="vbox-info-box">
                                <small>No shared folders configured. To share files with the guest OS, click Add Shared Folder.</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="vbox-dialog-footer">
                    <button class="vbox-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                    <button class="vbox-btn vbox-btn-primary" onclick="window.vboxManager.submitSettings()">OK</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: `${state.vm.name} - Settings`,
            html
        });
    }

    switchSettingsTab(tabName) {
        document.querySelectorAll('.vbox-tab-item').forEach(el => el.classList.remove('active'));
        document.querySelectorAll('.vbox-settings-tab-panel').forEach(el => el.classList.remove('active'));

        const targetTab = document.querySelector(`.vbox-tab-item[onclick*="${tabName}"]`);
        const targetPanel = document.getElementById(`vbox-tab-${tabName}`);

        if (targetTab) targetTab.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    }

    submitSettings() {
        const ram = parseInt(document.getElementById('settings-ram')?.value, 10);
        const processors = parseInt(document.getElementById('settings-cpu')?.value, 10);
        const isoAttached = document.getElementById('settings-iso-select')?.value;
        const networkEnabled = document.getElementById('settings-net-enable')?.checked;
        const networkAttachedTo = document.getElementById('settings-net-attached')?.value;

        const bootOrder = [];
        if (document.getElementById('boot-floppy')?.checked) bootOrder.push("Floppy");
        if (document.getElementById('boot-optical')?.checked) bootOrder.push("Optical");
        if (document.getElementById('boot-hdd')?.checked) bootOrder.push("Hard Disk");
        if (document.getElementById('boot-net')?.checked) bootOrder.push("Network");

        window.systemState.updateVMSettings({
            ram,
            processors,
            isoAttached,
            bootOrder: bootOrder.length ? bootOrder : ["Floppy", "Optical", "Hard Disk"],
            networkEnabled: networkEnabled !== undefined ? networkEnabled : true,
            networkAttachedTo: networkAttachedTo || "NAT"
        });

        window.windowsManager.closeModal('modal-vbox-settings');
    }

    closeModal() {
        window.windowsManager.closeAllModals();
    }

    // VM Execution Logic
    handleStartVm() {
        const state = window.systemState.getState();
        const startResult = window.systemState.startVM();

        if (!startResult.success) {
            this.showVirtualBoxErrorModal("VirtualBox - Error", startResult.error);
            return;
        }

        // Open VM Window
        this.openVmWindow();
    }

    handleDiscardVm() {
        window.windowsManager.showConfirmBox({
            title: "Oracle VM VirtualBox",
            message: "Are you sure you want to discard the saved state of the virtual machine?",
            onYes: () => window.systemState.stopVM("powerOff")
        });
    }

    openVmWindow() {
        const state = window.systemState.getState();
        const vmWindowEl = document.getElementById('vm-running-window');
        if (!vmWindowEl) return;

        vmWindowEl.style.display = 'flex';
        vmWindowEl.classList.remove('minimized');

        // Update Title
        const titleEl = document.getElementById('vm-win-title-text');
        if (titleEl) {
            titleEl.textContent = `${state.vm.name} [Running] - Oracle VM VirtualBox`;
        }

        // Trigger Windows / Boot screen lifecycle
        if (window.windowsManager) {
            window.windowsManager.onVmStarted();
        }
    }

    promptCloseVm() {
        const modalId = 'modal-vbox-close-vm';
        const html = `
            <div class="vbox-dialog vbox-close-dialog">
                <div class="vbox-dialog-titlebar">
                    <span class="vbox-dialog-title">Close Virtual Machine</span>
                    <button class="vbox-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="vbox-dialog-body">
                    <p>You are about to close virtual machine <b>${window.systemState.getState().vm.name}</b>.</p>
                    <div class="vbox-radio-group">
                        <label><input type="radio" name="vm-close-opt" value="save"> Save the machine state</label>
                        <label><input type="radio" name="vm-close-opt" value="shutdown"> Send the shutdown signal</label>
                        <label><input type="radio" name="vm-close-opt" value="poweroff" checked> Power off the machine</label>
                    </div>
                </div>
                <div class="vbox-dialog-footer">
                    <button class="vbox-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                    <button class="vbox-btn vbox-btn-primary" onclick="window.vboxManager.executeVmClose()">OK</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: 'Close Virtual Machine',
            html
        });
    }

    executeVmClose() {
        const checked = document.querySelector('input[name="vm-close-opt"]:checked')?.value || 'poweroff';
        const vmWindowEl = document.getElementById('vm-running-window');

        if (checked === 'save') {
            window.systemState.stopVM('saved');
        } else {
            window.systemState.stopVM('powerOff');
        }

        if (vmWindowEl) {
            vmWindowEl.style.display = 'none';
        }
        window.windowsManager.closeModal('modal-vbox-close-vm');
    }

    minimizeVmWindow() {
        const vmWindowEl = document.getElementById('vm-running-window');
        if (vmWindowEl) {
            vmWindowEl.classList.toggle('minimized');
        }
    }

    toggleMaximizeVmWindow() {
        const vmWindowEl = document.getElementById('vm-running-window');
        if (vmWindowEl) {
            vmWindowEl.classList.toggle('maximized');
        }
    }

    showVirtualBoxErrorModal(title, message) {
        window.windowsManager.showMsgBox({
            title: title || 'VirtualBox - Error',
            message: message,
            icon: 'error'
        });
    }

    showMenuDropdown(e, type) {
        // Simple realistic top menu interaction
        const rect = e.target.getBoundingClientRect();
        const menuItems = {
            file: ['Preferences... (Ctrl+G)', 'Import Appliance...', 'Export Appliance...', 'Virtual Media Manager... (Ctrl+D)', 'Exit (Ctrl+Q)'],
            machine: ['New... (Ctrl+N)', 'Add... (Ctrl+A)', 'Settings... (Ctrl+S)', 'Start', 'Pause', 'Reset', 'Close...'],
            help: ['Contents... (F1)', 'VirtualBox Web Site...', 'About VirtualBox...']
        };

        const existing = document.querySelector('.vbox-dropdown-menu');
        if (existing) existing.remove();

        const menuEl = document.createElement('div');
        menuEl.className = 'vbox-dropdown-menu';
        menuEl.style.top = `${rect.bottom}px`;
        menuEl.style.left = `${rect.left}px`;

        menuEl.innerHTML = (menuItems[type] || []).map(item => `
            <div class="vbox-menu-item" onclick="window.vboxManager.onMenuItemClick('${type}', '${item}')">${item}</div>
        `).join('');

        document.body.appendChild(menuEl);

        const dismiss = (ev) => {
            if (!menuEl.contains(ev.target) && ev.target !== e.target) {
                menuEl.remove();
                document.removeEventListener('click', dismiss);
            }
        };
        setTimeout(() => document.addEventListener('click', dismiss), 50);
    }

    onMenuItemClick(menuType, itemText) {
        document.querySelector('.vbox-dropdown-menu')?.remove();
        if (itemText.startsWith('New')) this.openNewVmModal();
        else if (itemText.startsWith('Settings')) this.openSettingsModal();
        else if (itemText.startsWith('Start')) this.handleStartVm();
        else if (itemText.startsWith('About')) {
            this.showVirtualBoxErrorModal("About VirtualBox (Simulated)", "Oracle VM VirtualBox Manager\nVersion 7.0.14 r161095 (Qt5.15.2)\n\nSimulated Environment for System Administration Laboratory.");
        }
    }

    showVmMachineMenu(e) {
        this.showVirtualBoxErrorModal("Machine Menu", "Available actions:\n- Pause (Host+P)\n- Reset (Host+R)\n- Close (Host+Q)");
    }

    showVmInputMenu(e) {
        // Allows inserting Ctrl+Alt+Del into the guest OS
        const modalId = 'modal-vbox-input-menu';
        const html = `
            <div class="vbox-dialog" style="width: 320px;">
                <div class="vbox-dialog-titlebar">
                    <span class="vbox-dialog-title">Input Menu</span>
                    <button class="vbox-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="vbox-dialog-body" style="padding: 10px;">
                    <button class="vbox-btn" style="width:100%; text-align:left; margin-bottom:8px;" onclick="window.windowsManager.sendCtrlAltDel(); window.windowsManager.closeModal('${modalId}');">
                        ⌨️ Insert Ctrl+Alt+Del (Host+Del)
                    </button>
                    <button class="vbox-btn" style="width:100%; text-align:left;" onclick="window.windowsManager.closeModal('${modalId}')">
                        🖱️ Mouse Integration: Enabled
                    </button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: 'Input Menu',
            html
        });
    }

    showVmDevicesMenu(e) {
        const state = window.systemState.getState();
        const modalId = 'modal-vbox-devices-menu';
        const html = `
            <div class="vbox-dialog" style="width: 360px;">
                <div class="vbox-dialog-titlebar">
                    <span class="vbox-dialog-title">Virtual Devices</span>
                    <button class="vbox-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="vbox-dialog-body" style="padding: 12px;">
                    <p><b>Optical Drives:</b></p>
                    <p>Current: <b>${state.vm.isoAttached || '[Empty]'}</b></p>
                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #ccc;">
                    <button class="vbox-btn" style="width:100%; margin-bottom:6px;" onclick="window.systemState.updateVMSettings({ isoAttached: 'Windows_Server_2022.iso' }); window.windowsManager.closeModal('${modalId}');">
                        💿 Mount Windows_Server_2022.iso
                    </button>
                    <button class="vbox-btn" style="width:100%;" onclick="window.systemState.updateVMSettings({ isoAttached: '' }); window.windowsManager.closeModal('${modalId}');">
                        ⏏️ Remove Disk From Virtual Drive
                    </button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: 'Virtual Devices',
            html
        });
    }
}

window.vboxManager = new VirtualBoxManager();
