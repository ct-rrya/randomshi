/**
 * System Administration Simulator - Server Roles & Features Manager
 * Implements:
 * - Server Manager Manage Menu: Add Roles and Features, Remove Roles and Features
 * - Authentic 7-step Add Roles and Features Wizard
 * - Sub-modal dependency prompt for Active Directory Domain Services (AD DS)
 * - Authentic Remove Roles and Features Wizard
 * - Active Directory Domain Services Configuration Wizard (DC Promotion)
 * - AD DS & Role Consoles in Server Manager
 * - Active Directory Users and Computers (dsa.msc) MMC snap-in
 */

class RolesManager {
    constructor() {
        this.wizard = null;
        this.dcWizard = null;
        this.selectedAducContainer = 'Users';
        this.init();
    }

    init() {
        // Close dropdown menus when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.sm-menu-dropdown-container') && !e.target.closest('.sm-notif-btn')) {
                this.closeAllMenus();
            }
        });
    }

    closeAllMenus() {
        document.querySelectorAll('.sm-dropdown-menu').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.sm-notif-flyout').forEach(el => el.classList.remove('open'));
    }

    // --- SERVER MANAGER TOP MENUS ---
    toggleManageMenu(winId, event) {
        if (event) event.stopPropagation();
        const menuEl = document.getElementById(`sm-dropdown-manage-${winId}`);
        const wasOpen = menuEl?.classList.contains('open');
        this.closeAllMenus();
        if (!wasOpen && menuEl) {
            menuEl.classList.add('open');
        }
    }

    toggleToolsMenu(winId, event) {
        if (event) event.stopPropagation();
        const menuEl = document.getElementById(`sm-dropdown-tools-${winId}`);
        const wasOpen = menuEl?.classList.contains('open');
        this.closeAllMenus();
        if (!wasOpen && menuEl) {
            menuEl.classList.add('open');
        }
    }

    toggleNotifications(winId, event) {
        if (event) event.stopPropagation();
        const flyoutEl = document.getElementById(`sm-notif-flyout-${winId}`);
        const wasOpen = flyoutEl?.classList.contains('open');
        this.closeAllMenus();
        if (!wasOpen && flyoutEl) {
            flyoutEl.classList.add('open');
        }
    }

    // --- SERVER MANAGER ROLE VIEW ---
    showRoleView(winId, roleId) {
        const contentEl = document.getElementById(`sm_content_${winId}`);
        if (!contentEl) return;

        // Update active nav item
        document.querySelectorAll(`#client_${winId} .sm-nav-item`).forEach(el => el.classList.remove('active'));
        const navEl = document.getElementById(`sm-nav-${roleId}-${winId}`);
        if (navEl) navEl.classList.add('active');

        const state = window.systemState.getState();
        const role = state.rolesAndFeatures?.roles.find(r => r.id === roleId);
        if (!role) return;

        if (roleId === 'ad-ds') {
            this.renderAdDsView(contentEl, winId);
        } else if (roleId === 'dns') {
            this.renderDnsView(contentEl, winId);
        } else if (roleId === 'web-server') {
            this.renderIisView(contentEl, winId);
        } else if (roleId === 'dhcp') {
            this.renderDhcpView(contentEl, winId);
        } else {
            this.renderGenericRoleView(contentEl, winId, role);
        }
    }

    renderAdDsView(contentEl, winId) {
        const state = window.systemState.getState();
        const dc = state.rolesAndFeatures?.domainController || {};
        const isPromoted = dc.promoted;
        const domain = isPromoted ? (dc.forestName?.toUpperCase() || 'CORP.CONTOSO.COM') : 'WORKGROUP';

        contentEl.innerHTML = `
            <div class="sm-role-view sm-adds-view">
                <!-- Status Banner -->
                ${!isPromoted ? `
                    <div class="sm-banner-alert warning">
                        <div class="banner-icon">⚠️</div>
                        <div class="banner-body">
                            <h4>Configuration required for Active Directory Domain Services at WIN-SERVER</h4>
                            <p>Installation of the Active Directory Domain Services role binaries is complete. This server must now be promoted to a domain controller to activate AD DS.</p>
                            <div class="banner-action-row">
                                <button class="win-btn win-btn-accent" onclick="window.rolesManager.openDCPromotionWizard()">
                                    ✨ Promote this server to a domain controller
                                </button>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div class="sm-banner-alert success">
                        <div class="banner-icon">✅</div>
                        <div class="banner-body">
                            <h4>Active Directory Domain Services is Operational</h4>
                            <p>WIN-SERVER is currently functioning as the Primary Domain Controller for domain <b>${domain}</b>.</p>
                            <div class="banner-action-row">
                                <button class="win-btn win-btn-default" onclick="window.windowsManager.openApp('aduc')">
                                    👤 Open Active Directory Users and Computers (dsa.msc)
                                </button>
                                <button class="win-btn" onclick="window.windowsManager.openApp('computer-management')">
                                    ⚙️ Computer Management
                                </button>
                            </div>
                        </div>
                    </div>
                `}

                <div class="sm-role-header">
                    <h2>Active Directory Domain Services</h2>
                    <span class="sm-status-badge ${isPromoted ? 'ok' : 'pending'}">${isPromoted ? 'Operational' : 'Configuration Pending'}</span>
                </div>

                <!-- Servers Grid -->
                <div class="sm-section-block">
                    <h3 class="sm-section-title">SERVERS (1)</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Server Name</th>
                                <th>IPv4 Address</th>
                                <th>Manageability</th>
                                <th>Domain / Forest</th>
                                <th>Role</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>WIN-SERVER</b></td>
                                <td>192.168.1.50</td>
                                <td><span class="status-pill ok">Online</span></td>
                                <td>${domain}</td>
                                <td>${isPromoted ? 'Primary Domain Controller (GC, DNS)' : 'Member Server (AD DS installed)'}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Services Grid -->
                <div class="sm-section-block">
                    <h3 class="sm-section-title">SERVICES (5)</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Service Name</th>
                                <th>Display Name</th>
                                <th>Status</th>
                                <th>Startup Type</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>NTDS</b></td>
                                <td>Active Directory Domain Services</td>
                                <td><span class="status-pill ${isPromoted ? 'ok' : 'warning'}">${isPromoted ? 'Running' : 'Ready to configure'}</span></td>
                                <td>Automatic</td>
                            </tr>
                            <tr>
                                <td><b>ADWS</b></td>
                                <td>Active Directory Web Services</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>Automatic</td>
                            </tr>
                            <tr>
                                <td><b>DNS</b></td>
                                <td>DNS Server Service</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>Automatic</td>
                            </tr>
                            <tr>
                                <td><b>KDC</b></td>
                                <td>Kerberos Key Distribution Center</td>
                                <td><span class="status-pill ${isPromoted ? 'ok' : 'neutral'}">${isPromoted ? 'Running' : 'Manual'}</span></td>
                                <td>Automatic</td>
                            </tr>
                            <tr>
                                <td><b>Netlogon</b></td>
                                <td>Netlogon Service</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>Automatic</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Directory Events -->
                <div class="sm-section-block">
                    <h3 class="sm-section-title">DIRECTORY SERVICE EVENTS</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th style="width: 70px;">Severity</th>
                                <th style="width: 80px;">Event ID</th>
                                <th style="width: 130px;">Time</th>
                                <th>Details</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${isPromoted ? `
                                <tr>
                                    <td><span class="status-pill ok">Info</span></td>
                                    <td>1000</td>
                                    <td>Just now</td>
                                    <td>Directory database NTDS.DIT and SYSVOL active for domain ${domain}.</td>
                                </tr>
                                <tr>
                                    <td><span class="status-pill ok">Info</span></td>
                                    <td>4624</td>
                                    <td>Just now</td>
                                    <td>An account was successfully logged on with Kerberos domain ticket.</td>
                                </tr>
                            ` : `
                                <tr>
                                    <td><span class="status-pill warning">Warning</span></td>
                                    <td>2080</td>
                                    <td>Just now</td>
                                    <td>AD DS binaries installed. Post-deployment promotion wizard required to initialize forest.</td>
                                </tr>
                            `}
                            <tr>
                                <td><span class="status-pill ok">Info</span></td>
                                <td>4697</td>
                                <td>Earlier</td>
                                <td>A service was installed in the system: NTDS / ADWS.</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Best Practices Analyzer -->
                <div class="sm-section-block">
                    <h3 class="sm-section-title">BEST PRACTICES ANALYZER (BPA)</h3>
                    <div class="bpa-status-box ok">
                        <span class="bpa-icon">🛡️</span>
                        <div>
                            <b>All Active Directory BPA rules are compliant.</b>
                            <p>No compliance warnings or configuration errors detected on WIN-SERVER.</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDnsView(contentEl, winId) {
        const state = window.systemState.getState();
        const dc = state.rolesAndFeatures?.domainController || {};
        const domain = dc.promoted ? dc.forestName?.toLowerCase() : 'corp.contoso.com';

        contentEl.innerHTML = `
            <div class="sm-role-view">
                <div class="sm-role-header">
                    <h2>DNS Server</h2>
                    <span class="status-pill ok">Running</span>
                </div>
                <div class="sm-section-block">
                    <h3 class="sm-section-title">ACTIVE DNS ZONES</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Zone Name</th>
                                <th>Zone Type</th>
                                <th>Status</th>
                                <th>Primary Server</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>${domain}</b></td>
                                <td>Active Directory-Integrated Primary</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>WIN-SERVER</td>
                            </tr>
                            <tr>
                                <td><b>_msdcs.${domain}</b></td>
                                <td>Forest-wide DNS Zone</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>WIN-SERVER</td>
                            </tr>
                            <tr>
                                <td><b>1.168.192.in-addr.arpa</b></td>
                                <td>Reverse Lookup Zone</td>
                                <td><span class="status-pill ok">Running</span></td>
                                <td>WIN-SERVER</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderIisView(contentEl, winId) {
        contentEl.innerHTML = `
            <div class="sm-role-view">
                <div class="sm-role-header">
                    <h2>Web Server (IIS)</h2>
                    <span class="status-pill ok">Running</span>
                </div>
                <div class="sm-section-block">
                    <h3 class="sm-section-title">WEBSITES</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Site Name</th>
                                <th>ID</th>
                                <th>State</th>
                                <th>Binding</th>
                                <th>Physical Path</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>Default Web Site</b></td>
                                <td>1</td>
                                <td><span class="status-pill ok">Started</span></td>
                                <td>http:*:80:</td>
                                <td>C:\\inetpub\\wwwroot</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderDhcpView(contentEl, winId) {
        contentEl.innerHTML = `
            <div class="sm-role-view">
                <div class="sm-role-header">
                    <h2>DHCP Server</h2>
                    <span class="status-pill ok">Running</span>
                </div>
                <div class="sm-section-block">
                    <h3 class="sm-section-title">IPV4 SCOPES</h3>
                    <table class="win-table">
                        <thead>
                            <tr>
                                <th>Scope [Subnet]</th>
                                <th>Scope Name</th>
                                <th>State</th>
                                <th>Range</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td><b>192.168.1.0</b></td>
                                <td>LAN Clients Pool</td>
                                <td><span class="status-pill ok">Active</span></td>
                                <td>192.168.1.100 - 192.168.1.200</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    renderGenericRoleView(contentEl, winId, role) {
        contentEl.innerHTML = `
            <div class="sm-role-view">
                <div class="sm-role-header">
                    <h2>${role.name}</h2>
                    <span class="status-pill ok">Installed</span>
                </div>
                <p style="margin: 15px 0; color: #555;">${role.description}</p>
                <div class="sm-section-block">
                    <h3 class="sm-section-title">SERVICES</h3>
                    <table class="win-table">
                        <thead>
                            <tr><th>Service</th><th>Display Name</th><th>Status</th></tr>
                        </thead>
                        <tbody>
                            ${(role.services || []).map(s => `
                                <tr>
                                    <td><b>${s.name}</b></td>
                                    <td>${s.display}</td>
                                    <td><span class="status-pill ok">${s.status}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    // =========================================================================
    // ADD ROLES AND FEATURES WIZARD
    // =========================================================================
    openAddRolesWizard() {
        this.closeAllMenus();
        const state = window.systemState.getState();
        const installedRoles = new Set((state.rolesAndFeatures?.roles || []).filter(r => r.installed).map(r => r.id));
        const installedFeatures = new Set((state.rolesAndFeatures?.features || []).filter(f => f.installed).map(f => f.id));

        this.wizard = {
            type: 'add',
            step: 1,
            // Track newly checked roles/features for installation
            selectedRoles: new Set(),
            selectedFeatures: new Set(),
            // Pre-existing installed sets
            alreadyInstalledRoles: installedRoles,
            alreadyInstalledFeatures: installedFeatures,
            selectedRolePreview: 'ad-ds',
            selectedFeaturePreview: 'gpmc',
            restartIfRequired: false,
            installProgress: 0,
            installing: false,
            installComplete: false
        };

        this.renderWizardModal();
    }

    renderWizardModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const w = this.wizard;
        const hasAdDs = w.selectedRoles.has('ad-ds') || (!w.alreadyInstalledRoles.has('ad-ds') && w.selectedRoles.has('ad-ds'));

        // Define steps dynamically: if AD DS selected, include the AD DS informational step
        const steps = [
            { id: 1, key: 'before', label: 'Before You Begin' },
            { id: 2, key: 'type', label: 'Installation Type' },
            { id: 3, key: 'server', label: 'Server Selection' },
            { id: 4, key: 'roles', label: 'Server Roles' },
            { id: 5, key: 'features', label: 'Features' }
        ];

        if (w.selectedRoles.has('ad-ds')) {
            steps.push({ id: 6, key: 'adds', label: 'AD DS' });
            steps.push({ id: 7, key: 'confirm', label: 'Confirmation' });
            steps.push({ id: 8, key: 'results', label: 'Results' });
        } else {
            steps.push({ id: 6, key: 'confirm', label: 'Confirmation' });
            steps.push({ id: 7, key: 'results', label: 'Results' });
        }

        modalContainer.innerHTML = `
            <div id="modal-wizard-roles" class="modal-backdrop">
                <div class="win-wizard-dialog">
                    <!-- Titlebar -->
                    <div class="win-wizard-titlebar">
                        <div class="win-wizard-title-left">
                            <span class="win-wizard-title-icon">🧙</span>
                            <span>Add Roles and Features Wizard</span>
                        </div>
                        <button class="win-wizard-close" onclick="window.rolesManager.closeWizard()">✕</button>
                    </div>

                    <div class="win-wizard-container">
                        <!-- Left Navigation Sidebar -->
                        <div class="win-wizard-sidebar">
                            <div class="win-wizard-sidebar-title">WIN-SERVER</div>
                            <div class="win-wizard-steps-list">
                                ${steps.map(s => {
                                    const isActive = w.step === s.id;
                                    const isDone = w.step > s.id;
                                    return `
                                        <div class="win-wizard-step-item ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}">
                                            <span class="step-bullet">${isDone ? '✓' : '•'}</span>
                                            <span class="step-name">${s.label}</span>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Right Wizard Step Body -->
                        <div class="win-wizard-body" id="wizard-step-body">
                            ${this.renderWizardStepContent()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderWizardStepContent() {
        const w = this.wizard;
        const state = window.systemState.getState();
        const hasAdDs = w.selectedRoles.has('ad-ds');

        // Map step numbers based on whether AD DS step is included
        const confirmStep = hasAdDs ? 7 : 6;
        const resultsStep = hasAdDs ? 8 : 7;
        const addsStep = 6;

        if (w.step === 1) {
            // Before You Begin
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Before You Begin</h2>
                    <p class="wizard-intro">
                        This wizard helps you install roles, role services, or features. You determine which roles and features to install based on the computing needs of your organization, such as sharing documents, hosting websites, or managing directory access through Active Directory.
                    </p>
                    <div class="wizard-prereq-box">
                        <p><b>Before you continue, verify that the following tasks have been completed:</b></p>
                        <ul>
                            <li>The administrator account has a strong password.</li>
                            <li>Network settings, such as static IP addresses, are configured (WIN-SERVER: 192.168.1.50).</li>
                            <li>The most current security updates from Windows Update are installed.</li>
                        </ul>
                    </div>
                    <p class="wizard-note">If you have to make changes to any of the preceding prerequisites, complete the changes and then restart this wizard.</p>
                    <div class="win-checkbox-row" style="margin-top: 24px;">
                        <input type="checkbox" id="chk-skip-prereq">
                        <label for="chk-skip-prereq">Skip this page by default</label>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 2) {
            // Installation Type
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Select installation type</h2>
                    <p class="wizard-intro">Select the type of installation to perform on the destination server.</p>
                    
                    <div class="wizard-radio-group">
                        <label class="wizard-radio-option">
                            <input type="radio" name="install-type" value="role" checked>
                            <div class="radio-text">
                                <b>Role-based or feature-based installation</b>
                                <p>Configure a single server by adding roles, role services, and features.</p>
                            </div>
                        </label>
                        <label class="wizard-radio-option">
                            <input type="radio" name="install-type" value="rds" disabled>
                            <div class="radio-text" style="opacity: 0.6;">
                                <b>Remote Desktop Services installation</b>
                                <p>Install required role services for Virtual Desktop Infrastructure (VDI) to create a desktop deployment.</p>
                            </div>
                        </label>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 3) {
            // Server Selection
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Select destination server</h2>
                    <p class="wizard-intro">Select a server from the server pool on which to install roles and features.</p>

                    <div class="wizard-radio-group" style="margin-bottom: 12px;">
                        <label class="wizard-radio-option">
                            <input type="radio" name="server-sel" value="pool" checked>
                            <div class="radio-text"><b>Select a server from the server pool</b></div>
                        </label>
                    </div>

                    <div class="wizard-table-wrap">
                        <table class="win-table wizard-server-table">
                            <thead>
                                <tr>
                                    <th>Server Name</th>
                                    <th>IP Address</th>
                                    <th>Operating System</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr class="selected">
                                    <td><b>WIN-SERVER</b></td>
                                    <td>192.168.1.50</td>
                                    <td>${state.server.os}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 4) {
            // Server Roles Checklist
            const allRoles = state.rolesAndFeatures?.roles || [];
            const previewRole = allRoles.find(r => r.id === w.selectedRolePreview) || allRoles[0];

            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Select server roles</h2>
                    <p class="wizard-intro">Select one or more roles to install on the selected server.</p>

                    <div class="wizard-split-pane">
                        <div class="wizard-tree-box">
                            <div class="tree-header">Roles:</div>
                            <div class="tree-list">
                                ${allRoles.map(role => {
                                    const isInstalled = w.alreadyInstalledRoles.has(role.id);
                                    const isChecked = isInstalled || w.selectedRoles.has(role.id);
                                    const isSelected = w.selectedRolePreview === role.id;
                                    return `
                                        <div class="tree-item ${isSelected ? 'focused' : ''}" 
                                             onclick="window.rolesManager.selectRolePreview('${role.id}')">
                                            <input type="checkbox" 
                                                   id="role_chk_${role.id}" 
                                                   ${isChecked ? 'checked' : ''} 
                                                   ${isInstalled ? 'disabled' : ''} 
                                                   onchange="window.rolesManager.handleRoleToggle('${role.id}', this.checked)">
                                            <label for="role_chk_${role.id}" onclick="event.stopPropagation()">
                                                <span class="role-icon">${role.icon || '📁'}</span>
                                                <b>${role.name}</b>
                                                ${isInstalled ? '<span class="installed-tag">(Installed)</span>' : ''}
                                            </label>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Right Description Box -->
                        <div class="wizard-desc-box">
                            <h4>Description</h4>
                            <p class="desc-text">${previewRole ? previewRole.description : 'Select a role to view its description.'}</p>
                            ${previewRole && previewRole.id === 'ad-ds' ? `
                                <div class="desc-alert">
                                    <b>⭐ Prerequisites:</b>
                                    <p>Installing Active Directory Domain Services requires Remote Server Administration Tools (RSAT), Group Policy Management, and a DNS Server.</p>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 5) {
            // Features Checklist
            const allFeatures = state.rolesAndFeatures?.features || [];
            const previewFeat = allFeatures.find(f => f.id === w.selectedFeaturePreview) || allFeatures[0];

            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Select features</h2>
                    <p class="wizard-intro">Select one or more features to install on the selected server.</p>

                    <div class="wizard-split-pane">
                        <div class="wizard-tree-box">
                            <div class="tree-header">Features:</div>
                            <div class="tree-list">
                                ${allFeatures.map(feat => {
                                    const isInstalled = w.alreadyInstalledFeatures.has(feat.id);
                                    const isChecked = isInstalled || w.selectedFeatures.has(feat.id);
                                    const isSelected = w.selectedFeaturePreview === feat.id;
                                    return `
                                        <div class="tree-item ${isSelected ? 'focused' : ''}" 
                                             onclick="window.rolesManager.selectFeaturePreview('${feat.id}')">
                                            <input type="checkbox" 
                                                   id="feat_chk_${feat.id}" 
                                                   ${isChecked ? 'checked' : ''} 
                                                   ${isInstalled ? 'disabled' : ''} 
                                                   onchange="window.rolesManager.handleFeatureToggle('${feat.id}', this.checked)">
                                            <label for="feat_chk_${feat.id}" onclick="event.stopPropagation()">
                                                <span>${feat.name}</span>
                                                ${isInstalled ? '<span class="installed-tag">(Installed)</span>' : ''}
                                            </label>
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        </div>

                        <!-- Right Description Box -->
                        <div class="wizard-desc-box">
                            <h4>Description</h4>
                            <p class="desc-text">${previewFeat ? previewFeat.description : 'Select a feature to view its description.'}</p>
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (hasAdDs && w.step === addsStep) {
            // AD DS Informational Page
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Active Directory Domain Services</h2>
                    <p class="wizard-intro">
                        Active Directory Domain Services (AD DS) stores directory data and manages communication between users and domains, including user logon processes, authentication, and directory searches. An Active Directory domain controller is a server that is running AD DS.
                    </p>

                    <div class="wizard-adds-info-box">
                        <div class="adds-info-title">Things to note:</div>
                        <ul>
                            <li>To help ensure that users can still log on to the network in the case of a server outage, install at least two domain controllers for a domain.</li>
                            <li>AD DS requires a Domain Name System (DNS) server to be installed on the network. If DNS Server is not already installed on this server, it will be configured alongside AD DS.</li>
                            <li>Installing AD DS also configures the DFS Namespaces, DFS Replication, and Kerberos KDC services.</li>
                        </ul>
                        <div class="adds-important-banner">
                            <b>⚠️ Note:</b>
                            <p>After this wizard finishes installing the AD DS binaries, you must complete the deployment by clicking <b>"Promote this server to a domain controller"</b> in the results window or from the Server Manager notification flag.</p>
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.wizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === confirmStep) {
            // Confirmation Page
            const allRoles = state.rolesAndFeatures?.roles || [];
            const allFeatures = state.rolesAndFeatures?.features || [];

            const rolesToInstall = allRoles.filter(r => w.selectedRoles.has(r.id));
            const featuresToInstall = allFeatures.filter(f => w.selectedFeatures.has(f.id));

            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Confirm installation selections</h2>
                    <p class="wizard-intro">To install the following roles, role services, or features on selected server, click Install.</p>

                    <div class="win-checkbox-row" style="margin-bottom: 15px;">
                        <input type="checkbox" id="chk-auto-restart" ${w.restartIfRequired ? 'checked' : ''} onchange="window.rolesManager.wizard.restartIfRequired = this.checked">
                        <label for="chk-auto-restart">Restart the destination server automatically if required</label>
                    </div>

                    <div class="wizard-confirm-tree">
                        <div class="confirm-dest-node">
                            <b>WIN-SERVER</b>
                            ${rolesToInstall.length === 0 && featuresToInstall.length === 0 ? `
                                <div style="color: #888; font-style: italic; margin-top: 8px;">No new roles or features selected for installation.</div>
                            ` : ''}

                            ${rolesToInstall.map(r => `
                                <div class="confirm-item role">
                                    <span class="icon">📁</span>
                                    <b>${r.name}</b>
                                    ${r.id === 'ad-ds' ? `
                                        <div class="confirm-subitem">
                                            <span>• Group Policy Management</span>
                                        </div>
                                        <div class="confirm-subitem">
                                            <span>• Remote Server Administration Tools (RSAT)</span>
                                            <div class="confirm-sub-subitem">• AD DS and AD LDS Tools</div>
                                            <div class="confirm-sub-subitem">• Active Directory module for Windows PowerShell</div>
                                        </div>
                                    ` : ''}
                                </div>
                            `).join('')}

                            ${featuresToInstall.map(f => `
                                <div class="confirm-item feat">
                                    <span class="icon">⚙️</span>
                                    <span>${f.name}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.wizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-accent" onclick="window.rolesManager.startInstallation()" ${rolesToInstall.length === 0 && featuresToInstall.length === 0 ? 'disabled' : ''}>Install</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === resultsStep) {
            // Results & Progress
            const isDone = w.installComplete;
            const hadAdDs = w.selectedRoles.has('ad-ds');

            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">${isDone ? 'Installation results' : 'Installation progress'}</h2>
                    <p class="wizard-intro">
                        ${isDone 
                            ? 'The selected features have been installed on the destination server.' 
                            : 'Roles, role services, and features are being installed on WIN-SERVER.'}
                    </p>

                    <div class="wizard-progress-card">
                        <div class="progress-bar-rail">
                            <div class="progress-bar-fill" style="width: ${w.installProgress}%"></div>
                        </div>
                        <div class="progress-status-text" id="wizard-progress-msg">
                            ${isDone ? 'Feature installation succeeded on WIN-SERVER.' : 'Starting installation...'}
                        </div>
                    </div>

                    ${isDone ? `
                        <div class="wizard-results-summary">
                            <div class="result-header">
                                <span class="result-icon">${hadAdDs ? '⚠️' : '✅'}</span>
                                <div class="result-title-box">
                                    <b>${hadAdDs ? 'Configuration required. Installation succeeded on WIN-SERVER.' : 'Installation succeeded on WIN-SERVER.'}</b>
                                    <p>${hadAdDs ? 'Active Directory Domain Services binaries have been deployed.' : 'All requested roles and features were installed.'}</p>
                                </div>
                            </div>

                            ${hadAdDs ? `
                                <div class="adds-post-install-box">
                                    <div class="post-install-prompt">
                                        <span class="prompt-icon">👉</span>
                                        <div>
                                            <b>Action Required:</b>
                                            <a href="javascript:void(0)" class="win-hyperlink" onclick="window.rolesManager.openDCPromotionWizard()">
                                                Promote this server to a domain controller
                                            </a>
                                            <p>This action will launch the Active Directory Domain Services Configuration Wizard to create a new domain and forest.</p>
                                        </div>
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                    ` : ''}
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.closeWizard()" ${!isDone ? 'disabled' : ''}>Close</button>
                </div>
            `;
        }

        return '';
    }

    // Role checkbox toggle with authentic sub-dialog dependency popup
    handleRoleToggle(roleId, isChecked) {
        if (isChecked) {
            if (roleId === 'ad-ds') {
                this.showAdDsFeaturePrompt();
                return; // Wait for confirmation dialog before re-rendering
            } else {
                this.wizard.selectedRoles.add(roleId);
            }
        } else {
            this.wizard.selectedRoles.delete(roleId);
            if (roleId === 'ad-ds') {
                document.getElementById('wizard-submodal')?.remove();
            }
        }
        this.renderWizardModal();
    }

    handleFeatureToggle(featureId, isChecked) {
        if (isChecked) {
            this.wizard.selectedFeatures.add(featureId);
        } else {
            this.wizard.selectedFeatures.delete(featureId);
        }
        this.renderWizardModal();
    }

    selectRolePreview(roleId) {
        this.wizard.selectedRolePreview = roleId;
        const descEl = document.querySelector('.wizard-desc-box .desc-text');
        const role = window.systemState.getState().rolesAndFeatures?.roles.find(r => r.id === roleId);
        if (descEl && role) descEl.textContent = role.description;
        document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('focused'));
        event?.currentTarget?.classList.add('focused');
    }

    selectFeaturePreview(featureId) {
        this.wizard.selectedFeaturePreview = featureId;
        const descEl = document.querySelector('.wizard-desc-box .desc-text');
        const feat = window.systemState.getState().rolesAndFeatures?.features.find(f => f.id === featureId);
        if (descEl && feat) descEl.textContent = feat.description;
        document.querySelectorAll('.tree-item').forEach(el => el.classList.remove('focused'));
        event?.currentTarget?.classList.add('focused');
    }

    // Authentic Windows Server sub-modal: Add features required for Active Directory Domain Services
    showAdDsFeaturePrompt() {
        document.getElementById('wizard-submodal')?.remove();

        const subModal = document.createElement('div');
        subModal.id = 'wizard-submodal';
        subModal.className = 'modal-backdrop sub-modal';
        subModal.style.zIndex = '2500000';
        subModal.style.position = 'fixed';
        subModal.style.top = '0';
        subModal.style.left = '0';
        subModal.style.right = '0';
        subModal.style.bottom = '0';
        subModal.style.display = 'flex';
        subModal.style.alignItems = 'center';
        subModal.style.justifyContent = 'center';
        subModal.style.background = 'rgba(0, 0, 0, 0.45)';

        subModal.innerHTML = `
            <div class="win-dialog adds-prompt-dialog" style="z-index: 2500001; box-shadow: 0 12px 40px rgba(0,0,0,0.6); position: relative;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Add Roles and Features Wizard</span>
                    <button class="win-dialog-close" onclick="window.rolesManager.cancelAdDsFeatures()">✕</button>
                </div>
                <div class="win-dialog-body" style="padding: 16px;">
                    <div class="adds-prompt-header">
                        <div class="adds-prompt-icon">ℹ️</div>
                        <div class="adds-prompt-text">
                            <h3>Add features that are required for Active Directory Domain Services?</h3>
                            <p>Active Directory Domain Services cannot be installed unless the following role services or features are also installed:</p>
                        </div>
                    </div>

                    <div class="adds-required-tree">
                        <div class="tree-node">
                            <b>Remote Server Administration Tools (RSAT)</b>
                            <div class="sub-node">• Role Administration Tools</div>
                            <div class="sub-sub-node">• AD DS and AD LDS Tools</div>
                            <div class="sub-sub-node">• Active Directory module for Windows PowerShell</div>
                            <div class="sub-sub-node">• AD DS Snap-Ins and Command-Line Tools</div>
                        </div>
                        <div class="tree-node" style="margin-top: 8px;">
                            <b>Group Policy Management</b>
                        </div>
                    </div>

                    <div class="win-checkbox-row" style="margin-top: 14px;">
                        <input type="checkbox" id="chk-mgmt-tools" checked>
                        <label for="chk-mgmt-tools">Include management tools (if applicable)</label>
                    </div>

                    <div class="win-dialog-footer" style="margin-top: 18px; text-align: right; display: flex; justify-content: flex-end; gap: 8px;">
                        <button class="win-btn win-btn-accent" onclick="window.rolesManager.confirmAdDsFeatures()">Add Features</button>
                        <button class="win-btn" onclick="window.rolesManager.cancelAdDsFeatures()">Cancel</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(subModal);
    }

    confirmAdDsFeatures() {
        document.getElementById('wizard-submodal')?.remove();
        if (this.wizard) {
            this.wizard.selectedRoles.add('ad-ds');
            this.wizard.selectedFeatures.add('gpmc');
            this.wizard.selectedFeatures.add('rsat-ad-tools');
            this.wizard.selectedRoles.add('dns'); // AD DS requires DNS
            this.wizard.selectedRolePreview = 'ad-ds';
            this.renderWizardModal();
        }
    }

    cancelAdDsFeatures() {
        document.getElementById('wizard-submodal')?.remove();
        if (this.wizard) {
            this.wizard.selectedRoles.delete('ad-ds');
            this.renderWizardModal();
        }
    }

    wizardNext() {
        if (!this.wizard) return;
        const w = this.wizard;
        const hasAdDs = w.selectedRoles.has('ad-ds');
        const maxStep = hasAdDs ? 8 : 7;

        if (w.step < maxStep) {
            w.step++;
            this.renderWizardModal();
        }
    }

    wizardBack() {
        if (!this.wizard) return;
        if (this.wizard.step > 1 && !this.wizard.installing && !this.wizard.installComplete) {
            this.wizard.step--;
            this.renderWizardModal();
        }
    }

    closeWizard() {
        this.wizard = null;
        document.getElementById('wizard-submodal')?.remove();
        document.getElementById('modal-wizard-roles')?.remove();
        document.getElementById('modal-wizard-remove-roles')?.remove();
        if (window.windowsManager && window.windowsManager.openModals && window.windowsManager.openModals.size === 0) {
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) modalContainer.innerHTML = '';
        }
        window.windowsManager?.syncServerState();
    }

    startInstallation() {
        const w = this.wizard;
        if (!w) return;
        const hasAdDs = w.selectedRoles.has('ad-ds');
        w.step = hasAdDs ? 8 : 7;
        w.installing = true;
        w.installProgress = 0;
        this.renderWizardModal();

        const messages = [
            { pct: 15, msg: "Validating prerequisites on WIN-SERVER..." },
            { pct: 35, msg: "Installing Group Policy Management Tools..." },
            { pct: 55, msg: "Installing Active Directory Module for Windows PowerShell..." },
            { pct: 75, msg: "Installing Active Directory Domain Services binaries..." },
            { pct: 90, msg: "Configuring security catalogs and system services..." },
            { pct: 100, msg: "Installation succeeded on WIN-SERVER." }
        ];

        let msgIdx = 0;
        const interval = setInterval(() => {
            if (msgIdx < messages.length) {
                const item = messages[msgIdx];
                w.installProgress = item.pct;
                const fillEl = document.querySelector('.progress-bar-fill');
                const textEl = document.getElementById('wizard-progress-msg');
                if (fillEl) fillEl.style.width = `${item.pct}%`;
                if (textEl) textEl.textContent = item.msg;
                msgIdx++;
            } else {
                clearInterval(interval);
                w.installing = false;
                w.installComplete = true;

                // Commit state changes
                const roleIds = Array.from(w.selectedRoles);
                const featureIds = Array.from(w.selectedFeatures);
                window.systemState.installRolesAndFeatures(roleIds, featureIds);

                this.renderWizardModal();
            }
        }, 400);
    }

    // =========================================================================
    // REMOVE ROLES AND FEATURES WIZARD
    // =========================================================================
    openRemoveRolesWizard() {
        this.closeAllMenus();
        const state = window.systemState.getState();
        const installedRoles = (state.rolesAndFeatures?.roles || []).filter(r => r.installed && r.id !== 'file-storage');
        const installedFeatures = (state.rolesAndFeatures?.features || []).filter(f => f.installed && f.id !== 'powershell' && f.id !== 'windows-defender');

        this.wizard = {
            type: 'remove',
            step: 1,
            rolesToRemove: new Set(),
            featuresToRemove: new Set(),
            availableRoles: installedRoles,
            availableFeatures: installedFeatures,
            isRemoving: false,
            removeComplete: false
        };

        this.renderRemoveWizardModal();
    }

    renderRemoveWizardModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;
        const w = this.wizard;

        const steps = [
            { id: 1, label: 'Before You Begin' },
            { id: 2, label: 'Server Selection' },
            { id: 3, label: 'Server Roles' },
            { id: 4, label: 'Features' },
            { id: 5, label: 'Confirmation' },
            { id: 6, label: 'Results' }
        ];

        modalContainer.innerHTML = `
            <div id="modal-wizard-remove-roles" class="modal-backdrop">
                <div class="win-wizard-dialog">
                    <div class="win-wizard-titlebar">
                        <div class="win-wizard-title-left">
                            <span class="win-wizard-title-icon">🧙</span>
                            <span>Remove Roles and Features Wizard</span>
                        </div>
                        <button class="win-wizard-close" onclick="window.rolesManager.closeWizard()">✕</button>
                    </div>

                    <div class="win-wizard-container">
                        <div class="win-wizard-sidebar">
                            <div class="win-wizard-sidebar-title">WIN-SERVER</div>
                            <div class="win-wizard-steps-list">
                                ${steps.map(s => `
                                    <div class="win-wizard-step-item ${w.step === s.id ? 'active' : ''} ${w.step > s.id ? 'done' : ''}">
                                        <span class="step-bullet">${w.step > s.id ? '✓' : '•'}</span>
                                        <span class="step-name">${s.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="win-wizard-body">
                            ${this.renderRemoveStepContent()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderRemoveStepContent() {
        const w = this.wizard;
        const state = window.systemState.getState();

        if (w.step === 1) {
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Before You Begin</h2>
                    <p class="wizard-intro">
                        This wizard helps you remove roles, role services, or features from this server. Before continuing, verify that users or dependent client computers are not actively relying on the services you intend to remove.
                    </p>
                    <div class="wizard-prereq-box">
                        <p><b>Important guidelines before removal:</b></p>
                        <ul>
                            <li>Removing Active Directory Domain Services requires demoting the domain controller first if other domain controllers exist.</li>
                            <li>Removing web services or DNS will discontinue service resolution for networked clients.</li>
                        </ul>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.removeWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 2) {
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Select destination server</h2>
                    <p class="wizard-intro">Select the server from which you want to remove roles and features.</p>
                    <div class="wizard-table-wrap">
                        <table class="win-table wizard-server-table">
                            <thead>
                                <tr><th>Server Name</th><th>IP Address</th><th>Operating System</th></tr>
                            </thead>
                            <tbody>
                                <tr class="selected">
                                    <td><b>WIN-SERVER</b></td>
                                    <td>192.168.1.50</td>
                                    <td>${state.server.os}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.removeWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.removeWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 3) {
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Remove server roles</h2>
                    <p class="wizard-intro">Clear the check box for each role you want to remove from the server.</p>
                    <div class="wizard-tree-box" style="height: 250px;">
                        <div class="tree-list">
                            ${w.availableRoles.length === 0 ? `
                                <div style="padding: 15px; color: #888;">No removable roles currently installed.</div>
                            ` : w.availableRoles.map(role => {
                                const isMarkedForRemoval = w.rolesToRemove.has(role.id);
                                return `
                                    <div class="tree-item">
                                        <input type="checkbox" id="rem_role_${role.id}" ${isMarkedForRemoval ? 'checked' : ''} onchange="window.rolesManager.handleRemoveRoleToggle('${role.id}', this.checked)">
                                        <label for="rem_role_${role.id}">
                                            <span class="role-icon">${role.icon || '📁'}</span>
                                            <b>${role.name}</b>
                                            ${isMarkedForRemoval ? '<span style="color: #d83b01; font-weight: bold; margin-left: 6px;">(Marked for removal)</span>' : ''}
                                        </label>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.removeWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.removeWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 4) {
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Remove features</h2>
                    <p class="wizard-intro">Clear the check box for each feature you want to remove.</p>
                    <div class="wizard-tree-box" style="height: 250px;">
                        <div class="tree-list">
                            ${w.availableFeatures.length === 0 ? `
                                <div style="padding: 15px; color: #888;">No removable optional features installed.</div>
                            ` : w.availableFeatures.map(feat => {
                                const isMarked = w.featuresToRemove.has(feat.id);
                                return `
                                    <div class="tree-item">
                                        <input type="checkbox" id="rem_feat_${feat.id}" ${isMarked ? 'checked' : ''} onchange="window.rolesManager.handleRemoveFeatureToggle('${feat.id}', this.checked)">
                                        <label for="rem_feat_${feat.id}">
                                            <span>${feat.name}</span>
                                            ${isMarked ? '<span style="color: #d83b01; font-weight: bold; margin-left: 6px;">(Marked for removal)</span>' : ''}
                                        </label>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.removeWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.removeWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 5) {
            const count = w.rolesToRemove.size + w.featuresToRemove.size;
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Confirm removal selections</h2>
                    <p class="wizard-intro">Review the list of items that will be removed from WIN-SERVER.</p>
                    <div class="wizard-confirm-tree">
                        <div class="confirm-dest-node">
                            <b>WIN-SERVER</b>
                            ${count === 0 ? `
                                <div style="color: #888; margin-top: 8px;">No items marked for removal.</div>
                            ` : ''}
                            ${Array.from(w.rolesToRemove).map(rid => {
                                const r = state.rolesAndFeatures?.roles.find(x => x.id === rid);
                                return `<div class="confirm-item role" style="color: #a80000;">🗑️ <b>${r?.name || rid}</b></div>`;
                            }).join('')}
                            ${Array.from(w.featuresToRemove).map(fid => {
                                const f = state.rolesAndFeatures?.features.find(x => x.id === fid);
                                return `<div class="confirm-item feat" style="color: #a80000;">🗑️ <span>${f?.name || fid}</span></div>`;
                            }).join('')}
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.removeWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-accent" onclick="window.rolesManager.startRemoval()" ${count === 0 ? 'disabled' : ''}>Remove</button>
                    <button class="win-btn" onclick="window.rolesManager.closeWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 6) {
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">${w.removeComplete ? 'Removal results' : 'Removal progress'}</h2>
                    <div class="wizard-progress-card">
                        <div class="progress-bar-rail">
                            <div class="progress-bar-fill" style="width: ${w.removeProgress || 0}%"></div>
                        </div>
                        <div class="progress-status-text" id="rem-progress-msg">
                            ${w.removeComplete ? 'Removal succeeded on WIN-SERVER.' : 'Starting feature removal...'}
                        </div>
                    </div>
                    ${w.removeComplete ? `
                        <div class="wizard-results-summary">
                            <div class="result-header">
                                <span class="result-icon">✅</span>
                                <div class="result-title-box">
                                    <b>Removal succeeded on WIN-SERVER.</b>
                                    <p>The selected roles and features have been cleanly uninstalled from the system.</p>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.closeWizard()" ${!w.removeComplete ? 'disabled' : ''}>Close</button>
                </div>
            `;
        }

        return '';
    }

    handleRemoveRoleToggle(roleId, isChecked) {
        if (isChecked) this.wizard.rolesToRemove.add(roleId);
        else this.wizard.rolesToRemove.delete(roleId);
        this.renderRemoveWizardModal();
    }

    handleRemoveFeatureToggle(featureId, isChecked) {
        if (isChecked) this.wizard.featuresToRemove.add(featureId);
        else this.wizard.featuresToRemove.delete(featureId);
        this.renderRemoveWizardModal();
    }

    removeWizardNext() {
        if (this.wizard && this.wizard.step < 6) {
            this.wizard.step++;
            this.renderRemoveWizardModal();
        }
    }

    removeWizardBack() {
        if (this.wizard && this.wizard.step > 1 && !this.wizard.isRemoving && !this.wizard.removeComplete) {
            this.wizard.step--;
            this.renderRemoveWizardModal();
        }
    }

    startRemoval() {
        const w = this.wizard;
        if (!w) return;
        w.step = 6;
        w.isRemoving = true;
        w.removeProgress = 0;
        this.renderRemoveWizardModal();

        const steps = [
            { pct: 25, msg: "Stopping dependent services..." },
            { pct: 60, msg: "Removing role binaries and registry definitions..." },
            { pct: 85, msg: "Updating component store..." },
            { pct: 100, msg: "Removal succeeded on WIN-SERVER." }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < steps.length) {
                const s = steps[idx];
                w.removeProgress = s.pct;
                const fillEl = document.querySelector('.progress-bar-fill');
                const textEl = document.getElementById('rem-progress-msg');
                if (fillEl) fillEl.style.width = `${s.pct}%`;
                if (textEl) textEl.textContent = s.msg;
                idx++;
            } else {
                clearInterval(interval);
                w.isRemoving = false;
                w.removeComplete = true;

                // Commit removal
                window.systemState.uninstallRolesAndFeatures(
                    Array.from(w.rolesToRemove),
                    Array.from(w.featuresToRemove)
                );

                this.renderRemoveWizardModal();
            }
        }, 400);
    }

    // =========================================================================
    // ACTIVE DIRECTORY DOMAIN SERVICES CONFIGURATION WIZARD (PROMOTION)
    // =========================================================================
    openDCPromotionWizard() {
        this.closeAllMenus();
        this.closeWizard(); // Close add wizard if open

        this.dcWizard = {
            step: 1,
            deploymentType: 'new-forest',
            rootDomain: 'corp.contoso.com',
            netbios: 'CORP',
            dsrmPassword: 'Password123!',
            installDns: true,
            isGlobalCatalog: true,
            progress: 0,
            isPromoting: false,
            isDone: false
        };

        this.renderDcWizardModal();
    }

    renderDcWizardModal() {
        const modalContainer = document.getElementById('modal-container');
        if (!modalContainer) return;

        const w = this.dcWizard;
        const steps = [
            { id: 1, label: 'Deployment Configuration' },
            { id: 2, label: 'Domain Controller Options' },
            { id: 3, label: 'DNS Options' },
            { id: 4, label: 'Additional Options' },
            { id: 5, label: 'Paths' },
            { id: 6, label: 'Review Options' },
            { id: 7, label: 'Prerequisites Check' },
            { id: 8, label: 'Installation' }
        ];

        modalContainer.innerHTML = `
            <div id="modal-wizard-dc" class="modal-backdrop">
                <div class="win-wizard-dialog dc-promo-dialog">
                    <div class="win-wizard-titlebar">
                        <div class="win-wizard-title-left">
                            <span class="win-wizard-title-icon">🌳</span>
                            <span>Active Directory Domain Services Configuration Wizard</span>
                        </div>
                        <button class="win-wizard-close" onclick="window.rolesManager.closeDcWizard()">✕</button>
                    </div>

                    <div class="win-wizard-container">
                        <div class="win-wizard-sidebar">
                            <div class="win-wizard-sidebar-title">WIN-SERVER</div>
                            <div class="win-wizard-steps-list">
                                ${steps.map(s => `
                                    <div class="win-wizard-step-item ${w.step === s.id ? 'active' : ''} ${w.step > s.id ? 'done' : ''}">
                                        <span class="step-bullet">${w.step > s.id ? '✓' : '•'}</span>
                                        <span class="step-name">${s.label}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>

                        <div class="win-wizard-body">
                            ${this.renderDcStepContent()}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    renderDcStepContent() {
        const w = this.dcWizard;

        if (w.step === 1) {
            // Deployment Configuration
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Deployment Configuration</h2>
                    <p class="wizard-intro">Select the deployment operation for this server.</p>

                    <div class="wizard-radio-group">
                        <label class="wizard-radio-option" style="opacity: 0.6;">
                            <input type="radio" name="dc-op" disabled>
                            <div class="radio-text">
                                <b>Add a domain controller to an existing domain</b>
                            </div>
                        </label>
                        <label class="wizard-radio-option" style="opacity: 0.6;">
                            <input type="radio" name="dc-op" disabled>
                            <div class="radio-text">
                                <b>Add a new domain to an existing forest</b>
                            </div>
                        </label>
                        <label class="wizard-radio-option">
                            <input type="radio" name="dc-op" value="new-forest" checked>
                            <div class="radio-text">
                                <b>Add a new forest</b>
                                <p>Create a new Active Directory domain tree and root forest.</p>
                            </div>
                        </label>
                    </div>

                    <div class="dc-config-section" style="margin-top: 20px;">
                        <h4 style="margin-bottom: 8px;">Specify the domain information for this operation</h4>
                        <div class="win-form-row">
                            <label style="width: 140px;">Root domain name:</label>
                            <input type="text" 
                                   id="dc-root-domain-input" 
                                   class="win-input" 
                                   style="width: 280px;" 
                                   value="${w.rootDomain}" 
                                   oninput="window.rolesManager.updateRootDomain(this.value)">
                        </div>
                        <small style="color: #666; margin-left: 140px;">Example: corp.contoso.com or itlab.local</small>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 2) {
            // Domain Controller Options
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Domain Controller Options</h2>
                    <p class="wizard-intro">Specify domain controller capabilities and the restore mode password.</p>

                    <div class="dc-options-grid">
                        <div class="opt-row">
                            <label>Forest functional level:</label>
                            <select class="win-select" disabled>
                                <option selected>Windows Server 2022</option>
                            </select>
                        </div>
                        <div class="opt-row">
                            <label>Domain functional level:</label>
                            <select class="win-select" disabled>
                                <option selected>Windows Server 2022</option>
                            </select>
                        </div>
                    </div>

                    <div style="margin: 16px 0;">
                        <b>Specify domain controller capabilities:</b>
                        <div class="win-checkbox-row" style="margin-top: 6px;">
                            <input type="checkbox" id="chk-dns" checked disabled>
                            <label for="chk-dns">Domain Name System (DNS) server</label>
                        </div>
                        <div class="win-checkbox-row">
                            <input type="checkbox" id="chk-gc" checked disabled>
                            <label for="chk-gc">Global Catalog (GC)</label>
                        </div>
                    </div>

                    <div class="dsrm-password-box">
                        <b>Type the Directory Services Restore Mode (DSRM) password:</b>
                        <div class="win-form-row" style="margin-top: 8px;">
                            <label style="width: 140px;">Password:</label>
                            <input type="password" value="${w.dsrmPassword}" class="win-input" style="width: 220px;" disabled>
                        </div>
                        <div class="win-form-row">
                            <label style="width: 140px;">Confirm password:</label>
                            <input type="password" value="${w.dsrmPassword}" class="win-input" style="width: 220px;" disabled>
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 3) {
            // DNS Options
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">DNS Options</h2>
                    <p class="wizard-intro">Specify DNS delegation options.</p>

                    <div class="adds-warning-box">
                        <div class="warn-icon">⚠️</div>
                        <div class="warn-text">
                            <b>A delegation for this DNS server cannot be created because the authoritative parent zone cannot be found.</b>
                            <p>This is expected during creation of a new root forest. The wizard will automatically configure this server as the authoritative root DNS server.</p>
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 4) {
            // Additional Options (NetBIOS)
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Additional Options</h2>
                    <p class="wizard-intro">Verify the NetBIOS domain name assigned to the domain.</p>

                    <div class="win-form-row" style="margin-top: 20px;">
                        <label style="width: 160px;">The NetBIOS domain name:</label>
                        <input type="text" class="win-input" style="width: 180px;" value="${w.netbios}" oninput="window.rolesManager.dcWizard.netbios = this.value.toUpperCase()">
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 5) {
            // Paths
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Paths</h2>
                    <p class="wizard-intro">Specify the location of the AD DS database, log files, and SYSVOL.</p>

                    <div class="win-form-row" style="margin-top: 15px;">
                        <label style="width: 140px;">Database folder:</label>
                        <input type="text" class="win-input" style="width: 260px;" value="C:\\Windows\\NTDS" disabled>
                    </div>
                    <div class="win-form-row">
                        <label style="width: 140px;">Log files folder:</label>
                        <input type="text" class="win-input" style="width: 260px;" value="C:\\Windows\\NTDS" disabled>
                    </div>
                    <div class="win-form-row">
                        <label style="width: 140px;">SYSVOL folder:</label>
                        <input type="text" class="win-input" style="width: 260px;" value="C:\\Windows\\SYSVOL" disabled>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 6) {
            // Review Options
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Review Options</h2>
                    <p class="wizard-intro">Review your selections before configuring this server.</p>

                    <div class="wizard-script-preview">
                        <pre>
# Windows PowerShell script for AD DS Deployment
Import-Module ADDSDeployment
Install-ADDSForest \`
    -CreateDnsDelegation:$false \`
    -DatabasePath "C:\\Windows\\NTDS" \`
    -DomainMode "WinThreshold" \`
    -DomainName "${w.rootDomain}" \`
    -DomainNetbiosName "${w.netbios}" \`
    -ForestMode "WinThreshold" \`
    -InstallDns:$true \`
    -LogPath "C:\\Windows\\NTDS" \`
    -NoRebootOnCompletion:$false \`
    -SysvolPath "C:\\Windows\\SYSVOL" \`
    -Force:$true
                        </pre>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.dcWizardNext()">Next &gt;</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 7) {
            // Prerequisites Check
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">Prerequisites Check</h2>
                    <p class="wizard-intro">Validating prerequisites before Active Directory Domain Services configuration.</p>

                    <div class="prereq-check-result ok">
                        <div class="check-icon">✅</div>
                        <div class="check-text">
                            <b>All prerequisite checks passed successfully. Click 'Install' to begin installation.</b>
                            <p>The system is ready to be promoted to a domain controller for forest <b>${w.rootDomain}</b>.</p>
                        </div>
                    </div>
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" onclick="window.rolesManager.dcWizardBack()">&lt; Previous</button>
                    <button class="win-btn win-btn-accent" onclick="window.rolesManager.startDcPromotion()">Install</button>
                    <button class="win-btn" onclick="window.rolesManager.closeDcWizard()">Cancel</button>
                </div>
            `;
        } else if (w.step === 8) {
            // Installation & Progress
            return `
                <div class="wizard-page">
                    <h2 class="wizard-heading">${w.isDone ? 'Promotion Complete' : 'Configuring Active Directory Domain Services'}</h2>
                    <div class="wizard-progress-card">
                        <div class="progress-bar-rail">
                            <div class="progress-bar-fill" style="width: ${w.progress}%"></div>
                        </div>
                        <div class="progress-status-text" id="dc-promo-status">
                            ${w.isDone ? 'Successfully configured WIN-SERVER as a domain controller.' : 'Initializing Directory Service partition...'}
                        </div>
                    </div>

                    ${w.isDone ? `
                        <div class="wizard-results-summary">
                            <div class="result-header">
                                <span class="result-icon">✅</span>
                                <div class="result-title-box">
                                    <b>The server was successfully configured as a domain controller.</b>
                                    <p>Domain: <b>${w.rootDomain.toUpperCase()}</b> | NetBIOS: <b>${w.netbios}</b></p>
                                </div>
                            </div>
                            <div class="adds-post-install-box" style="margin-top: 15px;">
                                <p>You can now administer users, groups, and organizational units using <b>Active Directory Users and Computers (dsa.msc)</b>.</p>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="wizard-footer">
                    <button class="win-btn" disabled>&lt; Previous</button>
                    <button class="win-btn win-btn-default" onclick="window.rolesManager.finishDcPromotion()" ${!w.isDone ? 'disabled' : ''}>Close</button>
                </div>
            `;
        }

        return '';
    }

    updateRootDomain(val) {
        if (!this.dcWizard) return;
        this.dcWizard.rootDomain = val.trim();
        const prefix = val.split('.')[0] || 'CORP';
        this.dcWizard.netbios = prefix.toUpperCase();
    }

    dcWizardNext() {
        if (this.dcWizard && this.dcWizard.step < 8) {
            this.dcWizard.step++;
            this.renderDcWizardModal();
        }
    }

    dcWizardBack() {
        if (this.dcWizard && this.dcWizard.step > 1 && !this.dcWizard.isPromoting && !this.dcWizard.isDone) {
            this.dcWizard.step--;
            this.renderDcWizardModal();
        }
    }

    closeDcWizard() {
        this.dcWizard = null;
        document.getElementById('modal-wizard-dc')?.remove();
        if (window.windowsManager && window.windowsManager.openModals && window.windowsManager.openModals.size === 0) {
            const modalContainer = document.getElementById('modal-container');
            if (modalContainer) modalContainer.innerHTML = '';
        }
        window.windowsManager?.syncServerState();
    }

    startDcPromotion() {
        const w = this.dcWizard;
        if (!w) return;
        w.step = 8;
        w.isPromoting = true;
        w.progress = 0;
        this.renderDcWizardModal();

        const steps = [
            { pct: 20, msg: "Configuring Directory Service schema and root partition..." },
            { pct: 40, msg: `Creating directory partition DC=${w.rootDomain.split('.').join(',DC=')}...` },
            { pct: 60, msg: "Configuring DNS Server service on this computer..." },
            { pct: 80, msg: "Configuring LSA security policies and Kerberos KDC..." },
            { pct: 95, msg: "Setting up SYSVOL share at C:\\Windows\\SYSVOL..." },
            { pct: 100, msg: "Successfully configured WIN-SERVER as a domain controller." }
        ];

        let idx = 0;
        const interval = setInterval(() => {
            if (idx < steps.length) {
                const s = steps[idx];
                w.progress = s.pct;
                const fillEl = document.querySelector('.progress-bar-fill');
                const textEl = document.getElementById('dc-promo-status');
                if (fillEl) fillEl.style.width = `${s.pct}%`;
                if (textEl) textEl.textContent = s.msg;
                idx++;
            } else {
                clearInterval(interval);
                w.isPromoting = false;
                w.isDone = true;

                // Commit promotion to central state
                window.systemState.promoteToDomainController({
                    forestName: w.rootDomain,
                    netbiosName: w.netbios,
                    dsrmPassword: w.dsrmPassword
                });

                this.renderDcWizardModal();
            }
        }, 450);
    }

    finishDcPromotion() {
        this.closeDcWizard();
        // Refresh Server Manager
        window.windowsManager?.syncServerState();
    }

    // =========================================================================
    // ACTIVE DIRECTORY USERS AND COMPUTERS (dsa.msc) MMC SNAP-IN
    // =========================================================================
    renderAduc(clientEl, winId) {
        const state = window.systemState.getState();
        const dc = state.rolesAndFeatures?.domainController || {};
        const domain = (dc.forestName || 'corp.contoso.com').toLowerCase();

        clientEl.innerHTML = `
            <div class="aduc-wrapper">
                <!-- MMC Menubar -->
                <div class="mmc-menubar">
                    <div class="mmc-menu-item">File</div>
                    <div class="mmc-menu-item">Action</div>
                    <div class="mmc-menu-item">View</div>
                    <div class="mmc-menu-item">Help</div>
                </div>

                <!-- MMC Toolbar -->
                <div class="mmc-toolbar">
                    <button class="mmc-tb-btn" title="Back" disabled>◀</button>
                    <button class="mmc-tb-btn" title="Forward" disabled>▶</button>
                    <button class="mmc-tb-btn" title="Up" disabled>▲</button>
                    <div class="mmc-tb-sep"></div>
                    <button class="mmc-tb-btn" title="Create New User in current container" onclick="window.rolesManager.aducNewUser('${winId}')">
                        <span class="icon">👤+</span> New User
                    </button>
                    <button class="mmc-tb-btn" title="Create New Security Group in current container" onclick="window.rolesManager.aducNewGroup('${winId}')">
                        <span class="icon">👥+</span> New Group
                    </button>
                    <div class="mmc-tb-sep"></div>
                    <button class="mmc-tb-btn" title="Properties" onclick="window.rolesManager.aducProperties('${winId}')">
                        <span class="icon">📋</span> Properties
                    </button>
                </div>

                <!-- MMC Main Body (3-Pane Split) -->
                <div class="aduc-body">
                    <!-- Left Tree Pane -->
                    <div class="aduc-tree-pane">
                        <div class="aduc-tree-root">
                            <span class="tree-expander">▼</span>
                            <span class="tree-icon">🌳</span>
                            <b>Active Directory Users and Computers [WIN-SERVER.${domain}]</b>
                        </div>
                        <div class="aduc-tree-sub">
                            <div class="aduc-tree-domain">
                                <span class="tree-expander">▼</span>
                                <span class="tree-icon">🌐</span>
                                <b>${domain}</b>
                            </div>
                            <div class="aduc-tree-containers">
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'Builtin' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'Builtin')">
                                    <span class="tree-icon">📁</span> Builtin
                                </div>
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'Computers' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'Computers')">
                                    <span class="tree-icon">📁</span> Computers
                                </div>
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'Domain Controllers' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'Domain Controllers')">
                                    <span class="tree-icon">🏢</span> Domain Controllers
                                </div>
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'ForeignSecurityPrincipals' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'ForeignSecurityPrincipals')">
                                    <span class="tree-icon">📁</span> ForeignSecurityPrincipals
                                </div>
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'Managed Service Accounts' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'Managed Service Accounts')">
                                    <span class="tree-icon">📁</span> Managed Service Accounts
                                </div>
                                <div class="aduc-tree-item ${this.selectedAducContainer === 'Users' ? 'active' : ''}" onclick="window.rolesManager.switchAducContainer('${winId}', 'Users')">
                                    <span class="tree-icon">📁</span> Users
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Right Objects List Pane -->
                    <div class="aduc-list-pane" id="aduc_list_${winId}">
                        ${this.renderAducListContent()}
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="mmc-statusbar">
                    <span id="aduc-status-count">${this.getAducStatusCount()}</span>
                </div>
            </div>
        `;
    }

    switchAducContainer(winId, containerName) {
        this.selectedAducContainer = containerName;
        document.querySelectorAll(`#client_${winId} .aduc-tree-item`).forEach(el => el.classList.remove('active'));
        event?.currentTarget?.classList.add('active');

        const listEl = document.getElementById(`aduc_list_${winId}`);
        if (listEl) {
            listEl.innerHTML = this.renderAducListContent();
        }

        const countEl = document.getElementById('aduc-status-count');
        if (countEl) {
            countEl.textContent = this.getAducStatusCount();
        }
    }

    renderAducListContent() {
        const state = window.systemState.getState();
        const container = this.selectedAducContainer;

        if (container === 'Domain Controllers') {
            return `
                <table class="win-table mmc-table">
                    <thead>
                        <tr>
                            <th style="width: 200px;">Name</th>
                            <th style="width: 120px;">Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="tree-icon">💻</span> <b>WIN-SERVER</b></td>
                            <td>Computer</td>
                            <td>Primary Domain Controller (GC, DNS)</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else if (container === 'Computers') {
            return `
                <table class="win-table mmc-table">
                    <thead>
                        <tr>
                            <th style="width: 200px;">Name</th>
                            <th style="width: 120px;">Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><span class="tree-icon">💻</span> <b>WIN-CLIENT-01</b></td>
                            <td>Computer</td>
                            <td>Finance Workstation (Joined to Domain)</td>
                        </tr>
                    </tbody>
                </table>
            `;
        } else if (container === 'Builtin') {
            const builtinGroups = [
                { name: "Administrators", desc: "Administrators have complete and unrestricted access to the computer/domain" },
                { name: "Users", desc: "Users are prevented from making accidental or intentional system-wide changes" },
                { name: "Guests", desc: "Guests have the same access as members of the Users group by default" },
                { name: "Account Operators", desc: "Members can administer domain user and group accounts" },
                { name: "Backup Operators", desc: "Backup Operators can override security restrictions for the purpose of backing up" },
                { name: "Server Operators", desc: "Members can administer domain controllers" }
            ];

            return `
                <table class="win-table mmc-table">
                    <thead>
                        <tr>
                            <th style="width: 200px;">Name</th>
                            <th style="width: 180px;">Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${builtinGroups.map(g => `
                            <tr>
                                <td><span class="tree-icon">👥</span> <b>${g.name}</b></td>
                                <td>Security Group - Builtin Local</td>
                                <td>${g.desc}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        } else {
            // Users container: Lists domain users and domain security groups
            const users = state.users || [];
            const groups = state.groups || [];

            return `
                <table class="win-table mmc-table">
                    <thead>
                        <tr>
                            <th style="width: 200px;">Name</th>
                            <th style="width: 180px;">Type</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        <!-- Users -->
                        ${users.map(u => `
                            <tr class="aduc-row" ondblclick="window.usersManager?.openUserProperties('${u.username}')">
                                <td>
                                    <span class="tree-icon">👤</span>
                                    <b>${u.fullName || u.username}</b>
                                    ${u.disabled ? '<small style="color: #999;">(Disabled)</small>' : ''}
                                </td>
                                <td>User</td>
                                <td>${u.description || ''}</td>
                            </tr>
                        `).join('')}

                        <!-- Groups -->
                        ${groups.map(g => `
                            <tr class="aduc-row" ondblclick="window.groupsManager?.openGroupProperties('${g.name}')">
                                <td>
                                    <span class="tree-icon">👥</span>
                                    <b>${g.name}</b>
                                </td>
                                <td>Security Group - Global</td>
                                <td>${g.description || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }
    }

    getAducStatusCount() {
        const state = window.systemState.getState();
        if (this.selectedAducContainer === 'Users') {
            const total = (state.users?.length || 0) + (state.groups?.length || 0);
            return `${total} objects (Users & Security Groups)`;
        } else if (this.selectedAducContainer === 'Domain Controllers') {
            return `1 objects (WIN-SERVER)`;
        } else if (this.selectedAducContainer === 'Computers') {
            return `1 objects`;
        } else if (this.selectedAducContainer === 'Builtin') {
            return `6 objects`;
        }
        return `0 objects`;
    }

    aducNewUser(winId) {
        if (window.usersManager) {
            window.usersManager.openNewUserDialog();
        }
    }

    aducNewGroup(winId) {
        if (window.groupsManager) {
            window.groupsManager.openNewGroupDialog();
        }
    }

    aducProperties(winId) {
        alert("Properties: Select an object from the list to view its properties.");
    }
}

// Global instance exported to window
window.rolesManager = new RolesManager();
