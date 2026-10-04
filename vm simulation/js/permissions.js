/**
 * System Administration Simulator - File Explorer & NTFS Permissions Engine
 * Controls File Explorer, Folder Properties (Security tab),
 * Advanced Security Settings (Effective Access), and the Security & Access Test utility.
 */

class PermissionsManager {
    constructor() {
        this.currentPath = "C:\\";
        this.selectedResource = null;
        this.selectedAclPrincipal = "GRP_Finance";
        this.activeSessionUser = "Administrator";

        this.init();
    }

    init() {
        window.systemState.subscribe((state, changeKey) => {
            if (['resources', 'permissions', 'users', 'groups', 'all'].includes(changeKey)) {
                this.refreshExplorer();
            }
        });
    }

    // Helper to sanitize resource paths for DOM modal IDs
    getCleanPathId(resourcePath) {
        return (resourcePath || 'root').replace(/[^a-zA-Z0-9]/g, '_');
    }

    normalizePath(p) {
        if (!p || p === 'This PC' || p === 'Network') return 'C:\\';
        let norm = String(p).trim().replace(/\//g, '\\');
        norm = norm.replace(/^([a-zA-Z]):(?=[^\\])/, '$1:\\');
        if (/^[a-zA-Z]:$/.test(norm)) norm += '\\';
        norm = norm.replace(/([^:])\\{2,}/g, '$1\\');
        if (norm.length > 3 && norm.endsWith('\\')) {
            norm = norm.replace(/\\+$/, '');
        }
        if (window.systemState && window.systemState.getState && window.systemState.getState().resources) {
            const resMap = window.systemState.getState().resources;
            if (resMap[norm]) return norm;
            const normLower = norm.toLowerCase();
            for (const key of Object.keys(resMap)) {
                if (key.toLowerCase() === normLower) {
                    return key;
                }
            }
        }
        return norm;
    }

    escapeJsArg(str) {
        if (!str) return '';
        return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
    }

    // --- FILE EXPLORER (explorer.exe) ---
    renderFileExplorer(clientEl, winId, params = {}) {
        const initialPath = this.normalizePath(params.path || "C:\\");
        this.currentPath = initialPath;

        clientEl.innerHTML = `
            <div class="explorer-wrapper">
                <!-- Ribbon / Navigation Bar -->
                <div class="explorer-toolbar">
                    <button class="exp-nav-btn" onclick="window.permissionsManager.navBack('${winId}')" title="Back">⬅️</button>
                    <button class="exp-nav-btn" onclick="window.permissionsManager.navUp('${winId}')" title="Up to Parent">⬆️</button>
                    
                    <div class="exp-address-bar">
                        <span class="exp-addr-icon">📁</span>
                        <input type="text" id="exp-addr-${winId}" value="${this.currentPath}" 
                               onkeydown="if(event.key==='Enter') window.permissionsManager.navigateTo('${winId}', this.value)" />
                    </div>

                    <div class="exp-session-selector" title="Simulate operating as this user account">
                        <span style="font-size: 11px; color: #555;">Active User:</span>
                        <select id="exp-session-user-${winId}" class="win-select" onchange="window.permissionsManager.activeSessionUser = this.value">
                            ${window.systemState.getState().users.map(u => `
                                <option value="${u.username}" ${u.username === this.activeSessionUser ? 'selected' : ''}>
                                    ${u.username} ${u.disabled ? '(Disabled)' : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                </div>

                <!-- Explorer Quick Action Strip -->
                <div class="exp-action-strip">
                    <button class="win-btn win-btn-sm" onclick="window.permissionsManager.promptNewFolder('${winId}')">➕ New Folder</button>
                    <button class="win-btn win-btn-sm" onclick="window.permissionsManager.promptNewFile('${winId}')">📄 New File</button>
                    <button class="win-btn win-btn-sm" onclick="window.permissionsManager.openSecurityProperties(window.permissionsManager.currentPath)">🛡️ Security Properties</button>
                    <button class="win-btn win-btn-sm" onclick="window.windowsManager.openApp('security-test')">🧪 Test Access</button>
                </div>

                <!-- Explorer Main Split View -->
                <div class="explorer-body-split">
                    <!-- Left Quick Access Tree -->
                    <div class="explorer-quick-nav" id="exp-qnav-${winId}">
                        <!-- Rendered by renderQuickNav -->
                    </div>

                    <!-- Right File View -->
                    <div class="explorer-files-view" id="exp-files-${winId}" oncontextmenu="window.permissionsManager.showExplorerEmptyContextMenu(event, '${winId}')">
                        <!-- Rendered by renderFolderContents -->
                    </div>
                </div>

                <!-- Explorer Status Bar -->
                <div class="explorer-status-bar">
                    <span id="exp-status-${winId}">Ready</span>
                </div>
            </div>
        `;

        this.renderQuickNav(winId);
        this.renderFolderContents(winId, this.currentPath);
    }

    renderQuickNav(winId) {
        const qnavEl = document.getElementById(`exp-qnav-${winId}`);
        if (!qnavEl) return;

        const resources = window.systemState.getState().resources || {};
        const cDrive = resources["C:\\"] || { items: [] };
        const curPath = this.normalizePath(this.currentPath);

        const folderNames = new Set();
        (cDrive.items || []).forEach(name => {
            const full = `C:\\${name}`;
            if (!resources[full] || resources[full].type === 'folder') {
                folderNames.add(name);
            }
        });

        // Always list FinanceData so student can directly navigate or right-click to inspect/create
        folderNames.add("FinanceData");

        const sortedFolders = Array.from(folderNames).sort((a, b) => {
            if (a === 'FinanceData') return -1;
            if (b === 'FinanceData') return 1;
            return a.localeCompare(b);
        });

        let html = `
            <div class="qnav-item ${curPath === 'C:\\' ? 'active' : ''}" 
                 data-path="C:\\" 
                 onclick="window.permissionsManager.handleQnavClick(this, '${winId}')" 
                 oncontextmenu="window.permissionsManager.handleQnavContextMenu(event, this, '${winId}')">
                <span class="icon">💻</span> This PC
            </div>
            <div class="qnav-item ${curPath === 'C:\\' ? 'active' : ''}" 
                 data-path="C:\\" 
                 onclick="window.permissionsManager.handleQnavClick(this, '${winId}')" 
                 oncontextmenu="window.permissionsManager.handleQnavContextMenu(event, this, '${winId}')">
                <span class="indent"></span><span class="icon">💽</span> Local Disk (C:)
            </div>
        `;

        for (const fName of sortedFolders) {
            const fPath = `C:\\${fName}`;
            const isActive = curPath === fPath;
            const exists = !!resources[fPath];

            html += `
                <div class="qnav-item ${isActive ? 'active' : ''}" 
                     data-path="${fPath}" 
                     title="${exists ? fPath : fPath + ' (Click or right-click to access)'}"
                     onclick="window.permissionsManager.handleQnavClick(this, '${winId}')" 
                     oncontextmenu="window.permissionsManager.handleQnavContextMenu(event, this, '${winId}')">
                    <span class="indent"></span><span class="indent"></span><span class="icon">📁</span> ${fName}
                </div>
            `;
        }

        qnavEl.innerHTML = html;
    }

    handleQnavClick(el, winId) {
        if (!el) return;
        const rawPath = el.getAttribute('data-path');
        if (!rawPath) return;
        const path = this.normalizePath(rawPath);
        this.navigateTo(winId, path);
    }

    handleQnavContextMenu(e, el, winId) {
        e.preventDefault();
        e.stopPropagation();
        if (!el) return;
        const rawPath = el.getAttribute('data-path');
        if (!rawPath) return;
        const path = this.normalizePath(rawPath);
        this.showResourceContextMenu(e, path, winId);
    }

    renderFolderContents(winId, folderPath) {
        const filesEl = document.getElementById(`exp-files-${winId}`);
        const statusEl = document.getElementById(`exp-status-${winId}`);
        const addrIn = document.getElementById(`exp-addr-${winId}`);
        if (!filesEl) return;

        folderPath = this.normalizePath(folderPath);

        this.currentPath = folderPath;
        if (addrIn) addrIn.value = folderPath;

        const res = window.systemState.getState().resources[folderPath];
        if (!res) {
            const folderName = folderPath.split('\\').pop() || folderPath;
            const safePath = this.escapeJsArg(folderPath);
            filesEl.innerHTML = `
                <div class="empty-folder-card" style="padding: 32px 20px; text-align: center; color: #555;">
                    <div style="font-size: 40px; margin-bottom: 12px;">📁</div>
                    <div style="font-weight: 600; font-size: 14px; margin-bottom: 6px; color: #222;">Folder not created yet</div>
                    <div style="font-size: 12px; color: #666; margin-bottom: 18px;">
                        The folder <code>${folderPath}</code> has not been created on this drive yet.
                    </div>
                    <div style="display: flex; gap: 8px; justify-content: center;">
                        <button class="win-btn win-btn-primary" onclick="window.permissionsManager.createSpecificFolder('${winId}', '${safePath}')">
                            ➕ Create "${folderName}" Folder Here
                        </button>
                        <button class="win-btn" onclick="window.permissionsManager.navigateTo('${winId}', 'C:\\\\')">
                            Go to Local Disk (C:)
                        </button>
                    </div>
                </div>
            `;
            if (statusEl) statusEl.textContent = 'Location not found';
            return;
        }

        const items = res.items || [];
        if (statusEl) statusEl.textContent = `${items.length} item(s)`;

        if (items.length === 0) {
            filesEl.innerHTML = `
                <div class="empty-folder-msg" style="padding: 40px 20px; text-align: center; color: #777;">
                    <div style="font-size: 32px; margin-bottom: 8px; opacity: 0.6;">📂</div>
                    <div>This folder is empty.</div>
                    <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: center;">
                        <button class="win-btn win-btn-sm" onclick="window.permissionsManager.promptNewFolder('${winId}')">➕ New Folder</button>
                        <button class="win-btn win-btn-sm" onclick="window.permissionsManager.promptNewFile('${winId}')">📄 New File</button>
                    </div>
                </div>
            `;
            return;
        }

        filesEl.innerHTML = `
            <table class="win-table explorer-table">
                <thead>
                    <tr>
                        <th style="width: 280px;">Name</th>
                        <th style="width: 150px;">Date modified</th>
                        <th style="width: 100px;">Type</th>
                        <th style="width: 100px;">Size</th>
                    </tr>
                </thead>
                <tbody>
                    ${items.map(itemName => {
                        const itemPath = `${folderPath.replace(/\\$/, '')}\\${itemName}`;
                        const itemData = window.systemState.getState().resources[itemPath] || {
                            name: itemName,
                            type: itemName.includes('.') ? 'file' : 'folder',
                            size: itemName.includes('.') ? '24 KB' : '',
                            created: '2026-10-01 09:30'
                        };
                        const isFolder = itemData.type === 'folder';

                        return `
                            <tr class="explorer-row" 
                                data-path="${itemPath}"
                                onclick="window.permissionsManager.handleRowClick(this)" 
                                ondblclick="window.permissionsManager.handleRowDblClick(this, '${winId}')" 
                                oncontextmenu="window.permissionsManager.handleRowContextMenu(event, this, '${winId}')">
                                <td>
                                    <span class="exp-icon">${isFolder ? '📁' : '📄'}</span>
                                    <b>${itemName}</b>
                                </td>
                                <td>${itemData.created || '2026-10-01 09:30'}</td>
                                <td>${isFolder ? 'File folder' : 'Document'}</td>
                                <td>${itemData.size || ''}</td>
                            </tr>
                        `;
                    }).join('')}
                </tbody>
            </table>
        `;
    }

    handleRowClick(rowEl) {
        if (!rowEl) return;
        const itemPath = rowEl.getAttribute('data-path');
        this.selectExplorerItem(itemPath, rowEl);
    }

    handleRowDblClick(rowEl, winId) {
        if (!rowEl) return;
        const itemPath = rowEl.getAttribute('data-path');
        this.handleItemDoubleClick(winId, itemPath);
    }

    handleRowContextMenu(e, rowEl, winId) {
        e.preventDefault();
        e.stopPropagation();
        if (!rowEl) return;
        const itemPath = rowEl.getAttribute('data-path');
        this.selectExplorerItem(itemPath, rowEl);
        this.showResourceContextMenu(e, itemPath, winId);
    }

    selectExplorerItem(itemPath, rowEl) {
        this.selectedResource = this.normalizePath(itemPath);
        document.querySelectorAll('.explorer-row').forEach(r => r.classList.remove('selected'));
        if (rowEl) rowEl.classList.add('selected');
    }

    handleItemDoubleClick(winId, itemPath) {
        itemPath = this.normalizePath(itemPath);
        const res = window.systemState.getState().resources[itemPath];
        if (!res) return;

        // Perform access check with the current active session user
        const check = window.systemState.evaluateAccess(this.activeSessionUser, itemPath, "List");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, itemPath, "List / Open Folder", check);
            return;
        }

        if (res.type === 'folder') {
            this.renderFolderContents(winId, itemPath);
            this.renderQuickNav(winId);
        } else {
            this.openFileContent(itemPath);
        }
    }

    navigateTo(winId, path) {
        path = this.normalizePath(path);
        this.renderFolderContents(winId, path);
        this.renderQuickNav(winId);
    }

    navUp(winId) {
        if (this.currentPath === "C:\\") return;
        const res = window.systemState.getState().resources[this.currentPath];
        const parent = res ? res.parent : "C:\\";
        this.navigateTo(winId, parent || "C:\\");
    }

    navBack(winId) {
        this.navigateTo(winId, "C:\\");
    }

    refreshExplorer() {
        if (!window.windowsManager) return;
        for (const [winId, win] of window.windowsManager.openWindows) {
            if (win.appType === 'file-explorer' || win.appType === 'explorer') {
                this.renderQuickNav(winId);
                this.renderFolderContents(winId, this.currentPath);
            }
        }
    }

    createSpecificFolder(winId, fullPath) {
        fullPath = this.normalizePath(fullPath);
        const parts = fullPath.split('\\').filter(Boolean);
        const folderName = parts.pop();
        const parentPath = parts.join('\\') + (parts.length === 1 ? '\\' : '');

        const check = window.systemState.evaluateAccess(this.activeSessionUser, parentPath || "C:\\", "Create");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, parentPath || "C:\\", "Create Folder", check);
            return;
        }

        const res = window.systemState.createFolder(parentPath || "C:\\", folderName);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "File Explorer",
                message: res.error,
                icon: "warning"
            });
        } else {
            this.navigateTo(winId, fullPath);
        }
    }

    // --- SIMULATED FILE OPERATIONS (Create, Edit, Delete) ---
    promptNewFolder(winId) {
        if (!window.systemState.getState().vm.installed) {
            window.windowsManager.showMsgBox({
                title: "File Explorer",
                message: "Cannot create folders before Windows Server has been installed.",
                icon: "warning"
            });
            return;
        }

        const modalId = `modal-new-folder-${winId}`;
        const activePath = this.normalizePath(this.currentPath);

        const html = `
            <div class="win-dialog" style="width: 380px; padding: 16px;">
                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;">
                    <span style="font-size: 32px;">📁</span>
                    <div>
                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">Create New Folder</div>
                        <div style="font-size: 11px; color: #666;">Location: <code>${activePath}</code></div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 6px;">Folder Name:</label>
                    <input type="text" id="new-folder-name-input" class="win-input" value="FinanceData" style="width: 100%; box-sizing: border-box;" />
                </div>
                <div class="win-dialog-buttons" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="win-btn win-btn-primary" onclick="window.permissionsManager.executeCreateFolder('${winId}', '${modalId}')">Create</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: "New Folder",
            html: html,
            width: 380
        });

        setTimeout(() => {
            const input = document.getElementById('new-folder-name-input');
            if (input) {
                input.focus();
                input.select();
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        window.permissionsManager.executeCreateFolder(winId, modalId);
                    } else if (e.key === 'Escape') {
                        window.windowsManager.closeModal(modalId);
                    }
                };
            }
        }, 50);
    }

    executeCreateFolder(winId, modalId) {
        const input = document.getElementById('new-folder-name-input');
        const folderName = input ? input.value.trim() : '';
        if (!folderName) {
            window.windowsManager.showMsgBox({
                title: "Create Folder",
                message: "Please enter a valid folder name.",
                icon: "warning"
            });
            return;
        }

        let targetDir = this.normalizePath(this.currentPath);
        const resMap = window.systemState.getState().resources;
        if (!resMap[targetDir] || resMap[targetDir].type === 'file') {
            targetDir = "C:\\";
        }

        const check = window.systemState.evaluateAccess(this.activeSessionUser, targetDir, "Create");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, targetDir, "Create Folder", check);
            return;
        }

        const res = window.systemState.createFolder(targetDir, folderName);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "File Explorer",
                message: res.error,
                icon: "warning"
            });
        } else {
            window.windowsManager.closeModal(modalId);
            this.currentPath = targetDir;
            this.renderFolderContents(winId, targetDir);
            this.renderQuickNav(winId);
            this.refreshExplorer();
        }
    }

    promptNewFile(winId) {
        if (!window.systemState.getState().vm.installed) {
            window.windowsManager.showMsgBox({
                title: "File Explorer",
                message: "Cannot create files before Windows Server has been installed.",
                icon: "warning"
            });
            return;
        }

        const modalId = `modal-new-file-${winId}`;
        const activePath = this.normalizePath(this.currentPath);

        const html = `
            <div class="win-dialog" style="width: 380px; padding: 16px;">
                <div style="display: flex; gap: 12px; align-items: flex-start; margin-bottom: 16px;">
                    <span style="font-size: 32px;">📄</span>
                    <div>
                        <div style="font-weight: 600; font-size: 13px; margin-bottom: 4px;">Create New File</div>
                        <div style="font-size: 11px; color: #666;">Location: <code>${activePath}</code></div>
                    </div>
                </div>
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-size: 12px; margin-bottom: 6px;">File Name:</label>
                    <input type="text" id="new-file-name-input" class="win-input" value="Audit_Report.txt" style="width: 100%; box-sizing: border-box;" />
                </div>
                <div class="win-dialog-buttons" style="display: flex; justify-content: flex-end; gap: 8px;">
                    <button class="win-btn win-btn-primary" onclick="window.permissionsManager.executeCreateFile('${winId}', '${modalId}')">Create</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: "New Text Document",
            html: html,
            width: 380
        });

        setTimeout(() => {
            const input = document.getElementById('new-file-name-input');
            if (input) {
                input.focus();
                input.select();
                input.onkeydown = (e) => {
                    if (e.key === 'Enter') {
                        window.permissionsManager.executeCreateFile(winId, modalId);
                    } else if (e.key === 'Escape') {
                        window.windowsManager.closeModal(modalId);
                    }
                };
            }
        }, 50);
    }

    executeCreateFile(winId, modalId) {
        const input = document.getElementById('new-file-name-input');
        const fileName = input ? input.value.trim() : '';
        if (!fileName) {
            window.windowsManager.showMsgBox({
                title: "Create File",
                message: "Please enter a valid file name.",
                icon: "warning"
            });
            return;
        }

        let targetDir = this.normalizePath(this.currentPath);
        const resMap = window.systemState.getState().resources;
        if (!resMap[targetDir] || resMap[targetDir].type === 'file') {
            targetDir = "C:\\";
        }

        const check = window.systemState.evaluateAccess(this.activeSessionUser, targetDir, "Write");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, targetDir, "Create File", check);
            return;
        }

        const res = window.systemState.createFile(targetDir, fileName, "Confidential financial record.");
        if (res && res.error) {
            window.windowsManager.showMsgBox({
                title: "File Explorer",
                message: res.error,
                icon: "warning"
            });
        } else {
            window.windowsManager.closeModal(modalId);
            this.currentPath = targetDir;
            this.renderFolderContents(winId, targetDir);
            this.refreshExplorer();
        }
    }

    openFileContent(filePath) {
        const check = window.systemState.evaluateAccess(this.activeSessionUser, filePath, "Read");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, filePath, "Read / Open File", check);
            return;
        }

        const res = window.systemState.getState().resources[filePath] || { name: filePath.split('\\').pop(), content: '' };
        const fileName = res.name || filePath.split('\\').pop();
        const lowerName = fileName.toLowerCase();
        const modalId = `file_viewer_${this.getCleanPathId(filePath)}`;

        if (lowerName.endsWith('.xlsx')) {
            const isPayroll = lowerName.includes('payroll');
            const sheetTitle = isPayroll ? 'Payroll Register - Q4' : 'Operating Budget - FY2026';
            
            const tableRows = isPayroll ? `
                <tr style="background:#f2f2f2; font-weight:bold; border-bottom:1px solid #d4d4d4;">
                    <th style="width:30px; background:#e1dfdd; text-align:center;"></th>
                    <th>A (Emp ID)</th><th>B (Employee Name)</th><th>C (Role)</th><th>D (Department)</th><th>E (Gross Salary)</th><th>F (Net Pay)</th>
                </tr>
                <tr><td style="background:#f3f2f1; text-align:center;">1</td><td><b>E-1001</b></td><td>John Doe</td><td>Financial Analyst</td><td>Finance</td><td style="text-align:right;">$7,500.00</td><td style="text-align:right; font-weight:bold; color:#107c41;">$5,625.00</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">2</td><td><b>E-1002</b></td><td>Sarah Jenkins</td><td>Senior Accountant</td><td>Finance</td><td style="text-align:right;">$8,200.00</td><td style="text-align:right; font-weight:bold; color:#107c41;">$6,150.00</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">3</td><td><b>E-1003</b></td><td>David Miller</td><td>Financial Controller</td><td>Finance</td><td style="text-align:right;">$11,500.00</td><td style="text-align:right; font-weight:bold; color:#107c41;">$8,625.00</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">4</td><td><b>E-1004</b></td><td>Amanda Fox</td><td>Payroll Specialist</td><td>HR / Finance</td><td style="text-align:right;">$6,800.00</td><td style="text-align:right; font-weight:bold; color:#107c41;">$5,100.00</td></tr>
                <tr style="background:#e8f5e9; font-weight:bold;"><td style="background:#c8e6c9; text-align:center;">5</td><td>TOTAL</td><td colspan="3">Department Payroll Aggregate</td><td style="text-align:right;">$34,000.00</td><td style="text-align:right; color:#1b5e20;">$25,500.00</td></tr>
            ` : `
                <tr style="background:#f2f2f2; font-weight:bold; border-bottom:1px solid #d4d4d4;">
                    <th style="width:30px; background:#e1dfdd; text-align:center;"></th>
                    <th>A (Cost Center)</th><th>B (Q1 Actual)</th><th>C (Q2 Actual)</th><th>D (Q3 Target)</th><th>E (Q4 Forecast)</th><th>F (Total FY26)</th>
                </tr>
                <tr><td style="background:#f3f2f1; text-align:center;">1</td><td><b>Finance Operations</b></td><td style="text-align:right;">$210,000</td><td style="text-align:right;">$195,000</td><td style="text-align:right;">$220,000</td><td style="text-align:right;">$225,000</td><td style="text-align:right; font-weight:bold;">$850,000</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">2</td><td><b>IT & Cloud Infrastructure</b></td><td style="text-align:right;">$145,000</td><td style="text-align:right;">$150,000</td><td style="text-align:right;">$155,000</td><td style="text-align:right;">$160,000</td><td style="text-align:right; font-weight:bold;">$610,000</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">3</td><td><b>Capital Expenditures (CAPEX)</b></td><td style="text-align:right;">$95,000</td><td style="text-align:right;">$110,000</td><td style="text-align:right;">$105,000</td><td style="text-align:right;">$120,000</td><td style="text-align:right; font-weight:bold;">$430,000</td></tr>
                <tr><td style="background:#f3f2f1; text-align:center;">4</td><td><b>Audit & Regulatory Compliance</b></td><td style="text-align:right;">$45,000</td><td style="text-align:right;">$48,000</td><td style="text-align:right;">$52,000</td><td style="text-align:right;">$55,000</td><td style="text-align:right; font-weight:bold;">$200,000</td></tr>
                <tr style="background:#e8f5e9; font-weight:bold;"><td style="background:#c8e6c9; text-align:center;">5</td><td>TOTAL BUDGET</td><td style="text-align:right;">$495,000</td><td style="text-align:right;">$503,000</td><td style="text-align:right;">$532,000</td><td style="text-align:right;">$560,000</td><td style="text-align:right; color:#1b5e20;">$2,090,000</td></tr>
            `;

            const html = `
                <div class="office-viewer-dialog" style="display:flex; flex-direction:column; height:100%; background:#fff; font-family:'Segoe UI',sans-serif;">
                    <div style="background:#107c41; color:#fff; padding:6px 12px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span>📊</span>
                            <span style="font-weight:600; font-size:13px;">${fileName} - Microsoft Excel</span>
                        </div>
                        <div style="font-size:11px; opacity:0.85;">Read-Only Mode (${this.activeSessionUser})</div>
                    </div>
                    <div style="background:#f3f2f1; border-bottom:1px solid #d2d0ce; padding:4px 10px; display:flex; gap:16px; font-size:12px; color:#323130;">
                        <span style="font-weight:600; color:#107c41; border-bottom:2px solid #107c41; padding-bottom:2px;">Home</span>
                        <span>Insert</span><span>Page Layout</span><span>Formulas</span><span>Data</span><span>Review</span><span>View</span>
                    </div>
                    <div style="background:#faf9f8; border-bottom:1px solid #e1dfdd; padding:4px 8px; display:flex; align-items:center; gap:8px; font-size:12px;">
                        <span style="border:1px solid #c8c6c4; padding:2px 8px; background:#fff; font-weight:bold; font-family:monospace;">fx</span>
                        <input type="text" readonly value="${sheetTitle}" style="flex:1; border:1px solid #c8c6c4; padding:2px 6px; background:#fff; font-size:12px;" />
                    </div>
                    <div style="flex:1; overflow:auto; padding:0;">
                        <table class="win-table" style="width:100%; border-collapse:collapse; font-size:12px;">
                            ${tableRows}
                        </table>
                    </div>
                    <div style="background:#107c41; color:#fff; padding:3px 10px; display:flex; justify-content:space-between; font-size:11px;">
                        <div style="display:flex; gap:8px;">
                            <span style="background:#fff; color:#107c41; padding:1px 8px; font-weight:bold; border-radius:2px;">Sheet1</span>
                        </div>
                        <div>Ready | Sum: ${isPayroll ? '$34,000.00' : '$2,090,000.00'} | 100%</div>
                    </div>
                </div>
            `;

            window.windowsManager.openModal({
                id: modalId,
                title: `${fileName} - Microsoft Excel`,
                html,
                width: 680,
                height: 420
            });
            return;
        }

        if (lowerName.endsWith('.docx')) {
            const html = `
                <div class="office-viewer-dialog" style="display:flex; flex-direction:column; height:100%; background:#e8e8e8; font-family:'Segoe UI',sans-serif;">
                    <div style="background:#2b579a; color:#fff; padding:6px 12px; display:flex; justify-content:space-between; align-items:center;">
                        <div style="display:flex; align-items:center; gap:8px;">
                            <span>📝</span>
                            <span style="font-weight:600; font-size:13px;">${fileName} - Microsoft Word</span>
                        </div>
                        <div style="font-size:11px; opacity:0.85;">Protected View (${this.activeSessionUser})</div>
                    </div>
                    <div style="background:#f3f2f1; border-bottom:1px solid #d2d0ce; padding:4px 10px; display:flex; gap:16px; font-size:12px; color:#323130;">
                        <span style="font-weight:600; color:#2b579a; border-bottom:2px solid #2b579a; padding-bottom:2px;">Home</span>
                        <span>Insert</span><span>Layout</span><span>References</span><span>Review</span><span>View</span>
                    </div>
                    <div style="flex:1; overflow:auto; padding:20px; display:flex; justify-content:center;">
                        <div style="width:520px; min-height:360px; background:#fff; padding:30px 40px; box-shadow:0 2px 8px rgba(0,0,0,0.15); font-family:'Segoe UI',Arial,sans-serif; color:#24292f; line-height:1.6;">
                            <div style="border-bottom:2px solid #2b579a; padding-bottom:8px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:baseline;">
                                <span style="font-size:16px; font-weight:bold; color:#2b579a;">CONTOSO ENTERPRISES</span>
                                <span style="font-size:11px; color:#666;">CONFIDENTIAL FINANCIAL REPORT</span>
                            </div>
                            <h2 style="font-size:18px; margin:0 0 6px 0; color:#1a1a1a;">Quarterly Financial & Audit Review</h2>
                            <p style="font-size:12px; color:#666; margin:0 0 16px 0;">
                                <b>Prepared by:</b> John Doe (Financial Analyst) &nbsp;|&nbsp; <b>Group:</b> GRP_Finance &nbsp;|&nbsp; <b>Location:</b> C:\\FinanceData
                            </p>
                            <h4 style="font-size:13px; margin:12px 0 4px 0; color:#2b579a;">1. Executive Summary</h4>
                            <p style="font-size:12px; margin:0 0 10px 0;">
                                Fiscal performance for the current operating period indicates strong operational resilience. Revenue exceeded forecast by 14.2%, driven by enterprise cloud services and reduced overhead expenses.
                            </p>
                            <h4 style="font-size:13px; margin:12px 0 4px 0; color:#2b579a;">2. Security & Compliance Access Audit</h4>
                            <p style="font-size:12px; margin:0 0 10px 0;">
                                In accordance with corporate System Administration security guidelines, all financial spreadsheets and documentation have been secured within <code>C:\\FinanceData</code> with access restricted exclusively to the <b>GRP_Finance</b> security group.
                            </p>
                            <div style="margin-top:24px; padding-top:10px; border-top:1px dashed #ccc; font-size:11px; color:#666; display:flex; justify-content:space-between;">
                                <span>Sign-off: <i>J. Doe (Financial Analyst)</i></span>
                                <span>Approved: <i>D. Miller (Controller)</i></span>
                            </div>
                        </div>
                    </div>
                    <div style="background:#2b579a; color:#fff; padding:3px 10px; display:flex; justify-content:space-between; font-size:11px;">
                        <div>Page 1 of 1 | 248 words</div>
                        <div>100% | Print Layout</div>
                    </div>
                </div>
            `;

            window.windowsManager.openModal({
                id: modalId,
                title: `${fileName} - Microsoft Word`,
                html,
                width: 680,
                height: 480
            });
            return;
        }

        // Default Notepad
        const html = `
            <div class="notepad-viewer-dialog" style="display:flex; flex-direction:column; height:100%; background:#fff; font-family:'Segoe UI',sans-serif;">
                <div style="background:#f0f0f0; border-bottom:1px solid #d9d9d9; padding:2px 8px; display:flex; gap:12px; font-size:12px;">
                    <span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span>
                </div>
                <textarea readonly style="flex:1; border:none; resize:none; outline:none; padding:10px; font-family:'Consolas','Courier New',monospace; font-size:13px; line-height:1.4; color:#000; background:#fff;">${res.content || ''}</textarea>
                <div style="background:#f0f0f0; border-top:1px solid #d9d9d9; padding:2px 10px; font-size:11px; color:#555; display:flex; justify-content:space-between;">
                    <span>Ln 1, Col 1</span>
                    <span>100% &nbsp;|&nbsp; Windows (CRLF) &nbsp;|&nbsp; UTF-8</span>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: `${fileName} - Notepad`,
            html,
            width: 540,
            height: 350
        });
    }

    promptDeleteResource(resourcePath, winId) {
        const check = window.systemState.evaluateAccess(this.activeSessionUser, resourcePath, "Delete");
        if (!check.granted) {
            this.showAccessDeniedModal(this.activeSessionUser, resourcePath, "Delete", check);
            return;
        }

        window.windowsManager.showConfirmBox({
            title: "Confirm File Delete",
            message: `Are you sure you want to permanently delete '${resourcePath}'?`,
            onYes: () => {
                window.systemState.deleteResource(resourcePath);
                this.renderFolderContents(winId, this.currentPath);
            }
        });
    }

    // --- CONTEXT MENUS ---
    showExplorerEmptyContextMenu(e, winId) {
        if (e.target && e.target.closest && e.target.closest('.explorer-row')) return;
        e.preventDefault();
        e.stopPropagation();
        window.usersManager.removeContextMenu();

        const curPath = this.normalizePath(this.currentPath);
        const safeCurPath = this.escapeJsArg(curPath);

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        menu.innerHTML = `
            <div class="menu-item bold" onclick="window.permissionsManager.promptNewFolder('${winId}'); window.usersManager.removeContextMenu();">
                New > Folder
            </div>
            <div class="menu-item" onclick="window.permissionsManager.promptNewFile('${winId}'); window.usersManager.removeContextMenu();">
                New > Text Document
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="window.permissionsManager.openSecurityProperties('${safeCurPath}'); window.usersManager.removeContextMenu();">
                Properties
            </div>
        `;

        document.body.appendChild(menu);
        window.usersManager.bindDismissContextMenu(menu);
    }

    showResourceContextMenu(e, itemPath, winId) {
        e.preventDefault();
        e.stopPropagation();
        window.usersManager.removeContextMenu();
        itemPath = this.normalizePath(itemPath);
        this.selectedResource = itemPath;

        // If it's C:\FinanceData and hasn't been created yet, auto-create it
        // so that Properties, Open, and permissions work immediately!
        if (!window.systemState.getState().resources[itemPath] && itemPath === 'C:\\FinanceData') {
            window.systemState.createFolder("C:\\", "FinanceData");
            if (winId) this.renderQuickNav(winId);
        }

        const res = window.systemState.getState().resources[itemPath];
        const isFolder = !res || res.type === 'folder';
        const safePath = this.escapeJsArg(itemPath);

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        menu.innerHTML = `
            <div class="menu-item bold" onclick="window.permissionsManager.handleItemDoubleClick('${winId}', '${safePath}'); window.usersManager.removeContextMenu();">
                ${isFolder ? 'Open' : 'Open / View'}
            </div>
            ${itemPath !== 'C:\\' ? `
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="window.permissionsManager.promptDeleteResource('${safePath}', '${winId}'); window.usersManager.removeContextMenu();">
                Delete
            </div>` : ''}
            <div class="menu-separator"></div>
            <div class="menu-item bold" onclick="window.permissionsManager.openSecurityProperties('${safePath}'); window.usersManager.removeContextMenu();">
                Properties
            </div>
        `;

        document.body.appendChild(menu);
        window.usersManager.bindDismissContextMenu(menu);
    }

    // --- ACCESS DENIED MODAL (Authentic Windows 10/Server Style) ---
    showAccessDeniedModal(username, resourcePath, action, checkResult) {
        const modalId = 'modal-access-denied';
        resourcePath = this.normalizePath(resourcePath);
        const safePath = this.escapeJsArg(resourcePath);

        const html = `
            <div class="win-dialog win-error-dialog" style="width: 440px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">File Access Denied</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-dialog-body" style="display:flex; gap: 15px; align-items: flex-start;">
                    <span style="font-size: 40px; color: #d13438;">🛑</span>
                    <div>
                        <p style="font-size: 13px; font-weight: bold; margin-bottom: 6px;">
                            You need permission to perform this action.
                        </p>
                        <p style="font-size: 12px; color: #333; margin-bottom: 10px;">
                            You require permission from Administrators to access or make changes to this resource:
                        </p>
                        <div style="background: #f4f4f4; padding: 8px; border: 1px solid #ddd; font-size: 12px; font-family: monospace;">
                            Target: ${resourcePath}<br>
                            User: ${username}<br>
                            Requested: ${action}<br>
                            Reason: ${checkResult.reason || checkResult.message}
                        </div>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${modalId}'); window.permissionsManager.openSecurityProperties('${safePath}');">
                        Edit Security Permissions
                    </button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: 'File Access Denied',
            html
        });
    }

    // --- FOLDER PROPERTIES / SECURITY TAB (Classic Windows NTFS UI) ---
    openSecurityProperties(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);

        // Auto-create FinanceData if requested
        if (!window.systemState.getState().resources[resourcePath] && resourcePath === 'C:\\FinanceData') {
            window.systemState.createFolder("C:\\", "FinanceData");
        }

        const targetResource = window.systemState.getState().resources[resourcePath];
        if (!targetResource && resourcePath !== 'C:\\') {
            window.windowsManager.showMsgBox({
                title: "Windows Security",
                message: `Cannot assign permissions. The target folder "${resourcePath}" does not exist. Please create the folder first.`,
                icon: "warning"
            });
            return;
        }

        let acl = window.systemState.getState().permissions[resourcePath];
        if (!acl) {
            window.systemState.updateResourceACL(resourcePath, {
                owner: "Administrators",
                entries: [
                    { principal: "Administrators", type: "Allow", rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"] },
                    { principal: "SYSTEM", type: "Allow", rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"] },
                    { principal: "Users", type: "Allow", rights: ["ReadExecute", "ListFolder", "Read"] }
                ]
            });
            acl = window.systemState.getState().permissions[resourcePath];
        }

        const safePath = this.escapeJsArg(resourcePath);
        const cleanId = this.getCleanPathId(resourcePath);
        const modalId = `modal-sec-${cleanId}`;
        const explorerWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => {
            const t = window.windowsManager.openWindows.get(k).appType;
            return t === 'file-explorer' || t === 'explorer';
        });

        const defaultPrincipal = acl.entries[0] ? acl.entries[0].principal : "Administrators";
        this.selectedAclPrincipal = defaultPrincipal;

        const html = `
            <div class="win-dialog folder-props-dialog">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">${resourcePath.split('\\').pop() || 'Drive'} Properties</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-tab-header">
                    <div class="win-tab-btn" onclick="window.permissionsManager.switchFolderTab('general')">General</div>
                    <div class="win-tab-btn" onclick="window.permissionsManager.switchFolderTab('sharing')">Sharing</div>
                    <div class="win-tab-btn active" onclick="window.permissionsManager.switchFolderTab('security')">Security</div>
                    <div class="win-tab-btn" onclick="window.permissionsManager.switchFolderTab('prev-versions')">Previous Versions</div>
                </div>
                <div class="win-dialog-body">
                    <!-- GENERAL TAB -->
                    <div id="fp-tab-general" class="win-tab-panel">
                        <div class="win-form-row"><label>Type:</label><span>File folder</span></div>
                        <div class="win-form-row"><label>Location:</label><span>${resourcePath}</span></div>
                        <div class="win-form-row"><label>Size:</label><span>94.8 KB</span></div>
                        <div class="win-form-row"><label>Contains:</label><span>${targetResource?.items ? targetResource.items.length : 0} Files/Folders</span></div>
                    </div>

                    <!-- SHARING TAB -->
                    <div id="fp-tab-sharing" class="win-tab-panel">
                        <p>Network File and Folder Sharing:</p>
                        <p><b>Not Shared</b></p>
                        <button class="win-btn" onclick="window.windowsManager.showMsgBox({ title: 'File Sharing', message: 'Network Share: \\\\\\\\WIN-SERVER\\\\${resourcePath.split('\\\\').pop()} configured.', icon: 'info' })">Share...</button>
                    </div>

                    <!-- SECURITY TAB (MAIN REQUIREMENT) -->
                    <div id="fp-tab-security" class="win-tab-panel active">
                        <p style="margin-bottom: 6px;"><b>Group or user names:</b></p>
                        <div class="win-listbox" id="acl-principals-list" style="height: 105px;">
                            ${acl.entries.map(e => `
                                <div class="win-listbox-item ${e.principal === defaultPrincipal ? 'selected' : ''}" 
                                     onclick="window.permissionsManager.selectAclPrincipal(this, '${e.principal}', '${safePath}')">
                                    <span class="icon">${e.principal.startsWith('GRP_') || e.principal === 'Administrators' || e.principal === 'Users' ? '👥' : '👤'}</span>
                                    <b>${e.principal}</b> (WIN-SERVER\\${e.principal})
                                </div>
                            `).join('')}
                        </div>

                        <div class="acl-principal-actions" style="margin: 6px 0 10px 0; display: flex; gap: 6px;">
                            <button class="win-btn win-btn-sm" onclick="window.permissionsManager.openAddAclPrincipalDialog('${safePath}')">Edit / Add...</button>
                            <button class="win-btn win-btn-sm" onclick="window.permissionsManager.removeSelectedAclPrincipal('${safePath}')">Remove</button>
                        </div>

                        <div class="acl-permissions-box">
                            <p style="margin-bottom: 4px;">Permissions for <b id="acl-selected-name">${defaultPrincipal}</b>:</p>
                            <table class="win-table acl-perm-table" id="acl-checkboxes-table">
                                <thead>
                                    <tr>
                                        <th>Permissions</th>
                                        <th style="width: 60px; text-align: center;">Allow</th>
                                        <th style="width: 60px; text-align: center;">Deny</th>
                                    </tr>
                                </thead>
                                <tbody id="acl-rights-tbody">
                                    <!-- Rendered by renderAclCheckboxes -->
                                </tbody>
                            </table>
                        </div>

                        <div class="acl-bottom-strip" style="margin-top: 10px; display: flex; justify-content: space-between; align-items: center;">
                            <small>For special permissions or advanced settings, click Advanced.</small>
                            <button class="win-btn" onclick="window.permissionsManager.openAdvancedSecurity('${safePath}')">Advanced</button>
                        </div>
                    </div>

                    <!-- PREVIOUS VERSIONS TAB (Section 16 requirement) -->
                    <div id="fp-tab-prev-versions" class="win-tab-panel">
                        <p style="font-size: 11px; margin-bottom: 8px;">
                            Previous versions come from File History or from restore points.
                        </p>
                        <div class="win-listbox" style="height: 120px; background: #fff; border: 1px solid #7f9db9; padding: 6px; font-size: 11px;">
                            <div style="color: #666; font-style: italic; padding: 4px;">There are no previous versions available.</div>
                        </div>
                        <div style="margin-top: 12px; display: flex; gap: 8px; justify-content: flex-end;">
                            <button class="win-btn" disabled>Open</button>
                            <button class="win-btn" disabled>Copy...</button>
                            <button class="win-btn" disabled>Restore</button>
                        </div>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.permissionsManager.saveSecurityPermissions('${safePath}', false); window.windowsManager.closeModal('${modalId}');">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                    <button class="win-btn" onclick="window.permissionsManager.saveSecurityPermissions('${safePath}', true)">Apply</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: `${resourcePath.split('\\').pop() || 'Drive'} Properties`,
            parentWinId: explorerWinId,
            html
        });

        this.renderAclCheckboxes(resourcePath, defaultPrincipal);
    }

    switchFolderTab(tabId) {
        document.querySelectorAll('.folder-props-dialog .win-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.folder-props-dialog .win-tab-panel').forEach(p => p.classList.remove('active'));

        const targetBtn = document.querySelector(`.folder-props-dialog .win-tab-btn[onclick*="${tabId}"]`);
        const targetPanel = document.getElementById(`fp-tab-${tabId}`);
        if (targetBtn) targetBtn.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    }

    selectAclPrincipal(itemEl, principalName, resourcePath) {
        document.querySelectorAll('#acl-principals-list .win-listbox-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedAclPrincipal = principalName;
        const nameEl = document.getElementById('acl-selected-name');
        if (nameEl) nameEl.textContent = principalName;

        this.renderAclCheckboxes(resourcePath, principalName);
    }

    renderAclCheckboxes(resourcePath, principalName) {
        const tbody = document.getElementById('acl-rights-tbody');
        if (!tbody) return;

        const acl = window.systemState.getState().permissions[resourcePath];
        const entry = acl ? acl.entries.find(e => e.principal.toLowerCase() === principalName.toLowerCase()) : null;

        const rights = entry ? entry.rights : [];
        const isDeny = entry ? (entry.type === 'Deny') : false;

        const standardRights = [
            { id: "FullControl", label: "Full control" },
            { id: "Modify", label: "Modify" },
            { id: "ReadExecute", label: "Read & execute" },
            { id: "ListFolder", label: "List folder contents" },
            { id: "Read", label: "Read" },
            { id: "Write", label: "Write" }
        ];

        tbody.innerHTML = standardRights.map(r => {
            const hasRight = rights.includes(r.id) || rights.includes("FullControl");
            const allowChecked = !isDeny && hasRight;
            const denyChecked = isDeny && hasRight;

            return `
                <tr>
                    <td>${r.label}</td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="acl-chk-allow" data-right="${r.id}" ${allowChecked ? 'checked' : ''} 
                               onchange="window.permissionsManager.onAclAllowChange(this, '${r.id}')" />
                    </td>
                    <td style="text-align: center;">
                        <input type="checkbox" class="acl-chk-deny" data-right="${r.id}" ${denyChecked ? 'checked' : ''} 
                               onchange="window.permissionsManager.onAclDenyChange(this, '${r.id}')" />
                    </td>
                </tr>
            `;
        }).join('');
    }

    onAclAllowChange(chk, rightId) {
        if (chk.checked) {
            const denyChk = document.querySelector(`.acl-chk-deny[data-right="${rightId}"]`);
            if (denyChk) denyChk.checked = false;

            if (rightId === "FullControl") {
                document.querySelectorAll('.acl-chk-allow').forEach(c => c.checked = true);
                document.querySelectorAll('.acl-chk-deny').forEach(c => c.checked = false);
            }
        }
    }

    onAclDenyChange(chk, rightId) {
        if (chk.checked) {
            const allowChk = document.querySelector(`.acl-chk-allow[data-right="${rightId}"]`);
            if (allowChk) allowChk.checked = false;

            if (rightId === "FullControl") {
                document.querySelectorAll('.acl-chk-deny').forEach(c => c.checked = true);
                document.querySelectorAll('.acl-chk-allow').forEach(c => c.checked = false);
            }
        }
    }

    saveSecurityPermissions(resourcePath, reopen = false) {
        resourcePath = this.normalizePath(resourcePath);
        if (!this.selectedAclPrincipal) return;

        const allowChks = Array.from(document.querySelectorAll('.acl-chk-allow:checked')).map(c => c.dataset.right);
        const denyChks = Array.from(document.querySelectorAll('.acl-chk-deny:checked')).map(c => c.dataset.right);

        let type = "Allow";
        let chosenRights = allowChks;

        if (denyChks.length > 0) {
            type = "Deny";
            chosenRights = denyChks;
        }

        const acl = window.systemState.getState().permissions[resourcePath] || {
            owner: "Administrators",
            inheritance: false,
            entries: []
        };

        const existingIndex = acl.entries.findIndex(e => e.principal.toLowerCase() === this.selectedAclPrincipal.toLowerCase());
        const newEntry = {
            principal: this.selectedAclPrincipal,
            type: type,
            rights: chosenRights
        };

        if (existingIndex >= 0) {
            acl.entries[existingIndex] = newEntry;
        } else {
            acl.entries.push(newEntry);
        }

        window.systemState.updateResourceACL(resourcePath, acl);

        if (reopen) {
            this.openSecurityProperties(resourcePath);
        }
    }

    openAddAclPrincipalDialog(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        const safePath = this.escapeJsArg(resourcePath);
        const state = window.systemState.getState();
        const cleanId = this.getCleanPathId(resourcePath);
        const parentModalId = (window.windowsManager.openModals.has(`modal-adv-sec-${cleanId}`))
            ? `modal-adv-sec-${cleanId}`
            : `modal-sec-${cleanId}`;
        const subModalId = `modal-add-principal-${cleanId}`;

        const allPrincipals = [
            ...state.groups.map(g => ({ name: g.name, type: 'group' })),
            ...state.users.map(u => ({ name: u.username, type: 'user' }))
        ];

        const html = `
            <div class="win-dialog select-object-dialog" style="width: 500px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Select Users or Groups</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${subModalId}')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <p>Select a user or security group to add to the Access Control List (ACL):</p>
                    <div class="win-listbox" style="height: 140px; margin: 10px 0;">
                        ${allPrincipals.map(p => `
                            <div class="win-listbox-item" onclick="this.parentElement.querySelectorAll('.win-listbox-item').forEach(i=>i.classList.remove('selected')); this.classList.add('selected'); document.getElementById('sel-acl-principal').value='${p.name}';">
                                <span class="icon">${p.type === 'group' ? '👥' : '👤'}</span> <b>${p.name}</b>
                            </div>
                        `).join('')}
                    </div>
                    <div class="win-form-row">
                        <label>Enter the object name to select:</label>
                        <input type="text" id="sel-acl-principal" class="win-input" value="GRP_Finance" />
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.permissionsManager.confirmAddAclPrincipal('${safePath}')">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${subModalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: subModalId,
            title: 'Select Users or Groups',
            parentModalId: parentModalId,
            html
        });

        setTimeout(() => {
            const input = document.getElementById('sel-acl-principal');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    confirmAddAclPrincipal(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        const principal = document.getElementById('sel-acl-principal')?.value.trim();
        if (!principal) return;

        const cleanId = this.getCleanPathId(resourcePath);
        const subModalId = `modal-add-principal-${cleanId}`;

        const acl = window.systemState.getState().permissions[resourcePath];
        if (acl && !acl.entries.some(e => e.principal.toLowerCase() === principal.toLowerCase())) {
            acl.entries.push({
                principal: principal,
                type: "Allow",
                rights: ["ReadExecute", "ListFolder", "Read"]
            });
            window.systemState.updateResourceACL(resourcePath, acl);
        }

        window.windowsManager.closeModal(subModalId);
        if (window.windowsManager.openModals.has(`modal-adv-sec-${cleanId}`)) {
            this.openAdvancedSecurity(resourcePath);
        } else {
            this.openSecurityProperties(resourcePath);
            this.selectedAclPrincipal = principal;
            this.renderAclCheckboxes(resourcePath, principal);
        }
    }

    removeSelectedAclPrincipal(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        if (!this.selectedAclPrincipal) return;
        const acl = window.systemState.getState().permissions[resourcePath];
        if (acl) {
            acl.entries = acl.entries.filter(e => e.principal.toLowerCase() !== this.selectedAclPrincipal.toLowerCase());
            window.systemState.updateResourceACL(resourcePath, acl);
            this.openSecurityProperties(resourcePath);
        }
    }

    // --- ADVANCED SECURITY SETTINGS (Effective Access Tab) ---
    openAdvancedSecurity(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        const safePath = this.escapeJsArg(resourcePath);
        const acl = window.systemState.getState().permissions[resourcePath];
        if (!acl) return;

        const cleanId = this.getCleanPathId(resourcePath);
        const parentModalId = `modal-sec-${cleanId}`;
        const advModalId = `modal-adv-sec-${cleanId}`;

        const html = `
            <div class="win-dialog adv-security-dialog" style="width: 680px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Advanced Security Settings for ${resourcePath.split('\\').pop() || 'Drive'}</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${advModalId}')">✕</button>
                </div>
                <div class="win-tab-header">
                    <div class="win-tab-btn active" onclick="window.permissionsManager.switchAdvTab('permissions')">Permissions</div>
                    <div class="win-tab-btn" onclick="window.permissionsManager.switchAdvTab('effective')">Effective Access</div>
                    <div class="win-tab-btn" onclick="window.permissionsManager.switchAdvTab('auditing')">Auditing</div>
                </div>
                <div class="win-dialog-body">
                    <div style="margin-bottom: 10px; font-size: 12px;">
                        Name: <b>${resourcePath}</b><br>
                        Owner: <b>${acl.owner || 'Administrators'}</b> <a href="javascript:void(0)" onclick="window.windowsManager.showMsgBox({ title: 'Owner', message: 'Owner modification: WIN-SERVER\\\\Administrators', icon: 'info' })">Change</a>
                    </div>

                    <!-- TAB: PERMISSIONS -->
                    <div id="adv-tab-permissions" class="win-tab-panel active">
                        <p style="margin-bottom: 6px;">Permission entries:</p>
                        <table class="win-table" style="font-size: 11px;">
                            <thead>
                                <tr>
                                    <th>Type</th>
                                    <th>Principal</th>
                                    <th>Access</th>
                                    <th>Inherited From</th>
                                    <th>Applies To</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${acl.entries.map(e => `
                                    <tr>
                                        <td><span class="perm-type-pill ${e.type.toLowerCase()}">${e.type}</span></td>
                                        <td><b>${e.principal}</b></td>
                                        <td>${e.rights.join(', ')}</td>
                                        <td>None</td>
                                        <td>This folder, subfolders and files</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="margin-top: 12px; display: flex; gap: 8px;">
                            <button class="win-btn" onclick="window.permissionsManager.openAddAclPrincipalDialog('${safePath}')">Add</button>
                            <button class="win-btn" disabled>Remove</button>
                            <button class="win-btn" disabled>View</button>
                            <div style="flex:1;"></div>
                            <button class="win-btn" onclick="window.windowsManager.showMsgBox({ title: 'Security Inheritance', message: 'Inheritance settings updated for this object.', icon: 'info' })">Disable inheritance</button>
                        </div>
                    </div>

                    <!-- TAB: EFFECTIVE ACCESS (CRITICAL CLASSROOM REQUIREMENT) -->
                    <div id="adv-tab-effective" class="win-tab-panel">
                        <p>Select a user or group to view its effective permissions on <b>${resourcePath}</b>:</p>
                        <div style="display: flex; gap: 8px; align-items: center; margin: 10px 0;">
                            <label>User / Group:</label>
                            <select id="adv-eff-user" class="win-select" style="width: 220px;">
                                ${window.systemState.getState().users.map(u => `
                                    <option value="${u.username}" ${u.username === 'jdoe' ? 'selected' : ''}>👤 ${u.username} (${u.fullName || 'User'})</option>
                                `).join('')}
                            </select>
                            <button class="win-btn win-btn-default" onclick="window.permissionsManager.evaluateEffectiveAccessUI('${safePath}')">
                                View effective access
                            </button>
                        </div>

                        <div id="adv-eff-results" style="margin-top: 10px;">
                            <small style="color: #666;">Click "View effective access" to calculate evaluated rights.</small>
                        </div>
                    </div>

                    <!-- TAB: AUDITING -->
                    <div id="adv-tab-auditing" class="win-tab-panel">
                        <p>Auditing entries configured for object access auditing in Windows Event Viewer.</p>
                        <table class="win-table" style="font-size: 11px;">
                            <thead>
                                <tr><th>Type</th><th>Principal</th><th>Access</th></tr>
                            </thead>
                            <tbody>
                                <tr><td>All</td><td>Everyone</td><td>Full Control (Success & Failure)</td></tr>
                            </tbody>
                        </table>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${advModalId}')">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${advModalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: advModalId,
            title: `Advanced Security Settings for ${resourcePath.split('\\').pop() || 'Drive'}`,
            parentModalId: parentModalId,
            html
        });
    }

    switchAdvTab(tabId) {
        document.querySelectorAll('.adv-security-dialog .win-tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.adv-security-dialog .win-tab-panel').forEach(p => p.classList.remove('active'));

        const targetBtn = document.querySelector(`.adv-security-dialog .win-tab-btn[onclick*="${tabId}"]`);
        const targetPanel = document.getElementById(`adv-tab-${tabId}`);
        if (targetBtn) targetBtn.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    }

    evaluateEffectiveAccessUI(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        const username = document.getElementById('adv-eff-user')?.value;
        const resultsEl = document.getElementById('adv-eff-results');
        if (!resultsEl || !username) return;

        const checkFull = window.systemState.evaluateAccess(username, resourcePath, "FullControl");
        const checkMod = window.systemState.evaluateAccess(username, resourcePath, "Modify");
        const checkRead = window.systemState.evaluateAccess(username, resourcePath, "Read");
        const checkWrite = window.systemState.evaluateAccess(username, resourcePath, "Write");
        const checkList = window.systemState.evaluateAccess(username, resourcePath, "List");

        resultsEl.innerHTML = `
            <div style="background: #fdfdfd; border: 1px solid #ccc; padding: 10px;">
                <div style="display:flex; justify-content:space-between; margin-bottom: 8px;">
                    <span>Evaluated User: <b>${username}</b></span>
                    <span>Status: <b>${checkMod.effectivePermission}</b></span>
                </div>
                <table class="win-table" style="font-size: 11px;">
                    <thead>
                        <tr><th>Permission Right</th><th>Effective Status</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Full control</td><td>${checkFull.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                        <tr><td>Modify</td><td>${checkMod.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                        <tr><td>Read & execute</td><td>${checkRead.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                        <tr><td>List folder contents</td><td>${checkList.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                        <tr><td>Read</td><td>${checkRead.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                        <tr><td>Write</td><td>${checkWrite.granted ? '🟢 Granted' : '🔴 Denied'}</td></tr>
                    </tbody>
                </table>
            </div>
        `;
    }

    // --- SECURITY & ACCESS TEST UTILITY (SecurityTest.exe) ---
    renderSecurityTest(clientEl, winId) {
        const state = window.systemState.getState();
        const users = state.users || [];
        const resources = Object.keys(state.permissions || {});
        if (!resources.includes('C:\\FinanceData')) {
            resources.unshift('C:\\FinanceData');
        }
        if (!resources.includes('C:\\')) {
            resources.push('C:\\');
        }

        const defaultUser = users.find(u => u.username === 'jdoe')?.username || users[0]?.username || 'jdoe';
        const defaultResource = resources[0] || 'C:\\FinanceData';

        clientEl.innerHTML = `
            <div class="sec-test-wrapper" style="padding: 16px;">
                <div class="sec-test-header" style="border-bottom: 1px solid #d0d7de; padding-bottom: 10px; margin-bottom: 14px;">
                    <h3 style="margin:0 0 4px 0;">🛡️ Security Access Testing Utility</h3>
                    <p style="margin:0; font-size: 12px; color: #555;">
                        Simulates Windows Security subsystem access token generation, group membership resolution, and NTFS DACL evaluation.
                    </p>
                </div>

                <div class="sec-test-form-box" style="background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 4px; margin-bottom: 14px;">
                    <div class="win-form-row" style="margin-bottom: 8px;">
                        <label style="width: 140px; font-weight: 500;">Select User Account:</label>
                        <select id="st-username-select" class="win-select" style="width: 260px;" onchange="window.permissionsManager.onSecTestUserSelect(this.value)">
                            <option value="">-- Choose Existing User or Type Below --</option>
                            ${users.map(u => `
                                <option value="${u.username}" ${u.username === defaultUser ? 'selected' : ''}>
                                    ${u.username} (${u.fullName || 'User'}) ${u.disabled ? '[DISABLED]' : ''}
                                </option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="win-form-row" style="margin-bottom: 8px;">
                        <label style="width: 140px; font-weight: 500;">Username:</label>
                        <input type="text" id="st-username" class="win-input" value="${defaultUser}" style="width: 260px;" placeholder="e.g. jdoe or custom account" oninput="window.permissionsManager.onSecTestUserChange(this.value)" />
                    </div>
                    <div class="win-form-row" style="margin-bottom: 8px;">
                        <label style="width: 140px; font-weight: 500;">Password:</label>
                        <input type="password" id="st-password" class="win-input" value="User@12345" style="width: 260px;" />
                    </div>
                    <div class="win-form-row" style="margin-bottom: 8px;">
                        <label style="width: 140px; font-weight: 500;">Target Resource:</label>
                        <div style="display: flex; gap: 6px; align-items: center;">
                            <input type="text" id="st-resource" class="win-input" value="${defaultResource}" style="width: 260px;" />
                            <select class="win-select" style="width: 140px;" onchange="document.getElementById('st-resource').value = this.value">
                                <option value="">-- Resources --</option>
                                ${resources.map(r => `<option value="${r}">${r}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="win-form-row" style="margin-bottom: 12px;">
                        <label style="width: 140px; font-weight: 500;">Requested Action:</label>
                        <select id="st-action" class="win-select" style="width: 260px;">
                            <option value="Read">Read (View Contents)</option>
                            <option value="Write">Write (Create New Files)</option>
                            <option value="Modify" selected>Modify (Edit / Save / Delete)</option>
                            <option value="FullControl">Full Control (Take Ownership / Permissions)</option>
                        </select>
                    </div>
                    <div style="margin-top: 12px; display: flex; gap: 8px; flex-wrap: wrap;">
                        <button class="win-btn win-btn-default" id="st-btn-test" onclick="window.permissionsManager.executeSecurityTest()">
                            ▶️ Test Access
                        </button>
                        ${users.some(u => u.username === 'jdoe') ? `
                            <button class="win-btn" onclick="window.permissionsManager.quickFillTest('jdoe', 'Modify', 'C:\\\\FinanceData')">
                                Preset: jdoe (Modify)
                            </button>
                        ` : ''}
                        ${users.some(u => u.username === 'mwilson') ? `
                            <button class="win-btn" onclick="window.permissionsManager.quickFillTest('mwilson', 'Modify', 'C:\\\\FinanceData')">
                                Preset: mwilson (Modify)
                            </button>
                        ` : ''}
                        <button class="win-btn" onclick="window.permissionsManager.quickFillTest('Administrator', 'FullControl', 'C:\\\\FinanceData')">
                            Preset: Administrator (Full Control)
                        </button>
                    </div>
                </div>

                <!-- TEST RESULTS DISPLAY -->
                <div class="sec-test-result-box" id="st-result-box">
                    <div style="text-align: center; color: #777; padding: 25px;">
                        Click <b>"Test Access"</b> to evaluate permissions dynamically against the server state.
                    </div>
                </div>
            </div>
        `;
    }

    onSecTestUserSelect(username) {
        if (!username) return;
        const userInput = document.getElementById('st-username');
        if (userInput) userInput.value = username;
        this.onSecTestUserChange(username);
    }

    onSecTestUserChange(username) {
        const user = window.systemState.getState().users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());
        const passIn = document.getElementById('st-password');
        if (user && passIn) {
            passIn.value = user.password || "User@12345";
        }
    }

    quickFillTest(username, action, resource) {
        const userIn = document.getElementById('st-username');
        const userSelect = document.getElementById('st-username-select');
        const actIn = document.getElementById('st-action');
        const resIn = document.getElementById('st-resource');

        if (userIn) userIn.value = username;
        if (userSelect) {
            const hasOption = Array.from(userSelect.options).some(o => o.value.toLowerCase() === username.toLowerCase());
            if (hasOption) userSelect.value = username;
            else userSelect.value = '';
        }
        if (actIn && action) actIn.value = action;
        if (resIn && resource) resIn.value = resource;

        this.onSecTestUserChange(username);
        this.executeSecurityTest();
    }

    executeSecurityTest() {
        const username = document.getElementById('st-username')?.value.trim();
        const rawResource = document.getElementById('st-resource')?.value.trim();
        const resource = this.normalizePath(rawResource);
        const action = document.getElementById('st-action')?.value || 'Read';
        const resultBox = document.getElementById('st-result-box');
        if (!resultBox || !username) {
            if (resultBox) {
                resultBox.innerHTML = `
                    <div class="sec-result-card denied">
                        <div class="result-header">
                            <span class="badge-icon">❌</span>
                            <h4>INVALID PARAMETERS</h4>
                        </div>
                        <div class="result-details">
                            <div class="res-row"><span class="k">Error:</span><span class="v">Please specify both a username and a resource path.</span></div>
                        </div>
                    </div>
                `;
            }
            return;
        }

        const check = window.systemState.evaluateAccess(username, resource, action);
        const userGroupsStr = check.groups && check.groups.length > 0 ? check.groups.join(', ') : 'None (No group memberships)';

        // 1. Account Not Found
        if (check.reason === "USER_NOT_FOUND") {
            resultBox.innerHTML = `
                <div class="sec-result-card denied">
                    <div class="result-header">
                        <span class="badge-icon">❌</span>
                        <h4>ACCOUNT NOT FOUND (ACCESS DENIED)</h4>
                    </div>
                    <div class="result-details">
                        <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                        <div class="res-row"><span class="k">Account Status:</span><span class="v" style="color: #d13438; font-weight:bold;">Nonexistent / Unknown Account</span></div>
                        <div class="res-row"><span class="k">Security Check:</span><span class="v">Security Account Manager (SAM) cannot locate this user account.</span></div>
                        <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4625 - Unknown User Name Logon Failure</span></div>
                    </div>
                    <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #fff0f0; border: 1px solid #f5c2c7; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #842029;">
                        <b>Evaluation Chain:</b><br>
                        Account '<b>${username}</b>' does not exist in local directory database.<br>
                        &nbsp;&nbsp;→ Authentication token generation failed.<br>
                        &nbsp;&nbsp;→ <b>ACCESS DENIED</b>
                    </div>
                </div>
            `;
            return;
        }

        // 2. Account Disabled
        if (check.reason === "ACCOUNT_DISABLED") {
            resultBox.innerHTML = `
                <div class="sec-result-card disabled">
                    <div class="result-header">
                        <span class="badge-icon">🛑</span>
                        <h4>ACCOUNT DISABLED (ACCESS DENIED)</h4>
                    </div>
                    <div class="result-details">
                        <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                        <div class="res-row"><span class="k">Account Status:</span><span class="v" style="color: #d13438; font-weight:bold;">Disabled by Administrator</span></div>
                        <div class="res-row"><span class="k">Security Check:</span><span class="v">Logon Rejected. Authentication token cannot be generated (STATUS_ACCOUNT_DISABLED).</span></div>
                        <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4625 - Account Disabled Logon Attempt</span></div>
                    </div>
                    <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #fff0f0; border: 1px solid #f5c2c7; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #842029;">
                        <b>Account Lifecycle Evaluation:</b><br>
                        User '<b>${username}</b>' exists, but the account is currently marked disabled.<br>
                        &nbsp;&nbsp;→ Windows Security subsystem rejects logon request before ACL evaluation.<br>
                        &nbsp;&nbsp;→ <b>ACCESS DENIED (Account disabled. Logon is not permitted.)</b>
                    </div>
                </div>
            `;
            return;
        }

        // 3. Path / Resource Not Found
        if (check.reason === "RESOURCE_NOT_FOUND") {
            resultBox.innerHTML = `
                <div class="sec-result-card denied">
                    <div class="result-header">
                        <span class="badge-icon">❌</span>
                        <h4>RESOURCE NOT FOUND (ACCESS DENIED)</h4>
                    </div>
                    <div class="result-details">
                        <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                        <div class="res-row"><span class="k">Target Path:</span><span class="v"><code>${resource}</code></span></div>
                        <div class="res-row"><span class="k">Status:</span><span class="v" style="color: #d13438; font-weight:bold;">The system cannot find the path specified</span></div>
                        <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4656 - Failed Object Access</span></div>
                    </div>
                    <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #fff0f0; border: 1px solid #f5c2c7; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #842029;">
                        <b>Evaluation Chain:</b><br>
                        The specified resource '<b>${resource}</b>' does not exist in the file system.<br>
                        &nbsp;&nbsp;→ <b>ACCESS DENIED</b>
                    </div>
                </div>
            `;
            return;
        }

        // 4. Explicit Deny
        if (check.reason === "EXPLICIT_DENY") {
            resultBox.innerHTML = `
                <div class="sec-result-card denied">
                    <div class="result-header">
                        <span class="badge-icon">🚫</span>
                        <h4>ACCESS DENIED (EXPLICIT DENY)</h4>
                    </div>
                    <div class="result-details">
                        <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                        <div class="res-row"><span class="k">Group Memberships:</span><span class="v"><b>${userGroupsStr}</b></span></div>
                        <div class="res-row"><span class="k">Resource:</span><span class="v"><code>${resource}</code></span></div>
                        <div class="res-row"><span class="k">Denied By:</span><span class="v" style="color: #d13438; font-weight:bold;">Explicit Deny on '${check.deniedBy}'</span></div>
                        <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4663 - Explicit Deny Security ACE Triggered</span></div>
                    </div>
                    <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #fce8e6; border: 1px solid #fad2cf; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #c5221f;">
                        <b>Evaluation Chain:</b><br>
                        ${username} matches principal '<b>${check.deniedBy}</b>'.<br>
                        &nbsp;&nbsp;→ An explicit <b>Deny</b> ACE was found.<br>
                        &nbsp;&nbsp;→ In Windows NTFS DACL evaluation, explicit Deny entries always take absolute precedence over Allow entries.<br>
                        &nbsp;&nbsp;→ <b>ACCESS DENIED</b>
                    </div>
                </div>
            `;
            return;
        }

        // 5. Access Granted
        if (check.granted) {
            resultBox.innerHTML = `
                <div class="sec-result-card granted">
                    <div class="result-header">
                        <span class="badge-icon">✅</span>
                        <h4>ACCESS GRANTED</h4>
                    </div>
                    <div class="result-details">
                        <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                        <div class="res-row"><span class="k">Group Memberships:</span><span class="v"><b>${userGroupsStr}</b></span></div>
                        <div class="res-row"><span class="k">Requested Action:</span><span class="v">${action}</span></div>
                        <div class="res-row"><span class="k">Effective Permission:</span><span class="v" style="color: #107c41; font-weight:bold;">${check.effectivePermission}</span></div>
                        <div class="res-row"><span class="k">Resource:</span><span class="v"><code>${resource}</code></span></div>
                        <div class="res-row"><span class="k">Granted Via:</span><span class="v"><b>${check.allowedBy || 'Direct Permission'}</b></span></div>
                        <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4663 - Object Access Granted (Success Audit)</span></div>
                    </div>
                    <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #e6f4ea; border: 1px solid #ceead6; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #137333;">
                        <b>Evaluation Chain:</b><br>
                        1. User '${username}' authenticated and token created.<br>
                        2. Group memberships resolved: [${userGroupsStr}].<br>
                        3. Evaluated DACL for '<b>${resource}</b>':<br>
                        &nbsp;&nbsp;→ <b>${check.allowedBy || 'Matching ACE'}</b> grants <b>${check.effectivePermission}</b>.<br>
                        &nbsp;&nbsp;→ Requested action '<b>${action}</b>' is satisfied by granted rights.<br>
                        &nbsp;&nbsp;→ <b>ACCESS GRANTED</b>
                    </div>
                </div>
            `;
            return;
        }

        // 6. Access Denied (Insufficient Permissions / No ACL)
        resultBox.innerHTML = `
            <div class="sec-result-card denied">
                <div class="result-header">
                    <span class="badge-icon">❌</span>
                    <h4>ACCESS DENIED</h4>
                </div>
                <div class="result-details">
                    <div class="res-row"><span class="k">User:</span><span class="v"><b>${username}</b></span></div>
                    <div class="res-row"><span class="k">Group Memberships:</span><span class="v"><b>${userGroupsStr}</b></span></div>
                    <div class="res-row"><span class="k">Requested Action:</span><span class="v">${action}</span></div>
                    <div class="res-row"><span class="k">Effective Permission:</span><span class="v" style="color: #d13438; font-weight:bold;">${check.effectivePermission}</span></div>
                    <div class="res-row"><span class="k">Resource:</span><span class="v"><code>${resource}</code></span></div>
                    <div class="res-row"><span class="k">Denial Reason:</span><span class="v">${check.message}</span></div>
                    <div class="res-row"><span class="k">Audit Event:</span><span class="v">Event ID 4663 - Access Denied (Failure Audit)</span></div>
                </div>
                <div class="result-chain-box" style="margin-top: 10px; padding: 10px 12px; background: #fce8e6; border: 1px solid #fad2cf; border-radius: 4px; font-size: 12px; line-height: 1.5; color: #c5221f;">
                    <b>Evaluation Chain:</b><br>
                    1. User '${username}' authenticated.<br>
                    2. Group memberships resolved: [${userGroupsStr}].<br>
                    3. Evaluated DACL for '<b>${resource}</b>':<br>
                    &nbsp;&nbsp;→ No ACE grants requested right '<b>${action}</b>' to '${username}' or any of their groups.<br>
                    &nbsp;&nbsp;→ <b>ACCESS DENIED</b>
                </div>
            </div>
        `;
    }

    closeModal() {
        window.windowsManager.closeAllModals();
    }
}

window.permissionsManager = new PermissionsManager();
