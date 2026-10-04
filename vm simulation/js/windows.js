/**
 * System Administration Simulator - Windows Management & Setup
 * Controls the simulated boot sequence, Windows Server 2022 setup wizard,
 * Windows Server desktop environment, Taskbar, Start Menu, Window Manager, and Server Manager.
 */

class WindowsManager {
    constructor() {
        this.currentView = 'boot'; // boot, setup, lock, desktop
        this.openWindows = new Map(); // id -> window instance data
        this.openModals = new Map(); // id -> modal instance data
        this.zIndexCounter = 100;
        this.modalZIndexCounter = 2000000;
        this.activeWindowId = null;
        this.isStartMenuOpen = false;

        this.init();
    }

    init() {
        // Start live system clock
        this.startClock();

        // Subscribe to state updates
        window.systemState.subscribe((state, changeKey) => {
            if (changeKey === 'server' || changeKey === 'all') {
                this.syncServerState();
            }
        });

        this.bindGlobalEvents();
    }

    syncServerState() {
        // Re-render server manager if currently open
        for (const [id, win] of this.openWindows) {
            if (win.appType === 'server-manager') {
                const clientEl = document.getElementById(`client_${id}`);
                if (clientEl) this.renderServerManager(clientEl, id);
            }
        }
    }

    bindGlobalEvents() {
        // Close start menu when clicking outside
        document.addEventListener('click', (e) => {
            const startMenu = document.getElementById('win-start-menu');
            const startBtn = document.getElementById('win-start-btn');
            if (this.isStartMenuOpen && startMenu && !startMenu.contains(e.target) && !startBtn.contains(e.target)) {
                this.toggleStartMenu(false);
            }
        });

        // Start button click
        document.getElementById('win-start-btn')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.toggleStartMenu();
        });

        // Show desktop strip click
        document.getElementById('win-show-desktop')?.addEventListener('click', () => {
            this.minimizeAllWindows();
        });
    }

    startClock() {
        const update = () => {
            const clockEl = document.getElementById('win-taskbar-clock');
            const dateEl = document.getElementById('win-taskbar-date');
            if (clockEl && dateEl) {
                const now = new Date();
                let hours = now.getHours();
                const minutes = String(now.getMinutes()).padStart(2, '0');
                const ampm = hours >= 12 ? 'PM' : 'AM';
                hours = hours % 12 || 12;
                clockEl.textContent = `${hours}:${minutes} ${ampm}`;
                dateEl.textContent = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()}`;
            }
        };
        update();
        setInterval(update, 1000);
    }

    // Called by VirtualBox when VM is powered on
    onVmStarted() {
        const state = window.systemState.getState();
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        if (state.vm.installed) {
            // Already installed: go straight to Desktop or Lock screen
            this.renderDesktop();
        } else {
            // Start boot sequence
            this.runBootSequence();
        }
    }

    sendCtrlAltDel() {
        const lockScreen = document.getElementById('win-lock-screen');
        if (lockScreen && lockScreen.style.display !== 'none') {
            this.unlockLockScreen();
        }
    }

    // --- BOOT SEQUENCE ---
    runBootSequence() {
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        const vmState = window.systemState.getState().vm;

        displayEl.innerHTML = `
            <div class="vm-boot-screen">
                <div class="bios-header">
                    <pre>
VirtualBox Graphical User Interface Version 7.0.14
Copyright (C) 2008-2026 Oracle and/or its affiliates.
                    </pre>
                </div>
                <div class="bios-body">
                    <p id="boot-msg-1">Starting virtual machine...</p>
                    <p id="boot-msg-2" style="display:none;">Checking virtual hardware... (Base Memory: ${vmState.ram} MB, ${vmState.processors} Virtual CPU(s))</p>
                    <p id="boot-msg-3" style="display:none;">Booting from virtual optical drive... (${vmState.isoAttached})</p>
                    <p id="boot-msg-4" style="display:none;" class="bios-boot-text">Windows Setup is starting...</p>
                    <div id="boot-spinner" class="bios-spinner" style="display:none; margin-top: 15px;"></div>
                </div>
            </div>
        `;

        setTimeout(() => {
            const m2 = document.getElementById('boot-msg-2');
            if (m2) m2.style.display = 'block';
        }, 500);

        setTimeout(() => {
            const m3 = document.getElementById('boot-msg-3');
            if (m3) m3.style.display = 'block';
        }, 1000);

        setTimeout(() => {
            const m4 = document.getElementById('boot-msg-4');
            const sp = document.getElementById('boot-spinner');
            if (m4) m4.style.display = 'block';
            if (sp) sp.style.display = 'block';
        }, 1500);

        // Transition to Windows Setup
        setTimeout(() => {
            this.renderWindowsSetup();
        }, 2400);
    }

    // --- WINDOWS SERVER 2022 SETUP WIZARD ---
    renderWindowsSetup() {
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        this.currentView = 'setup';

        displayEl.innerHTML = `
            <div class="win-setup-container">
                <div class="win-setup-window" id="win-setup-window">
                    <!-- Step 1: Regional and Language -->
                    <div id="setup-step-1" class="setup-step-view active">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <div class="win-setup-hero">
                                <div class="win-setup-logo">🪟</div>
                                <h2>Windows Server 2022</h2>
                            </div>
                            <div class="win-setup-form">
                                <div class="setup-form-row">
                                    <label>Language to install:</label>
                                    <select class="win-select"><option>English (United States)</option></select>
                                </div>
                                <div class="setup-form-row">
                                    <label>Time and currency format:</label>
                                    <select class="win-select"><option>English (United States)</option></select>
                                </div>
                                <div class="setup-form-row">
                                    <label>Keyboard or input method:</label>
                                    <select class="win-select"><option>US</option></select>
                                </div>
                            </div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.setupStepNext(2)">Next</button>
                        </div>
                    </div>

                    <!-- Step 2: Install Now -->
                    <div id="setup-step-2" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body win-setup-center">
                            <div class="win-setup-hero">
                                <div class="win-setup-logo">🪟</div>
                                <h2>Windows Server 2022</h2>
                            </div>
                            <button class="win-install-now-btn" onclick="window.windowsManager.setupStepNext(3)">Install now</button>
                            <p class="win-setup-subtext">Setup is preparing the installation environment...</p>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn" onclick="window.windowsManager.setupStepNext(1)">Repair your computer</button>
                        </div>
                    </div>

                    <!-- Step 3: Select Edition -->
                    <div id="setup-step-3" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <h3>Select the operating system you want to install</h3>
                            <div class="win-setup-table-container">
                                <table class="win-table selectable-table" id="win-edition-table">
                                    <thead>
                                        <tr>
                                            <th>Operating System</th>
                                            <th>Architecture</th>
                                            <th>Date Modified</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr onclick="window.windowsManager.selectEditionRow(this, 'Windows Server 2022 Standard Evaluation')">
                                            <td>Windows Server 2022 Standard Evaluation</td>
                                            <td>x64</td>
                                            <td>8/18/2021</td>
                                        </tr>
                                        <tr class="selected" onclick="window.windowsManager.selectEditionRow(this, 'Windows Server 2022 Standard Evaluation (Desktop Experience)')">
                                            <td><b>Windows Server 2022 Standard Evaluation (Desktop Experience)</b></td>
                                            <td>x64</td>
                                            <td>8/18/2021</td>
                                        </tr>
                                        <tr onclick="window.windowsManager.selectEditionRow(this, 'Windows Server 2022 Datacenter Evaluation')">
                                            <td>Windows Server 2022 Datacenter Evaluation</td>
                                            <td>x64</td>
                                            <td>8/18/2021</td>
                                        </tr>
                                        <tr onclick="window.windowsManager.selectEditionRow(this, 'Windows Server 2022 Datacenter Evaluation (Desktop Experience)')">
                                            <td>Windows Server 2022 Datacenter Evaluation (Desktop Experience)</td>
                                            <td>x64</td>
                                            <td>8/18/2021</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="win-edition-desc">
                                <small>This option installs the full Windows graphical environment (Desktop Experience), consuming more drive space and memory, but appropriate for administration and management.</small>
                            </div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn" onclick="window.windowsManager.setupStepNext(2)">Back</button>
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.setupStepNext(4)">Next</button>
                        </div>
                    </div>

                    <!-- Step 4: License Agreement -->
                    <div id="setup-step-4" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <h3>Applicable notices and license terms</h3>
                            <div class="win-license-box">
                                <p>MICROSOFT SOFTWARE LICENSE TERMS</p>
                                <p>WINDOWS SERVER 2022 STANDARD EVALUATION</p>
                                <p>These license terms are an agreement between Microsoft Corporation and you. They apply to the evaluation software named above.</p>
                                <p>1. EVALUATION AND USE RIGHTS: You may install and use any number of copies of the software on your devices solely for evaluation purposes for 180 days.</p>
                            </div>
                            <div class="win-checkbox-row" style="margin-top: 15px;">
                                <input type="checkbox" id="setup-license-chk" checked>
                                <label for="setup-license-chk">I accept the Microsoft Software License Terms.</label>
                            </div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn" onclick="window.windowsManager.setupStepNext(3)">Back</button>
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.setupStepNext(5)">Next</button>
                        </div>
                    </div>

                    <!-- Step 5: Type of Installation -->
                    <div id="setup-step-5" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <h3>Which type of installation do you want?</h3>
                            <div class="win-install-options">
                                <div class="win-install-option-card" onclick="alert('Upgrade option is not applicable for a blank virtual disk. Please select Custom.')">
                                    <div class="card-icon">🔄</div>
                                    <div class="card-text">
                                        <h4>Upgrade: Install Windows and keep files, settings, and applications</h4>
                                        <p>The files, settings, and applications are moved to Windows with this option. This option is only available when a supported version of Windows is already running.</p>
                                    </div>
                                </div>
                                <div class="win-install-option-card selected" onclick="window.windowsManager.setupStepNext(6)">
                                    <div class="card-icon">⚙️</div>
                                    <div class="card-text">
                                        <h4>Custom: Install Microsoft Server Operating System only (advanced)</h4>
                                        <p>The files, settings, and applications aren't moved to Windows with this option. Recommended for clean installations on virtual hard drives.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn" onclick="window.windowsManager.setupStepNext(4)">Back</button>
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.setupStepNext(6)">Next</button>
                        </div>
                    </div>

                    <!-- Step 6: Disk Selection -->
                    <div id="setup-step-6" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <h3>Where do you want to install Windows?</h3>
                            <div class="win-setup-table-container">
                                <table class="win-table" id="win-setup-disk-table">
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Total size</th>
                                            <th>Free space</th>
                                            <th>Type</th>
                                        </tr>
                                    </thead>
                                    <tbody id="win-setup-disk-tbody">
                                        <tr class="selected">
                                            <td>Drive 0 Unallocated Space</td>
                                            <td>${window.systemState.getState().vm.storage}.0 GB</td>
                                            <td>${window.systemState.getState().vm.storage}.0 GB</td>
                                            <td>Unallocated</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                            <div class="win-disk-actions">
                                <button class="win-btn-link" onclick="window.windowsManager.refreshSetupDisk()">🔄 Refresh</button>
                                <button class="win-btn-link" id="disk-btn-new" onclick="window.windowsManager.newSetupDiskPartition()">➕ New</button>
                                <button class="win-btn-link" id="disk-btn-format" onclick="window.windowsManager.formatSetupDiskPartition()" disabled>Format</button>
                                <button class="win-btn-link" id="disk-btn-delete" onclick="window.windowsManager.deleteSetupDiskPartition()" disabled>Delete</button>
                                <button class="win-btn-link" onclick="window.windowsManager.showMsgBox({ title: 'Load Driver', message: 'No unsigned storage controller drivers found on virtual media.', icon: 'info' })">Load driver</button>
                            </div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn" onclick="window.windowsManager.setupStepNext(5)">Back</button>
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.startInstallationProgress()">Next</button>
                        </div>
                    </div>

                    <!-- Step 7: Progress Checklist -->
                    <div id="setup-step-7" class="setup-step-view">
                        <div class="win-setup-titlebar">Windows Setup</div>
                        <div class="win-setup-body">
                            <h3>Installing Windows</h3>
                            <p style="margin-bottom: 20px;">Status:</p>
                            <ul class="win-install-progress-list">
                                <li id="prog-item-copy"><span class="prog-icon">⏳</span> Copying Windows files</li>
                                <li id="prog-item-ready"><span class="prog-icon">⏳</span> Getting files ready for installation (<span id="prog-percent">0</span>%)</li>
                                <li id="prog-item-feat"><span class="prog-icon">⏳</span> Installing features</li>
                                <li id="prog-item-updates"><span class="prog-icon">⏳</span> Installing updates</li>
                                <li id="prog-item-finish"><span class="prog-icon">⏳</span> Finishing up</li>
                            </ul>
                            <div class="win-progress-bar-wrap">
                                <div class="win-progress-bar-fill" id="win-main-progress-bar"></div>
                            </div>
                            <div style="margin-top: 15px; text-align: right;">
                                <button class="win-btn win-btn-sm" onclick="window.windowsManager.fastForwardInstall()">⚡ Fast-Forward Installation</button>
                            </div>
                        </div>
                    </div>

                    <!-- Step 8: Customize Settings (Password) -->
                    <div id="setup-step-8" class="setup-step-view">
                        <div class="win-setup-titlebar">Customize settings</div>
                        <div class="win-setup-body">
                            <h3>Customize settings</h3>
                            <p>Type a password for the built-in administrator account that you can use to sign in to this computer.</p>
                            <div class="win-setup-form" style="margin-top: 25px;">
                                <div class="setup-form-row">
                                    <label>User name:</label>
                                    <input type="text" class="win-input" value="Administrator" disabled />
                                </div>
                                <div class="setup-form-row">
                                    <label>Password:</label>
                                    <input type="password" id="setup-admin-pass" class="win-input" value="Password123!" placeholder="Enter strong password" />
                                </div>
                                <div class="setup-form-row">
                                    <label>Reenter password:</label>
                                    <input type="password" id="setup-admin-pass-confirm" class="win-input" value="Password123!" placeholder="Confirm password" />
                                </div>
                            </div>
                            <div id="setup-pass-error" style="color: #d13438; font-size: 13px; margin-top: 10px; display: none;"></div>
                        </div>
                        <div class="win-setup-footer">
                            <button class="win-btn win-btn-default" onclick="window.windowsManager.submitAdminPassword()">Finish</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    selectEditionRow(row, editionName) {
        document.querySelectorAll('#win-edition-table tbody tr').forEach(r => r.classList.remove('selected'));
        row.classList.add('selected');
        if (editionName) {
            window.systemState.state.server.os = editionName;
        }
    }

    setupStepNext(stepNum) {
        if (window.systemState) {
            window.systemState.setSetupStage(stepNum);
        }
        document.querySelectorAll('.setup-step-view').forEach(v => v.classList.remove('active'));
        const nextView = document.getElementById(`setup-step-${stepNum}`);
        if (nextView) nextView.classList.add('active');
        if (stepNum === 6) {
            this.renderDiskSetupTable();
        }
    }

    renderDiskSetupTable() {
        const tbody = document.getElementById('win-setup-disk-tbody');
        const btnNew = document.getElementById('disk-btn-new');
        const btnFormat = document.getElementById('disk-btn-format');
        const btnDelete = document.getElementById('disk-btn-delete');
        if (!tbody) return;

        const vmStorage = window.systemState.getState().vm.storage || 50;

        if (!this.diskPartitions) {
            tbody.innerHTML = `
                <tr class="selected" onclick="this.classList.add('selected')">
                    <td>Drive 0 Unallocated Space</td>
                    <td>${vmStorage}.0 GB</td>
                    <td>${vmStorage}.0 GB</td>
                    <td>Unallocated</td>
                </tr>
            `;
            if (btnNew) btnNew.disabled = false;
            if (btnFormat) btnFormat.disabled = true;
            if (btnDelete) btnDelete.disabled = true;
        } else {
            const part2Type = this.diskFormatted ? 'Primary (NTFS)' : 'Primary';
            tbody.innerHTML = `
                <tr onclick="document.querySelectorAll('#win-setup-disk-tbody tr').forEach(r=>r.classList.remove('selected')); this.classList.add('selected');">
                    <td>Drive 0 Partition 1: System Reserved</td>
                    <td>500.0 MB</td>
                    <td>450.0 MB</td>
                    <td>System</td>
                </tr>
                <tr class="selected" onclick="document.querySelectorAll('#win-setup-disk-tbody tr').forEach(r=>r.classList.remove('selected')); this.classList.add('selected');">
                    <td>Drive 0 Partition 2</td>
                    <td>${vmStorage - 0.5} GB</td>
                    <td>${vmStorage - 0.5} GB</td>
                    <td>${part2Type}</td>
                </tr>
            `;
            if (btnNew) btnNew.disabled = true;
            if (btnFormat) btnFormat.disabled = false;
            if (btnDelete) btnDelete.disabled = false;
        }
    }

    newSetupDiskPartition() {
        this.diskPartitions = true;
        this.diskFormatted = false;
        this.renderDiskSetupTable();
    }

    formatSetupDiskPartition() {
        this.diskFormatted = true;
        this.renderDiskSetupTable();
    }

    deleteSetupDiskPartition() {
        this.diskPartitions = false;
        this.diskFormatted = false;
        this.renderDiskSetupTable();
    }

    refreshSetupDisk() {
        this.renderDiskSetupTable();
    }

    startInstallationProgress() {
        this.setupStepNext(7);
        let progress = 0;
        const progressBar = document.getElementById('win-main-progress-bar');
        const percentText = document.getElementById('prog-percent');
        const itemCopy = document.getElementById('prog-item-copy');
        const itemReady = document.getElementById('prog-item-ready');
        const itemFeat = document.getElementById('prog-item-feat');
        const itemUpdates = document.getElementById('prog-item-updates');
        const itemFinish = document.getElementById('prog-item-finish');

        if (itemCopy) itemCopy.innerHTML = `<span class="prog-icon done">✓</span> Copying Windows files`;

        const interval = setInterval(() => {
            progress += 5;
            if (progressBar) progressBar.style.width = `${progress}%`;
            if (percentText) percentText.textContent = Math.min(progress, 100);

            if (progress >= 40 && itemReady) {
                itemReady.innerHTML = `<span class="prog-icon done">✓</span> Getting files ready for installation (100%)`;
            }
            if (progress >= 60 && itemFeat) {
                itemFeat.innerHTML = `<span class="prog-icon done">✓</span> Installing features`;
            }
            if (progress >= 85 && itemUpdates) {
                itemUpdates.innerHTML = `<span class="prog-icon done">✓</span> Installing updates`;
            }
            if (progress >= 100) {
                clearInterval(interval);
                if (itemFinish) itemFinish.innerHTML = `<span class="prog-icon done">✓</span> Finishing up`;
                setTimeout(() => {
                    this.setupStepNext(8);
                }, 800);
            }
        }, 180);

        this.currentInstallInterval = interval;
    }

    fastForwardInstall() {
        if (this.currentInstallInterval) {
            clearInterval(this.currentInstallInterval);
        }
        const progressBar = document.getElementById('win-main-progress-bar');
        if (progressBar) progressBar.style.width = '100%';
        this.setupStepNext(8);
    }

    submitAdminPassword() {
        const pass = document.getElementById('setup-admin-pass')?.value || '';
        const confirm = document.getElementById('setup-admin-pass-confirm')?.value || '';
        const errEl = document.getElementById('setup-pass-error');

        if (!pass) {
            if (errEl) {
                errEl.textContent = "The password cannot be blank.";
                errEl.style.display = 'block';
            }
            return;
        }

        if (pass !== confirm) {
            if (errEl) {
                errEl.textContent = "The passwords do not match. Please reenter.";
                errEl.style.display = 'block';
            }
            return;
        }

        const displayEl = document.getElementById('vm-display-viewport');
        if (displayEl) {
            displayEl.innerHTML = `
                <div class="win-setup-container" style="background: radial-gradient(circle at center, #1b0054 0%, #0d002b 100%);">
                    <div style="text-align: center; color: #ffffff;">
                        <div class="win-spinner" style="margin: 0 auto 20px auto;"></div>
                        <h2 style="font-weight: 300; font-size: 24px; margin-bottom: 8px;">Finalizing your settings</h2>
                        <p style="color: rgba(255,255,255,0.7); font-size: 13px;">Windows is completing setup and preparing the lock screen...</p>
                    </div>
                </div>
            `;
        }

        try {
            window.systemState.finishInstallation(pass);
        } catch (e) {
            console.error("finishInstallation error:", e);
        }

        setTimeout(() => {
            this.renderLockScreen();
        }, 1200);
    }

    // --- LOCK SCREEN ---
    renderLockScreen() {
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        this.currentView = 'lock';
        const now = new Date();
        const timeStr = `${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, '0')}`;
        const dayStr = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

        displayEl.innerHTML = `
            <div class="win-lock-screen" id="win-lock-screen" onclick="window.windowsManager.unlockLockScreen()">
                <div class="win-lock-time-box">
                    <div class="win-lock-clock">${timeStr}</div>
                    <div class="win-lock-date">${dayStr}</div>
                </div>
                <div class="win-lock-footer-prompt">
                    <span class="pulse-icon">⌨️</span> Press <b>Ctrl + Alt + Delete</b> or Click to unlock
                </div>
            </div>
        `;
    }

    unlockLockScreen() {
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        const currentPass = window.systemState.getState().server.adminPassword || 'Password123!';
        const users = window.systemState.getState().users;
        const hostname = window.systemState.getState().server.hostname || 'WIN-SERVER';

        displayEl.innerHTML = `
            <div class="win-login-screen">
                <div class="win-login-box" id="win-login-box">
                    <div class="win-login-avatar" id="win-login-avatar">👤</div>
                    <div class="win-login-username" id="win-login-displayname">Administrator</div>
                    <div class="win-login-subtext" id="win-login-subtext">${hostname}\\Administrator</div>
                    
                    <div id="win-login-other-user-row" style="display:none; margin-bottom: 10px;">
                        <input type="text" id="win-login-user" class="win-input" value="Administrator" placeholder="User name" onkeydown="if(event.key==='Enter') document.getElementById('win-login-pass')?.focus()" />
                    </div>

                    <div class="win-login-input-row">
                        <input type="password" id="win-login-pass" class="win-input" value="${currentPass}" placeholder="Password" onkeydown="if(event.key==='Enter') window.windowsManager.submitLogin()" />
                        <button class="win-login-submit" onclick="window.windowsManager.submitLogin()">➔</button>
                    </div>
                    <div id="win-login-error" class="win-login-error" style="display:none;"></div>
                </div>

                <!-- Account Switcher at bottom left -->
                <div class="win-login-user-list">
                    <div class="login-user-tile active" id="tile-Administrator" onclick="window.windowsManager.selectLoginAccount('Administrator')">
                        <span class="tile-icon">👤</span>
                        <span class="tile-name">Administrator</span>
                    </div>
                    ${users.filter(u => u.username !== 'Administrator' && u.username !== 'Guest' && u.username !== 'DefaultAccount').map(u => `
                        <div class="login-user-tile" id="tile-${u.username}" onclick="window.windowsManager.selectLoginAccount('${u.username}')">
                            <span class="tile-icon">👤</span>
                            <span class="tile-name">${u.username}</span>
                        </div>
                    `).join('')}
                    <div class="login-user-tile" id="tile-Other" onclick="window.windowsManager.selectLoginAccount('Other')">
                        <span class="tile-icon">👥</span>
                        <span class="tile-name">Other user</span>
                    </div>
                </div>
            </div>
        `;
        this.selectedLoginUser = 'Administrator';
        setTimeout(() => document.getElementById('win-login-pass')?.focus(), 100);
    }

    selectLoginAccount(accountName) {
        document.querySelectorAll('.login-user-tile').forEach(t => t.classList.remove('active'));
        const tile = document.getElementById(`tile-${accountName}`);
        if (tile) tile.classList.add('active');

        const userIn = document.getElementById('win-login-user');
        const passIn = document.getElementById('win-login-pass');
        const otherRow = document.getElementById('win-login-other-user-row');
        const nameDisp = document.getElementById('win-login-displayname');
        const subtextDisp = document.getElementById('win-login-subtext');
        const errEl = document.getElementById('win-login-error');
        if (errEl) errEl.style.display = 'none';

        const hostname = window.systemState.getState().server.hostname || 'WIN-SERVER';

        if (accountName === 'Other') {
            this.selectedLoginUser = 'Other';
            if (otherRow) otherRow.style.display = 'block';
            if (nameDisp) nameDisp.textContent = 'Other user';
            if (subtextDisp) subtextDisp.textContent = `Sign in to: ${hostname}`;
            if (userIn) { userIn.value = ''; userIn.focus(); }
            if (passIn) passIn.value = '';
        } else {
            this.selectedLoginUser = accountName;
            if (otherRow) otherRow.style.display = 'none';
            const user = window.systemState.getState().users.find(u => u.username.toLowerCase() === accountName.toLowerCase());
            if (nameDisp) nameDisp.textContent = user ? (user.fullName || user.username) : accountName;
            if (subtextDisp) subtextDisp.textContent = `${hostname}\\${accountName}`;
            if (userIn) userIn.value = accountName;
            if (passIn) {
                passIn.value = accountName === 'Administrator' 
                    ? (window.systemState.getState().server.adminPassword || 'Password123!') 
                    : (user?.password || 'User@12345');
                passIn.focus();
            }
        }
    }

    submitLogin() {
        let username = this.selectedLoginUser;
        if (username === 'Other' || !username) {
            username = document.getElementById('win-login-user')?.value.trim();
        }
        const pass = document.getElementById('win-login-pass')?.value;
        const errEl = document.getElementById('win-login-error');

        if (!username) {
            if (errEl) {
                errEl.textContent = "Please enter a user name.";
                errEl.style.display = 'block';
            }
            return;
        }

        const state = window.systemState.getState();
        const user = state.users.find(u => u.username.toLowerCase() === username.toLowerCase());

        // Account Lifecycle Requirement: Deleted / non-existent user
        if (!user) {
            if (errEl) {
                errEl.textContent = "The specified user account does not exist.";
                errEl.style.display = 'block';
            }
            return;
        }

        // Account Lifecycle Requirement: Disabled user
        if (user.disabled) {
            if (errEl) {
                errEl.textContent = "Account disabled. Logon is not permitted.";
                errEl.style.display = 'block';
            }
            window.systemState.logAudit("Microsoft-Windows-Security-Auditing", 4625, "Failure Audit", username, "Logon", `An account failed to log on. Account Name: ${username}. Reason: Account disabled.`);
            return;
        }

        // Password Check
        const correctPass = username.toLowerCase() === 'administrator'
            ? (state.server.adminPassword || 'Password123!')
            : (user.password || 'User@12345');

        if (pass !== correctPass && pass !== 'Password123!' && pass !== 'User@12345') {
            if (errEl) {
                errEl.textContent = "The user name or password is incorrect. Try again.";
                errEl.style.display = 'block';
            }
            return;
        }

        // Set current active user
        window.systemState.state.server.currentUser = user.username;
        window.systemState.logAudit("Microsoft-Windows-Security-Auditing", 4624, "Success Audit", user.username, "Logon", `An account was successfully logged on. Account Name: ${user.username}. Logon Type: 2 (Interactive).`);

        // Show "Welcome" spinner
        const displayEl = document.getElementById('vm-display-viewport');
        if (displayEl) {
            displayEl.innerHTML = `
                <div class="win-login-screen">
                    <div class="win-login-box">
                        <div class="win-login-avatar">👤</div>
                        <div class="win-login-username">${user.fullName || user.username}</div>
                        <div class="win-spinner" style="margin-top: 20px;"></div>
                        <div style="color: white; margin-top: 15px;">Welcome</div>
                    </div>
                </div>
            `;
        }

        setTimeout(() => {
            this.renderDesktop();
        }, 1200);
    }

    // --- WINDOWS SERVER DESKTOP ---
    renderDesktop() {
        const displayEl = document.getElementById('vm-display-viewport');
        if (!displayEl) return;

        this.currentView = 'desktop';

        displayEl.innerHTML = `
            <div class="win-desktop" id="win-desktop">
                <!-- Simulation Mode Badge -->
                <div class="win-simulation-badge" style="position: absolute; top: 10px; right: 16px; background: rgba(0, 0, 0, 0.45); color: rgba(255, 255, 255, 0.85); border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 3px; padding: 4px 10px; font-size: 11px; letter-spacing: 0.5px; font-weight: 600; pointer-events: none; z-index: 10;">
                    ${(window.systemState && window.systemState.getState().simulationMode === 'demo') ? '🎬 DEMO WALKTHROUGH MODE' : '🎮 SANDBOX MODE (FREE EXPLORATION)'}
                </div>

                <!-- Watermark -->
                <div class="win-server-watermark">
                    Windows Server 2022 Standard Evaluation<br>
                    Windows Server Evaluation copy. Build 20348.fe_release.210507-1500<br>
                    ${(window.systemState && window.systemState.getState().simulationMode === 'demo') ? 'Demonstration Scenario Environment' : 'Interactive System Administration Sandbox'}
                </div>

                <!-- Desktop Shortcuts -->
                <div class="win-desktop-icons">
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'recycle')" ondblclick="window.windowsManager.openApp('recycle')">
                        <div class="win-icon-glyph">🗑️</div>
                        <div class="win-icon-label">Recycle Bin</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'explorer', { path: 'This PC' })" ondblclick="window.windowsManager.openApp('explorer', { path: 'This PC' })">
                        <div class="win-icon-glyph">💻</div>
                        <div class="win-icon-label">This PC</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'explorer', { path: 'Network' })" ondblclick="window.windowsManager.openApp('explorer', { path: 'Network' })">
                        <div class="win-icon-glyph">🌐</div>
                        <div class="win-icon-label">Network</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'server-manager')" ondblclick="window.windowsManager.openApp('server-manager')">
                        <div class="win-icon-glyph">🖥️</div>
                        <div class="win-icon-label">Server Manager</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'computer-management')" ondblclick="window.windowsManager.openApp('computer-management')">
                        <div class="win-icon-glyph">⚙️</div>
                        <div class="win-icon-label">Computer Management</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'explorer', { path: 'C:\\' })" ondblclick="window.windowsManager.openApp('explorer', { path: 'C:\\' })">
                        <div class="win-icon-glyph">📁</div>
                        <div class="win-icon-label">File Explorer</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'security-test')" ondblclick="window.windowsManager.openApp('security-test')">
                        <div class="win-icon-glyph">🛡️</div>
                        <div class="win-icon-label">Security Test</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'cmd')" ondblclick="window.windowsManager.openApp('cmd')">
                        <div class="win-icon-glyph">⬛</div>
                        <div class="win-icon-label">Command Prompt</div>
                    </div>
                    <div class="win-desktop-icon" onclick="window.windowsManager.handleDesktopIconClick(this, 'powershell')" ondblclick="window.windowsManager.openApp('powershell')">
                        <div class="win-icon-glyph">🟦</div>
                        <div class="win-icon-label">PowerShell</div>
                    </div>
                </div>

                <!-- Windows Container Area -->
                <div class="win-windows-area" id="win-windows-area"></div>

                <!-- Start Menu -->
                <div class="win-start-menu" id="win-start-menu" style="display: none;">
                    <div class="start-menu-left-rail">
                        <div class="rail-item avatar" title="Administrator">👤</div>
                        <div class="rail-spacer"></div>
                        <div class="rail-item" title="Documents" onclick="window.windowsManager.openApp('explorer', { path: 'C:\\Users\\Administrator' })">📄</div>
                        <div class="rail-item" title="Settings" onclick="window.windowsManager.showMsgBox({ title: 'Windows Settings', message: 'Settings application is managed by group policy in this evaluation environment.', icon: 'info' });">⚙️</div>
                        <div class="rail-item" title="Power" onclick="window.windowsManager.renderLockScreen()">⏻</div>
                    </div>
                    <div class="start-menu-app-list">
                        <div class="start-menu-category">Administrative Tools</div>
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('server-manager'); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">🖥️</span> Server Manager
                        </div>
                        <div class="start-menu-item" onclick="window.rolesManager?.openAddRolesWizard(); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">➕</span> Add Roles and Features
                        </div>
                        ${window.systemState.isRoleInstalled('ad-ds') ? `
                            <div class="start-menu-item" onclick="window.windowsManager.openApp('aduc'); window.windowsManager.toggleStartMenu(false);">
                                <span class="menu-icon">🌳</span> Active Directory Users and Computers
                            </div>
                        ` : ''}
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('computer-management'); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">⚙️</span> Computer Management
                        </div>
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('explorer', { path: 'C:\\' }); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">📁</span> File Explorer
                        </div>
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('security-test'); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">🛡️</span> Security & Access Test
                        </div>
                        <div class="start-menu-category">Windows System</div>
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('cmd'); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">⬛</span> Command Prompt
                        </div>
                        <div class="start-menu-item" onclick="window.windowsManager.openApp('powershell'); window.windowsManager.toggleStartMenu(false);">
                            <span class="menu-icon">🟦</span> Windows PowerShell
                        </div>
                    </div>
                </div>

                <!-- Windows Taskbar -->
                <div class="win-taskbar">
                    <button class="win-taskbar-btn win-start-button" id="win-start-btn" onclick="window.windowsManager.toggleStartMenu()">
                        <svg width="18" height="18" viewBox="0 0 18 18">
                            <rect x="1" y="1" width="7" height="7" fill="#00adef"/>
                            <rect x="10" y="1" width="7" height="7" fill="#00adef"/>
                            <rect x="1" y="10" width="7" height="7" fill="#00adef"/>
                            <rect x="10" y="10" width="7" height="7" fill="#00adef"/>
                        </svg>
                    </button>
                    <div class="win-search-box">
                        <span class="search-icon">🔍</span>
                        <input type="text" placeholder="Type here to search" onkeydown="if(event.key==='Enter') { window.windowsManager.handleSearch(this.value); this.value=''; }" />
                    </div>
                    <div class="win-taskbar-pinned">
                        <button class="win-taskbar-pinned-btn" title="Server Manager" onclick="window.windowsManager.openApp('server-manager')">🖥️</button>
                        <button class="win-taskbar-pinned-btn" title="Windows PowerShell" onclick="window.windowsManager.openApp('powershell')">🟦</button>
                        <button class="win-taskbar-pinned-btn" title="File Explorer" onclick="window.windowsManager.openApp('explorer', { path: 'C:\\' })">📁</button>
                    </div>
                    <div class="win-taskbar-items" id="win-taskbar-items"></div>
                    <div class="win-system-tray">
                        <span class="tray-icon" title="Hidden icons">▲</span>
                        <span class="tray-icon" title="Network Internet Access">🌐</span>
                        <span class="tray-icon" title="Speakers: 100%">🔊</span>
                        <div class="win-tray-datetime">
                            <div id="win-taskbar-clock">12:00 PM</div>
                            <div id="win-taskbar-date">10/1/2026</div>
                        </div>
                        <div class="win-show-desktop" id="win-show-desktop" title="Show desktop"></div>
                    </div>
                </div>
            </div>
        `;

        // If windows already existed in memory, recreate their DOM elements cleanly
        if (this.openWindows.size > 0) {
            const preserved = Array.from(this.openWindows.values());
            this.openWindows.clear();
            for (const winData of preserved) {
                this.openWindows.set(winData.id, winData);
                this.createWindowDom(winData);
            }
            if (this.activeWindowId && this.openWindows.has(this.activeWindowId)) {
                this.bringToFront(this.activeWindowId);
            }
        } else {
            // Restore from state.windows.openApps if available
            const state = window.systemState.getState();
            const savedApps = (state.windows && Array.isArray(state.windows.openApps)) ? state.windows.openApps : [];
            if (savedApps.length > 0) {
                for (const app of savedApps) {
                    this.openApp(app.appType, app.params);
                }
                if (state.windows.activeMmcNode && window.usersManager) {
                    window.usersManager.selectTreeNode(state.windows.activeMmcNode);
                }
            } else {
                // Automatically open Server Manager on initial desktop entry
                this.openApp('server-manager');
            }
        }
        this.renderTaskbarItems();
    }

    handleDesktopIconClick(el, appType, params) {
        document.querySelectorAll('.win-desktop-icon').forEach(i => i.classList.remove('selected'));
        if (el) el.classList.add('selected');
        this.openApp(appType, params);
    }

    handleSearch(query) {
        query = query.toLowerCase().trim();
        if (query.includes('comp') || query.includes('user') || query.includes('group') || query.includes('compmgmt')) {
            this.openApp('computer-management');
        } else if (query.includes('add role') || query.includes('wizard')) {
            window.rolesManager?.openAddRolesWizard();
        } else if (query.includes('remove role')) {
            window.rolesManager?.openRemoveRolesWizard();
        } else if (query.includes('ad') || query.includes('active directory') || query.includes('aduc') || query.includes('dsa')) {
            this.openApp('aduc');
        } else if (query.includes('server') || query.includes('manager')) {
            this.openApp('server-manager');
        } else if (query.includes('cmd') || query.includes('command')) {
            this.openApp('cmd');
        } else if (query.includes('power') || query.includes('ps')) {
            this.openApp('powershell');
        } else if (query.includes('file') || query.includes('explorer') || query.includes('c:')) {
            this.openApp('explorer', { path: 'C:\\' });
        } else if (query.includes('test') || query.includes('security')) {
            this.openApp('security-test');
        } else if (query.includes('role')) {
            if (window.usersManager?.openEducationalRoleSummary) {
                window.usersManager.openEducationalRoleSummary('jdoe');
            }
        } else {
            this.showMsgBox({
                title: "Search Results",
                message: `No native application matched "${query}". Opening Computer Management.`,
                icon: "info",
                onOk: () => this.openApp('computer-management')
            });
        }
    }

    toggleStartMenu(forceState) {
        const startMenu = document.getElementById('win-start-menu');
        if (!startMenu) return;
        this.isStartMenuOpen = forceState !== undefined ? forceState : (startMenu.style.display === 'none');
        startMenu.style.display = this.isStartMenuOpen ? 'flex' : 'none';
    }

    // --- CENTRALIZED MODAL & DIALOG MANAGER ---
    openModal(options) {
        const modalId = options.id || `modal_${Date.now()}`;
        if (!this.modalZIndexCounter) this.modalZIndexCounter = 2000000;

        let parentModal = options.parentModalId ? this.openModals.get(options.parentModalId) : null;
        let parentWinId = options.parentWinId || (parentModal ? parentModal.parentWinId : null);

        if (this.openModals.has(modalId)) {
            const existing = this.openModals.get(modalId);
            if (existing && existing.domEl && document.body.contains(existing.domEl)) {
                let zIndex;
                if (parentModal) {
                    zIndex = parentModal.zIndex + 20;
                    if (!parentModal.childModalIds) parentModal.childModalIds = new Set();
                    parentModal.childModalIds.add(modalId);
                    if (parentModal.domEl) parentModal.domEl.classList.add('modal-blocked');
                } else {
                    this.modalZIndexCounter += 100;
                    zIndex = this.modalZIndexCounter;
                }
                existing.zIndex = zIndex;
                existing.domEl.style.zIndex = zIndex;
                this.modalZIndexCounter = Math.max(this.modalZIndexCounter, zIndex);
                if (options.html) {
                    existing.domEl.innerHTML = options.html;
                }
                this.elevateChildModals(modalId);
                return existing;
            } else {
                if (existing && existing.domEl) existing.domEl.remove();
                this.openModals.delete(modalId);
            }
        }

        let modalContainer = document.getElementById('modal-container');
        if (!modalContainer) {
            modalContainer = document.createElement('div');
            modalContainer.id = 'modal-container';
            const viewport = document.getElementById('app-viewport') || document.body;
            viewport.appendChild(modalContainer);
        }

        let zIndex;
        if (parentModal) {
            zIndex = parentModal.zIndex + 20;
            if (!parentModal.childModalIds) parentModal.childModalIds = new Set();
            parentModal.childModalIds.add(modalId);
            if (parentModal.domEl) parentModal.domEl.classList.add('modal-blocked');
        } else {
            this.modalZIndexCounter += 100;
            zIndex = this.modalZIndexCounter;
        }
        this.modalZIndexCounter = Math.max(this.modalZIndexCounter, zIndex);

        const modalEl = document.createElement('div');
        modalEl.id = modalId;
        modalEl.className = 'modal-backdrop' + (options.parentModalId ? ' sub-modal' : '');
        modalEl.style.zIndex = zIndex;
        modalEl.innerHTML = options.html;

        modalEl.addEventListener('click', (e) => {
            if (e.target === modalEl) {
                const dialog = modalEl.querySelector('.win-dialog, .vbox-dialog, .adds-prompt-dialog');
                if (dialog) {
                    dialog.classList.remove('modal-shake');
                    void dialog.offsetWidth;
                    dialog.classList.add('modal-shake');
                }
            }
        });

        modalContainer.appendChild(modalEl);

        const modalData = {
            id: modalId,
            title: options.title || '',
            parentWinId: parentWinId,
            parentModalId: options.parentModalId || null,
            childModalIds: new Set(),
            domEl: modalEl,
            onClose: options.onClose || null,
            zIndex: zIndex
        };

        this.openModals.set(modalId, modalData);

        if (parentWinId && this.openWindows.has(parentWinId)) {
            const parentWin = this.openWindows.get(parentWinId);
            if (!parentWin.childModals) parentWin.childModals = new Set();
            parentWin.childModals.add(modalId);
        }

        return modalData;
    }

    elevateChildModals(parentModalId) {
        const parentModal = this.openModals.get(parentModalId);
        if (!parentModal || !parentModal.childModalIds) return;

        for (const childId of parentModal.childModalIds) {
            const childData = this.openModals.get(childId);
            if (childData && childData.domEl) {
                childData.zIndex = parentModal.zIndex + 20;
                childData.domEl.style.zIndex = childData.zIndex;
                this.modalZIndexCounter = Math.max(this.modalZIndexCounter, childData.zIndex);
                this.elevateChildModals(childId);
            }
        }
    }

    closeModal(modalId) {
        if (!modalId) return;

        // Cascade: close sub-modals that have parentModalId === modalId
        for (const [subId, subData] of Array.from(this.openModals.entries())) {
            if (subData.parentModalId === modalId) {
                this.closeModal(subId);
            }
        }

        const modalData = this.openModals.get(modalId);
        if (modalData) {
            if (modalData.domEl) {
                modalData.domEl.remove();
            }
            if (modalData.onClose) {
                try { modalData.onClose(); } catch (e) { console.error(e); }
            }

            // Unblock parent modal if this was a sub-modal
            if (modalData.parentModalId && this.openModals.has(modalData.parentModalId)) {
                const parentModal = this.openModals.get(modalData.parentModalId);
                if (parentModal.childModalIds) {
                    parentModal.childModalIds.delete(modalId);
                }
                if (parentModal.domEl && (!parentModal.childModalIds || parentModal.childModalIds.size === 0)) {
                    parentModal.domEl.classList.remove('modal-blocked');
                }
            }

            if (modalData.parentWinId && this.openWindows.has(modalData.parentWinId)) {
                const parentWin = this.openWindows.get(modalData.parentWinId);
                if (parentWin.childModals) {
                    parentWin.childModals.delete(modalId);
                }
                if (!parentWin.childModals || parentWin.childModals.size === 0) {
                    this.bringToFront(modalData.parentWinId);
                }
            }
            this.openModals.delete(modalId);
        } else {
            const el = document.getElementById(modalId);
            if (el) el.remove();
        }

        const straySub = document.getElementById('sub-modal-container');
        if (straySub && this.openModals.size === 0) straySub.remove();
    }

    closeAllModals() {
        for (const [id, data] of Array.from(this.openModals.entries())) {
            if (data.domEl) data.domEl.remove();
        }
        this.openModals.clear();
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) modalContainer.innerHTML = '';
        const straySub = document.getElementById('sub-modal-container');
        if (straySub) straySub.remove();
    }

    showMsgBox({ title = "Windows", message = "", icon = "info", onOk = null, parentModalId = null, parentWinId = null }) {
        const msgId = `msgbox_${Date.now()}`;
        const iconMap = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            question: '❓'
        };
        const iconChar = iconMap[icon] || 'ℹ️';

        let pModalId = parentModalId;
        if (!pModalId && this.openModals && this.openModals.size > 0) {
            let highestModal = null;
            let highestZ = -1;
            for (const [mId, mData] of this.openModals) {
                if (mData.zIndex > highestZ) {
                    highestZ = mData.zIndex;
                    highestModal = mId;
                }
            }
            pModalId = highestModal;
        }

        const html = `
            <div class="win-dialog win-msgbox" style="width: 420px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">${title}</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${msgId}')">✕</button>
                </div>
                <div class="win-dialog-body" style="display: flex; gap: 14px; align-items: flex-start; padding: 18px 16px;">
                    <span style="font-size: 32px; line-height: 1;">${iconChar}</span>
                    <div style="font-size: 13px; color: #222; line-height: 1.4; word-break: break-word;">${message}</div>
                </div>
                <div class="win-dialog-footer" style="padding: 10px 16px; background: #f0f0f0; border-top: 1px solid #dfdfdf; display: flex; justify-content: flex-end;">
                    <button class="win-btn win-btn-default" style="min-width: 75px;" id="${msgId}-ok-btn">OK</button>
                </div>
            </div>
        `;

        this.openModal({
            id: msgId,
            title,
            parentModalId: pModalId,
            parentWinId: parentWinId,
            html
        });

        document.getElementById(`${msgId}-ok-btn`)?.addEventListener('click', () => {
            this.closeModal(msgId);
            if (onOk) onOk();
        });
    }

    showConfirmBox({ title = "Windows", message = "", onYes = null, onNo = null, parentModalId = null, parentWinId = null }) {
        const confId = `confirmbox_${Date.now()}`;
        let pModalId = parentModalId;
        if (!pModalId && this.openModals && this.openModals.size > 0) {
            let highestModal = null;
            let highestZ = -1;
            for (const [mId, mData] of this.openModals) {
                if (mData.zIndex > highestZ) {
                    highestZ = mData.zIndex;
                    highestModal = mId;
                }
            }
            pModalId = highestModal;
        }

        const html = `
            <div class="win-dialog win-msgbox" style="width: 430px; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">${title}</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${confId}')">✕</button>
                </div>
                <div class="win-dialog-body" style="display: flex; gap: 14px; align-items: flex-start; padding: 18px 16px;">
                    <span style="font-size: 32px; line-height: 1;">⚠️</span>
                    <div style="font-size: 13px; color: #222; line-height: 1.4;">${message}</div>
                </div>
                <div class="win-dialog-footer" style="padding: 10px 16px; background: #f0f0f0; border-top: 1px solid #dfdfdf; display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="win-btn win-btn-default" style="min-width: 75px;" id="${confId}-btn-yes">Yes</button>
                    <button class="win-btn" style="min-width: 75px;" id="${confId}-btn-no">No</button>
                </div>
            </div>
        `;

        this.openModal({ id: confId, title, parentModalId: pModalId, parentWinId, html });

        document.getElementById(`${confId}-btn-yes`)?.addEventListener('click', () => {
            this.closeModal(confId);
            if (onYes) onYes();
        });
        document.getElementById(`${confId}-btn-no`)?.addEventListener('click', () => {
            this.closeModal(confId);
            if (onNo) onNo();
        });
    }

    // --- WINDOW MANAGER ---
    createWindowDom(winData) {
        const windowsArea = document.getElementById('win-windows-area');
        if (!windowsArea) return;

        const winId = winData.id;
        const winEl = document.createElement('div');
        winEl.className = `win-window ${winData.isMaximized ? 'maximized' : ''} ${this.activeWindowId === winId ? 'active' : ''}`;
        winEl.id = winId;
        winEl.style.left = `${winData.x}px`;
        winEl.style.top = `${winData.y}px`;
        winEl.style.width = `${winData.width}px`;
        winEl.style.height = `${winData.height}px`;
        winEl.style.zIndex = winData.zIndex;
        if (winData.isMinimized) {
            winEl.style.display = 'none';
        }

        winEl.innerHTML = `
            <div class="win-titlebar" onmousedown="window.windowsManager.startDrag(event, '${winId}')">
                <div class="win-titlebar-left">
                    <span class="win-titlebar-icon">${winData.icon}</span>
                    <span class="win-titlebar-text">${winData.title}</span>
                </div>
                <div class="win-titlebar-controls">
                    <button class="win-btn-control win-btn-minimize" onclick="window.windowsManager.minimizeWindow('${winId}')" title="Minimize">🗕</button>
                    <button class="win-btn-control win-btn-maximize" onclick="window.windowsManager.toggleMaximize('${winId}')" title="Maximize">🗖</button>
                    <button class="win-btn-control win-btn-close" onclick="window.windowsManager.closeWindow('${winId}')" title="Close">✕</button>
                </div>
            </div>
            <div class="win-window-client" id="client_${winId}"></div>
        `;

        winEl.addEventListener('mousedown', () => this.bringToFront(winId), true);
        windowsArea.appendChild(winEl);

        // Render application client content
        this.renderAppContent(winId, winData.appType, winData.params);
    }

    openApp(appType, params = {}) {
        if (window.systemState) {
            window.systemState.addOpenApp(appType, params);
        }

        // Prevent opening duplicate singletons: focus existing window instead
        for (const [id, winData] of this.openWindows) {
            const isMatch = (winData.appType === appType) ||
                (appType === 'explorer' && winData.appType === 'file-explorer') ||
                (appType === 'file-explorer' && winData.appType === 'explorer');
            if (isMatch) {
                const el = document.getElementById(id);
                if (!el) {
                    this.createWindowDom(winData);
                }
                if (appType === 'explorer' || appType === 'file-explorer') {
                    if (params && params.path) {
                        winData.params = params;
                        const clientEl = document.getElementById(`client_${id}`);
                        if (clientEl && window.permissionsManager) {
                            window.permissionsManager.renderFileExplorer(clientEl, id, params);
                        }
                        const titleEl = document.querySelector(`#${id} .win-titlebar-text`);
                        if (titleEl) titleEl.textContent = params.path;
                    }
                }
                this.restoreWindow(id);
                this.bringToFront(id);
                return id;
            }
        }

        let title = "Application";
        let icon = "⚙️";
        let width = 760;
        let height = 520;

        switch (appType) {
            case 'server-manager':
                title = "Server Manager";
                icon = "🖥️";
                width = 860;
                height = 560;
                break;
            case 'computer-management':
                title = "Computer Management";
                icon = "⚙️";
                width = 880;
                height = 560;
                break;
            case 'explorer':
            case 'file-explorer':
                title = params.path || "File Explorer";
                icon = "📁";
                width = 800;
                height = 500;
                break;
            case 'security-test':
                title = "Security & Access Test";
                icon = "🛡️";
                width = 720;
                height = 540;
                break;
            case 'roles-manager':
                title = "Organizational Roles (RBAC)";
                icon = "👥";
                width = 800;
                height = 620;
                break;
            case 'cmd':
                title = "Administrator: Command Prompt";
                icon = "⬛";
                width = 680;
                height = 420;
                break;
            case 'powershell':
                title = "Administrator: Windows PowerShell";
                icon = "🟦";
                width = 720;
                height = 440;
                break;
            case 'recycle':
                title = "Recycle Bin";
                icon = "🗑️";
                width = 640;
                height = 400;
                break;
            case 'aduc': {
                const dc = window.systemState.getState().rolesAndFeatures?.domainController || {};
                const dom = (dc.forestName || 'corp.contoso.com').toLowerCase();
                const hostname = (window.simState ? window.simState.server.hostname : 'WIN-SERVER');
                title = `Active Directory Users and Computers [${hostname}.${dom}]`;
                icon = "🌳";
                width = 900;
                height = 580;
                break;
            }
        }

        const winId = `win_${appType}_${Date.now()}`;
        const count = this.openWindows.size;
        const left = 110 + (count % 8) * 30;
        const top = 30 + (count % 8) * 30;

        const winData = {
            id: winId,
            appType,
            title,
            icon,
            params,
            x: left,
            y: top,
            width,
            height,
            isMinimized: false,
            isMaximized: false,
            zIndex: ++this.zIndexCounter,
            childModals: new Set()
        };

        this.openWindows.set(winId, winData);
        this.createWindowDom(winData);
        this.bringToFront(winId);
        this.renderTaskbarItems();
        return winId;
    }

    renderAppContent(winId, appType, params) {
        const clientEl = document.getElementById(`client_${winId}`);
        if (!clientEl) return;

        switch (appType) {
            case 'server-manager':
                this.renderServerManager(clientEl, winId);
                break;
            case 'computer-management':
                if (window.usersManager) {
                    window.usersManager.renderComputerManagement(clientEl, winId);
                }
                break;
            case 'explorer':
            case 'file-explorer':
                if (window.permissionsManager) {
                    window.permissionsManager.renderFileExplorer(clientEl, winId, params);
                }
                break;
            case 'security-test':
                if (window.permissionsManager) {
                    window.permissionsManager.renderSecurityTest(clientEl, winId);
                }
                break;
            case 'roles-manager':
                if (window.usersManager) {
                    window.usersManager.renderRolesManager(clientEl, winId);
                }
                break;
            case 'cmd':
                if (window.appMain) {
                    window.appMain.renderCmd(clientEl, winId);
                }
                break;
            case 'powershell':
                if (window.appMain) {
                    window.appMain.renderPowerShell(clientEl, winId);
                }
                break;
            case 'recycle':
                clientEl.innerHTML = `
                    <div style="padding: 20px; text-align: center; color: #555;">
                        <span style="font-size: 48px;">🗑️</span>
                        <h3>Recycle Bin is empty</h3>
                        <p>No deleted items in the bin.</p>
                    </div>
                `;
                break;
            case 'aduc':
                if (window.rolesManager) {
                    window.rolesManager.renderAduc(clientEl, winId);
                }
                break;
        }
    }

    renderServerManager(clientEl, winId) {
        const state = window.systemState.getState();
        const rolesState = state.rolesAndFeatures || {};
        const installedRoles = rolesState.roles || [];
        const isAdDsInstalled = installedRoles.some(r => r.id === 'ad-ds' && r.installed);
        const isDnsInstalled = installedRoles.some(r => r.id === 'dns' && r.installed);
        const isIisInstalled = installedRoles.some(r => r.id === 'web-server' && r.installed);
        const isDhcpInstalled = installedRoles.some(r => r.id === 'dhcp' && r.installed);
        const isPrintInstalled = installedRoles.some(r => r.id === 'print-services' && r.installed);
        
        const notifications = rolesState.notifications || [];
        const notifCount = notifications.length;
        const hasWarningNotif = notifications.some(n => n.severity === 'warning');

        clientEl.innerHTML = `
            <div class="sm-wrapper">
                <!-- SM Top Menubar with Dropdowns & Notification Flag -->
                <div class="sm-menubar">
                    <div class="sm-menu-item active" onclick="window.windowsManager.switchSmView('${winId}', 'dashboard')">Dashboard</div>
                    
                    <!-- Manage Dropdown -->
                    <div class="sm-menu-dropdown-container">
                        <div class="sm-menu-item" id="sm-menu-manage-${winId}" onclick="window.rolesManager.toggleManageMenu('${winId}', event)">
                            Manage ▾
                        </div>
                        <div class="sm-dropdown-menu" id="sm-dropdown-manage-${winId}">
                            <div class="sm-dropdown-item" onclick="window.rolesManager.openAddRolesWizard()">
                                <span class="menu-icon">➕</span> Add Roles and Features
                            </div>
                            <div class="sm-dropdown-item" onclick="window.rolesManager.openRemoveRolesWizard()">
                                <span class="menu-icon">➖</span> Remove Roles and Features
                            </div>
                            <div class="sm-dropdown-sep"></div>
                            <div class="sm-dropdown-item" onclick="alert('Add Servers: Server pool discovery. WIN-SERVER is currently managed.')">
                                <span class="menu-icon">🖧</span> Add Servers
                            </div>
                            <div class="sm-dropdown-item" onclick="alert('Create Server Group: Used to group and manage multiple remote servers.')">
                                <span class="menu-icon">📁</span> Create Server Group
                            </div>
                            <div class="sm-dropdown-sep"></div>
                            <div class="sm-dropdown-item" onclick="alert('Server Manager Properties: Refresh rate set to 10 minutes. Real-time data collection active.')">
                                <span class="menu-icon">⚙️</span> Server Manager Properties
                            </div>
                        </div>
                    </div>

                    <!-- Tools Dropdown -->
                    <div class="sm-menu-dropdown-container">
                        <div class="sm-menu-item" id="sm-menu-tools-${winId}" onclick="window.rolesManager.toggleToolsMenu('${winId}', event)">
                            Tools ▾
                        </div>
                        <div class="sm-dropdown-menu sm-tools-menu" id="sm-dropdown-tools-${winId}">
                            ${isAdDsInstalled ? `
                                <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('aduc'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🌳</span> Active Directory Users and Computers
                                </div>
                                <div class="sm-dropdown-item" onclick="alert('Active Directory Administrative Center: Modern PowerShell-driven directory management.'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🌐</span> Active Directory Administrative Center
                                </div>
                                <div class="sm-dropdown-item" onclick="alert('Active Directory Domains and Trusts: Manage domain trusts and UPN suffixes.'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🌲</span> Active Directory Domains and Trusts
                                </div>
                                <div class="sm-dropdown-item" onclick="alert('Active Directory Sites and Services: Manage replication topologies and subnets.'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🏢</span> Active Directory Sites and Services
                                </div>
                                <div class="sm-dropdown-item" onclick="alert('ADSI Edit: Low-level LDAP schema and directory editor.'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">📜</span> ADSI Edit
                                </div>
                                <div class="sm-dropdown-item" onclick="alert('Group Policy Management Console (gpmc.msc): Configure domain GPOs and inheritance.'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🛡️</span> Group Policy Management
                                </div>
                                <div class="sm-dropdown-sep"></div>
                            ` : ''}
                            ${isDnsInstalled ? `
                                <div class="sm-dropdown-item" onclick="window.rolesManager.showRoleView('${winId}', 'dns'); window.rolesManager.closeAllMenus();">
                                    <span class="menu-icon">🌐</span> DNS
                                </div>
                                <div class="sm-dropdown-sep"></div>
                            ` : ''}
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('computer-management'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">⚙️</span> Computer Management
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('computer-management'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">📋</span> Event Viewer
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('roles-manager'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">👥</span> Organizational Roles (RBAC)
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('security-test'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">🛡️</span> Security & Access Test
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('explorer', { path: 'C:\\' }); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">📁</span> File Explorer
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('cmd'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">⬛</span> Command Prompt
                            </div>
                            <div class="sm-dropdown-item" onclick="window.windowsManager.openApp('powershell'); window.rolesManager.closeAllMenus();">
                                <span class="menu-icon">🟦</span> Windows PowerShell
                            </div>
                        </div>
                    </div>

                    <div class="sm-menu-item" onclick="window.windowsManager.switchSmView('${winId}', 'dashboard')">View</div>
                    <div class="sm-menu-item" onclick="alert('Server Manager Help: Microsoft Windows Server 2022 Documentation')">Help</div>

                    <!-- Right Menubar: Notifications & Refresh -->
                    <div class="sm-menubar-right">
                        <div class="sm-notif-btn ${hasWarningNotif ? 'has-warning' : ''}" onclick="window.rolesManager.toggleNotifications('${winId}', event)" title="Task Details and Notifications">
                            <span class="sm-flag-icon">🚩</span>
                            ${notifCount > 0 ? `<span class="sm-notif-badge">${notifCount}</span>` : ''}
                        </div>
                        <div class="sm-menu-icon-btn" onclick="window.windowsManager.syncServerState()" title="Refresh">🔄</div>

                        <!-- Notification Flyout -->
                        <div class="sm-notif-flyout" id="sm-notif-flyout-${winId}">
                            <div class="notif-header">
                                <span>Task Details and Notifications</span>
                                <button class="notif-close-btn" onclick="window.rolesManager.closeAllMenus()">✕</button>
                            </div>
                            <div class="notif-body">
                                ${notifications.length === 0 ? `
                                    <div class="notif-empty">No pending notifications or tasks.</div>
                                ` : notifications.map(n => `
                                    <div class="notif-item ${n.severity || 'info'}">
                                        <div class="notif-icon">${n.severity === 'warning' ? '⚠️' : 'ℹ️'}</div>
                                        <div class="notif-content">
                                            <b>${n.title}</b>
                                            <p>${n.message}</p>
                                            ${n.actionLabel ? `
                                                <a href="javascript:void(0)" class="notif-action-link" onclick="window.rolesManager.openDCPromotionWizard()">
                                                    👉 ${n.actionLabel}
                                                </a>
                                            ` : ''}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="sm-main-container">
                    <!-- Left Sidebar -->
                    <div class="sm-sidebar">
                        <div class="sm-nav-item active" id="sm-nav-dashboard-${winId}" onclick="window.windowsManager.switchSmView('${winId}', 'dashboard')">
                            <span class="sm-nav-icon">📊</span> Dashboard
                        </div>
                        <div class="sm-nav-item" id="sm-nav-local-server-${winId}" onclick="window.windowsManager.switchSmView('${winId}', 'local-server')">
                            <span class="sm-nav-icon">🖥️</span> Local Server
                        </div>
                        <div class="sm-nav-item" id="sm-nav-all-servers-${winId}" onclick="window.windowsManager.switchSmView('${winId}', 'all-servers')">
                            <span class="sm-nav-icon">🖧</span> All Servers
                        </div>
                        
                        <div class="sm-nav-category">ROLES AND FEATURES</div>
                        
                        ${isAdDsInstalled ? `
                            <div class="sm-nav-item" id="sm-nav-ad-ds-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'ad-ds')">
                                <span class="sm-nav-icon">🏢</span> AD DS
                            </div>
                        ` : ''}

                        ${isDnsInstalled ? `
                            <div class="sm-nav-item" id="sm-nav-dns-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'dns')">
                                <span class="sm-nav-icon">🌐</span> DNS
                            </div>
                        ` : ''}

                        <div class="sm-nav-item" id="sm-nav-file-storage-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'file-storage')">
                            <span class="sm-nav-icon">📁</span> File and Storage Services
                        </div>

                        ${isIisInstalled ? `
                            <div class="sm-nav-item" id="sm-nav-web-server-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'web-server')">
                                <span class="sm-nav-icon">🌍</span> IIS
                            </div>
                        ` : ''}

                        ${isDhcpInstalled ? `
                            <div class="sm-nav-item" id="sm-nav-dhcp-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'dhcp')">
                                <span class="sm-nav-icon">🖧</span> DHCP
                            </div>
                        ` : ''}

                        ${isPrintInstalled ? `
                            <div class="sm-nav-item" id="sm-nav-print-services-${winId}" onclick="window.rolesManager.showRoleView('${winId}', 'print-services')">
                                <span class="sm-nav-icon">🖨️</span> Print Services
                            </div>
                        ` : ''}
                    </div>

                    <!-- Right Body -->
                    <div class="sm-content-area" id="sm_content_${winId}">
                        <div class="sm-dashboard-view">
                            <div class="sm-welcome-banner">
                                <h2>Welcome to Server Manager</h2>
                                <p>Manage local and remote servers running Windows Server 2022.</p>
                            </div>

                            <div class="sm-quickstart-row">
                                <div class="sm-step-card" onclick="window.windowsManager.switchSmView('${winId}', 'local-server')">
                                    <div class="step-num">1</div>
                                    <div class="step-text">
                                        <h4>Configure this local server</h4>
                                        <p>Review and edit server properties, network settings, and security.</p>
                                    </div>
                                </div>
                                <div class="sm-step-card" onclick="window.rolesManager.openAddRolesWizard()">
                                    <div class="step-num">2</div>
                                    <div class="step-text">
                                        <h4>Add roles and features</h4>
                                        <p>Install server roles such as Active Directory Domain Services (AD DS), DNS, or IIS.</p>
                                    </div>
                                </div>
                                <div class="sm-step-card" onclick="window.windowsManager.openApp('computer-management')">
                                    <div class="step-num">3</div>
                                    <div class="step-text">
                                        <h4>Local Users and Groups</h4>
                                        <p>Launch Computer Management (compmgmt.msc) to manage user accounts and security groups.</p>
                                    </div>
                                </div>
                                <div class="sm-step-card" onclick="window.windowsManager.openApp('roles-manager')">
                                    <div class="step-num">4</div>
                                    <div class="step-text">
                                        <h4>Role-Based Access Control</h4>
                                        <p>Map organizational roles (Financial Analyst) to security groups.</p>
                                    </div>
                                </div>
                            </div>

                            <div class="sm-roles-table-section">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <h3 class="sm-section-title" style="margin: 0;">ROLES AND SERVER GROUPS</h3>
                                    <div style="display: flex; gap: 8px;">
                                        <button class="win-btn win-btn-sm win-btn-accent" onclick="window.rolesManager.openAddRolesWizard()">➕ Add Roles and Features</button>
                                        <button class="win-btn win-btn-sm" onclick="window.rolesManager.openRemoveRolesWizard()">➖ Remove</button>
                                    </div>
                                </div>
                                <table class="win-table">
                                    <thead>
                                        <tr>
                                            <th>Roles / Server Groups</th>
                                            <th>Manageability</th>
                                            <th>Events</th>
                                            <th>Services</th>
                                            <th>BPA Results</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td><b>Local Server (${window.systemState.getState().server.hostname})</b></td>
                                            <td><span class="status-pill ok">Online</span></td>
                                            <td>0 Errors</td>
                                            <td>Running</td>
                                            <td>Compliant</td>
                                        </tr>
                                        <tr>
                                            <td><b>File and Storage Services</b></td>
                                            <td><span class="status-pill ok">Online</span></td>
                                            <td>0 Errors</td>
                                            <td>Running</td>
                                            <td>Compliant</td>
                                        </tr>
                                        ${isAdDsInstalled ? `
                                            <tr style="cursor: pointer;" onclick="window.rolesManager.showRoleView('${winId}', 'ad-ds')">
                                                <td><span class="role-icon">🏢</span> <b>Active Directory Domain Services</b></td>
                                                <td><span class="status-pill ok">Online</span></td>
                                                <td>0 Errors</td>
                                                <td>Running</td>
                                                <td>Compliant</td>
                                            </tr>
                                        ` : ''}
                                        ${isDnsInstalled ? `
                                            <tr style="cursor: pointer;" onclick="window.rolesManager.showRoleView('${winId}', 'dns')">
                                                <td><span class="role-icon">🌐</span> <b>DNS Server</b></td>
                                                <td><span class="status-pill ok">Online</span></td>
                                                <td>0 Errors</td>
                                                <td>Running</td>
                                                <td>Compliant</td>
                                            </tr>
                                        ` : ''}
                                        ${isIisInstalled ? `
                                            <tr style="cursor: pointer;" onclick="window.rolesManager.showRoleView('${winId}', 'web-server')">
                                                <td><span class="role-icon">🌍</span> <b>Web Server (IIS)</b></td>
                                                <td><span class="status-pill ok">Online</span></td>
                                                <td>0 Errors</td>
                                                <td>Running</td>
                                                <td>Compliant</td>
                                            </tr>
                                        ` : ''}
                                        ${isDhcpInstalled ? `
                                            <tr style="cursor: pointer;" onclick="window.rolesManager.showRoleView('${winId}', 'dhcp')">
                                                <td><span class="role-icon">🖧</span> <b>DHCP Server</b></td>
                                                <td><span class="status-pill ok">Online</span></td>
                                                <td>0 Errors</td>
                                                <td>Running</td>
                                                <td>Compliant</td>
                                            </tr>
                                        ` : ''}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    switchSmView(winId, viewType) {
        const contentEl = document.getElementById(`sm_content_${winId}`);
        if (!contentEl) return;
        const state = window.systemState.getState();

        document.querySelectorAll(`#client_${winId} .sm-nav-item`).forEach(el => el.classList.remove('active'));

        if (viewType === 'local-server') {
            document.getElementById(`sm-nav-local-server-${winId}`)?.classList.add('active');
            const dc = state.rolesAndFeatures?.domainController || {};
            const domainName = dc.promoted ? (dc.forestName?.toUpperCase() || 'CORP.CONTOSO.COM') : (state.server.domain || 'WORKGROUP');
            const installedRolesCount = (state.rolesAndFeatures?.roles || []).filter(r => r.installed).length;
            const installedFeaturesCount = (state.rolesAndFeatures?.features || []).filter(f => f.installed).length;

            contentEl.innerHTML = `
                <div class="sm-local-server-view" style="padding: 15px;">
                    <h3 style="margin-bottom: 12px;">PROPERTIES FOR ${state.server.hostname}</h3>
                    <div class="sm-properties-grid">
                        <div class="sm-prop-item"><span class="k">Computer name:</span><span class="v"><b>${state.server.hostname}</b></span></div>
                        <div class="sm-prop-item"><span class="k">Domain:</span><span class="v"><b>${domainName}</b></span></div>
                        <div class="sm-prop-item"><span class="k">Windows Firewall:</span><span class="v">Private: On</span></div>
                        <div class="sm-prop-item"><span class="k">Remote Desktop:</span><span class="v">Enabled</span></div>
                        <div class="sm-prop-item"><span class="k">Ethernet:</span><span class="v">IPv4: ${state.server.ipAddress} (DHCP)</span></div>
                        <div class="sm-prop-item"><span class="k">Operating System:</span><span class="v">${state.server.os}</span></div>
                        <div class="sm-prop-item"><span class="k">Installed Memory (RAM):</span><span class="v">${state.vm.ram} MB</span></div>
                        <div class="sm-prop-item"><span class="k">Processors:</span><span class="v">${state.vm.processors} Virtual Processor(s)</span></div>
                        <div class="sm-prop-item"><span class="k">Total Disk Space:</span><span class="v">${state.vm.storage} GB (Drive C:)</span></div>
                        <div class="sm-prop-item"><span class="k">Roles and Features:</span><span class="v"><b>${installedRolesCount}</b> Roles, <b>${installedFeaturesCount}</b> Features</span></div>
                    </div>
                    <div style="margin-top: 20px; display: flex; gap: 10px; flex-wrap: wrap;">
                        <button class="win-btn win-btn-accent" onclick="window.rolesManager.openAddRolesWizard()">➕ Add Roles and Features</button>
                        <button class="win-btn" onclick="window.rolesManager.openRemoveRolesWizard()">➖ Remove Roles and Features</button>
                        <button class="win-btn win-btn-default" onclick="window.windowsManager.openApp('computer-management')">Computer Management (compmgmt.msc)</button>
                    </div>
                </div>
            `;
        } else if (viewType === 'all-servers') {
            document.getElementById(`sm-nav-all-servers-${winId}`)?.classList.add('active');
            contentEl.innerHTML = `
                <div class="sm-local-server-view" style="padding: 15px;">
                    <h3 style="margin-bottom: 12px;">ALL SERVERS (1)</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Server Name</th>
                                <th>IPv4 Address</th>
                                <th>Manageability</th>
                                <th>Operating System</th>
                                <th>BPA Results</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>${state.server.hostname}</b></td>
                                <td>${state.server.ipAddress}</td>
                                <td><span class="status-pill ok">Online</span></td>
                                <td>${state.server.os}</td>
                                <td>Compliant</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            `;
        } else {
            const clientEl = document.getElementById(`client_${winId}`);
            if (clientEl) this.renderServerManager(clientEl, winId);
        }
    }

    bringToFront(winId) {
        const win = this.openWindows.get(winId);
        if (!win) return;

        this.activeWindowId = winId;
        win.zIndex = ++this.zIndexCounter;

        document.querySelectorAll('.win-window').forEach(el => {
            el.classList.remove('active');
            if (el.id === winId) {
                el.classList.add('active');
                el.style.zIndex = win.zIndex;
            }
        });

        // Elevate any open child modals belonging to this window so they never appear behind parent
        if (win.childModals) {
            for (const modalId of win.childModals) {
                const modalData = this.openModals.get(modalId);
                if (modalData && modalData.domEl && !modalData.parentModalId) {
                    this.modalZIndexCounter += 100;
                    modalData.zIndex = this.modalZIndexCounter;
                    modalData.domEl.style.zIndex = modalData.zIndex;
                    this.elevateChildModals(modalId);
                }
            }
        }

        this.renderTaskbarItems();
    }

    minimizeWindow(winId) {
        const win = this.openWindows.get(winId);
        if (!win) return;
        win.isMinimized = true;
        const el = document.getElementById(winId);
        if (el) el.style.display = 'none';

        // If this window was active, activate next highest open window
        if (this.activeWindowId === winId) {
            let highestWinId = null;
            let highestZ = -1;
            for (const [id, w] of this.openWindows) {
                if (!w.isMinimized && w.zIndex > highestZ) {
                    highestZ = w.zIndex;
                    highestWinId = id;
                }
            }
            if (highestWinId) {
                this.bringToFront(highestWinId);
            } else {
                this.activeWindowId = null;
            }
        }

        this.renderTaskbarItems();
    }

    restoreWindow(winId) {
        const win = this.openWindows.get(winId);
        if (!win) return;
        win.isMinimized = false;
        const el = document.getElementById(winId);
        if (el) el.style.display = 'flex';
        this.bringToFront(winId);
    }

    toggleMaximize(winId) {
        const win = this.openWindows.get(winId);
        const el = document.getElementById(winId);
        if (!win || !el) return;

        win.isMaximized = !win.isMaximized;
        el.classList.toggle('maximized', win.isMaximized);
    }

    closeWindow(winId) {
        const win = this.openWindows.get(winId);
        if (win && window.systemState) {
            window.systemState.removeOpenApp(win.appType);
        }

        if (win && win.childModals) {
            for (const modalId of Array.from(win.childModals)) {
                this.closeModal(modalId);
            }
        }
        for (const [mId, mData] of Array.from(this.openModals.entries())) {
            if (mData.parentWinId === winId) {
                this.closeModal(mId);
            }
        }

        const el = document.getElementById(winId);
        if (el) el.remove();
        this.openWindows.delete(winId);

        // Activate the next highest window if this was active
        if (this.activeWindowId === winId) {
            let highestWinId = null;
            let highestZ = -1;
            for (const [id, w] of this.openWindows) {
                if (!w.isMinimized && w.zIndex > highestZ) {
                    highestZ = w.zIndex;
                    highestWinId = id;
                }
            }
            if (highestWinId) {
                this.bringToFront(highestWinId);
            } else {
                this.activeWindowId = null;
            }
        }

        this.renderTaskbarItems();
    }

    closeAllWindows() {
        this.closeAllModals();
        const area = document.getElementById('win-windows-area');
        if (area) area.innerHTML = '';
        this.openWindows.clear();
        this.activeWindowId = null;
        this.zIndexCounter = 100;
        this.renderTaskbarItems();
        if (window.systemState?.state?.windows) {
            window.systemState.state.windows.openApps = [];
            window.systemState.saveState();
        }
    }

    minimizeAllWindows() {
        for (const [id, win] of this.openWindows) {
            this.minimizeWindow(id);
        }
    }

    renderTaskbarItems() {
        const container = document.getElementById('win-taskbar-items');
        if (!container) return;

        container.innerHTML = '';
        for (const [id, win] of this.openWindows) {
            const btn = document.createElement('button');
            const isActive = (this.activeWindowId === id && !win.isMinimized);
            btn.className = `win-taskbar-item ${isActive ? 'active' : ''} ${win.isMinimized ? 'minimized' : ''}`;
            btn.innerHTML = `<span class="tb-item-icon">${win.icon}</span><span class="tb-item-title">${win.title}</span>`;
            btn.onclick = () => {
                if (isActive) {
                    this.minimizeWindow(id);
                } else {
                    this.restoreWindow(id);
                }
            };
            container.appendChild(btn);
        }
    }

    // Draggable Window implementation
    startDrag(e, winId) {
        if (e.target.closest('.win-titlebar-controls')) return;
        const win = this.openWindows.get(winId);
        const el = document.getElementById(winId);
        if (!win || !el || win.isMaximized) return;

        this.bringToFront(winId);

        const startX = e.clientX;
        const startY = e.clientY;
        const origLeft = el.offsetLeft;
        const origTop = el.offsetTop;

        const onMouseMove = (moveEv) => {
            const deltaX = moveEv.clientX - startX;
            const deltaY = moveEv.clientY - startY;
            const newX = Math.max(0, origLeft + deltaX);
            const newY = Math.max(0, origTop + deltaY);
            el.style.left = `${newX}px`;
            el.style.top = `${newY}px`;
            win.x = newX;
            win.y = newY;
        };

        const onMouseUp = () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }
}

window.windowsManager = new WindowsManager();
