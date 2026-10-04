/**
 * System Administration Simulator - Computer Management & Users Management
 * Recreates MMC (compmgmt.msc), Local Users and Groups snap-in,
 * User creation, User Properties, Deletion, Disabling/Enabling, and Organizational Roles.
 */

class UsersManager {
    constructor() {
        this.selectedTreeNode = 'users'; // 'users', 'groups', 'events', 'disk'
        this.selectedUser = null;
        this.selectedRbacUser = 'jdoe';
        this.activeMmcWinId = null;

        this.init();
    }

    init() {
        window.systemState.subscribe((state, changeKey) => {
            if (['users', 'groups', 'roles', 'all'].includes(changeKey)) {
                this.refreshActiveMmcView();
                this.refreshRolesManager();
            }
        });
    }

    // --- COMPUTER MANAGEMENT (compmgmt.msc) ---
    renderComputerManagement(clientEl, winId) {
        this.activeMmcWinId = winId;
        clientEl.innerHTML = `
            <div class="mmc-wrapper">
                <!-- MMC Menu Bar -->
                <div class="mmc-menubar">
                    <span class="mmc-menu-item">File</span>
                    <span class="mmc-menu-item">Action</span>
                    <span class="mmc-menu-item">View</span>
                    <span class="mmc-menu-item">Help</span>
                </div>

                <!-- MMC Toolbar -->
                <div class="mmc-toolbar">
                    <button class="mmc-tb-btn" title="Back" disabled>⬅️</button>
                    <button class="mmc-tb-btn" title="Forward" disabled>➡️</button>
                    <div class="mmc-tb-sep"></div>
                    <button class="mmc-tb-btn" onclick="window.usersManager.refreshActiveMmcView()" title="Refresh">🔄</button>
                    <button class="mmc-tb-btn" onclick="window.usersManager.openNewUserDialog()" title="New User">👤➕</button>
                    <button class="mmc-tb-btn" onclick="window.groupsManager.openNewGroupDialog()" title="New Group">👥➕</button>
                </div>

                <!-- 3-Pane Body -->
                <div class="mmc-body-split">
                    <!-- Left Navigation Tree -->
                    <div class="mmc-tree-pane">
                        <div class="mmc-tree-node root">
                            <span class="tree-toggle">▼</span>
                            <span class="tree-icon">⚙️</span>
                            <span class="tree-label">Computer Management (Local)</span>
                        </div>
                        <div class="mmc-tree-children">
                            <!-- System Tools -->
                            <div class="mmc-tree-node">
                                <span class="tree-toggle">▼</span>
                                <span class="tree-icon">📁</span>
                                <span class="tree-label">System Tools</span>
                            </div>
                            <div class="mmc-tree-children">
                                <div class="mmc-tree-node leaf" id="node-scheduler" onclick="window.usersManager.selectTreeNode('scheduler')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">⏰</span>
                                    <span class="tree-label">Task Scheduler</span>
                                </div>
                                <div class="mmc-tree-node leaf" id="node-events" onclick="window.usersManager.selectTreeNode('events')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">📋</span>
                                    <span class="tree-label">Event Viewer</span>
                                </div>
                                <div class="mmc-tree-node leaf" id="node-shared" onclick="window.usersManager.selectTreeNode('shared')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">📁</span>
                                    <span class="tree-label">Shared Folders</span>
                                </div>
                                <div class="mmc-tree-node">
                                    <span class="tree-toggle">▼</span>
                                    <span class="tree-icon">👥</span>
                                    <span class="tree-label">Local Users and Groups</span>
                                </div>
                                <div class="mmc-tree-children">
                                    <div class="mmc-tree-node leaf active" id="node-users" onclick="window.usersManager.selectTreeNode('users')">
                                        <span class="tree-indent"></span><span class="tree-indent"></span>
                                        <span class="tree-icon">👤</span>
                                        <span class="tree-label">Users</span>
                                    </div>
                                    <div class="mmc-tree-node leaf" id="node-groups" onclick="window.usersManager.selectTreeNode('groups')">
                                        <span class="tree-indent"></span><span class="tree-indent"></span>
                                        <span class="tree-icon">👥</span>
                                        <span class="tree-label">Groups</span>
                                    </div>
                                </div>
                                <div class="mmc-tree-node leaf" id="node-perf" onclick="window.usersManager.selectTreeNode('perf')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">📈</span>
                                    <span class="tree-label">Performance</span>
                                </div>
                            </div>

                            <!-- Storage -->
                            <div class="mmc-tree-node">
                                <span class="tree-toggle">▼</span>
                                <span class="tree-icon">💾</span>
                                <span class="tree-label">Storage</span>
                            </div>
                            <div class="mmc-tree-children">
                                <div class="mmc-tree-node leaf" id="node-disk" onclick="window.usersManager.selectTreeNode('disk')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">💽</span>
                                    <span class="tree-label">Disk Management</span>
                                </div>
                            </div>

                            <!-- Services and Applications -->
                            <div class="mmc-tree-node">
                                <span class="tree-toggle">▼</span>
                                <span class="tree-icon">⚙️</span>
                                <span class="tree-label">Services and Applications</span>
                            </div>
                            <div class="mmc-tree-children">
                                <div class="mmc-tree-node leaf" id="node-services" onclick="window.usersManager.selectTreeNode('services')">
                                    <span class="tree-indent"></span>
                                    <span class="tree-icon">🔧</span>
                                    <span class="tree-label">Services</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Center Main Pane -->
                    <div class="mmc-main-pane" id="mmc-main-view">
                        <!-- Rendered by selectTreeNode -->
                    </div>

                    <!-- Right Action Pane -->
                    <div class="mmc-action-pane" id="mmc-action-view">
                        <!-- Action links -->
                    </div>
                </div>

                <!-- Status Bar -->
                <div class="mmc-status-bar">
                    <span id="mmc-status-text">Ready</span>
                </div>
            </div>
        `;

        this.selectTreeNode(this.selectedTreeNode);
    }

    selectTreeNode(nodeKey) {
        this.selectedTreeNode = nodeKey;
        if (window.systemState) {
            window.systemState.setActiveMmcNode(nodeKey);
        }
        document.querySelectorAll('.mmc-tree-node.leaf').forEach(el => el.classList.remove('active'));

        const targetNodeEl = document.getElementById(`node-${nodeKey}`);
        if (targetNodeEl) targetNodeEl.classList.add('active');

        const mainEl = document.getElementById('mmc-main-view');
        const actionEl = document.getElementById('mmc-action-view');
        const statusEl = document.getElementById('mmc-status-text');
        if (!mainEl || !actionEl) return;

        if (nodeKey === 'users') {
            this.renderUsersList(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `${window.systemState.getState().users.length} item(s)`;
        } else if (nodeKey === 'groups') {
            if (window.groupsManager) {
                window.groupsManager.renderGroupsList(mainEl, actionEl);
            }
            if (statusEl) statusEl.textContent = `${window.systemState.getState().groups.length} item(s)`;
        } else if (nodeKey === 'events') {
            if (window.auditManager) {
                window.auditManager.renderEventViewer(mainEl, actionEl);
            }
            if (statusEl) statusEl.textContent = `Security Audit Log`;
        } else if (nodeKey === 'disk') {
            this.renderDiskManagement(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `1 Disk(s) Online`;
        } else if (nodeKey === 'scheduler') {
            this.renderTaskScheduler(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `Task Scheduler (Local)`;
        } else if (nodeKey === 'shared') {
            this.renderSharedFolders(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `4 Share(s) Active`;
        } else if (nodeKey === 'perf') {
            this.renderPerformance(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `Performance Monitor`;
        } else if (nodeKey === 'services') {
            this.renderServices(mainEl, actionEl);
            if (statusEl) statusEl.textContent = `Services (Local)`;
        } else {
            mainEl.innerHTML = `<div style="padding: 20px; color: #666;">Select <b>Users</b>, <b>Groups</b>, or <b>Event Viewer</b> to manage server components.</div>`;
            actionEl.innerHTML = '';
        }
    }

    renderTaskScheduler(mainEl, actionEl) {
        mainEl.innerHTML = `
            <div class="mmc-list-table-container">
                <table class="win-table mmc-table">
                    <thead>
                        <tr><th>Task Name</th><th>Status</th><th>Triggers</th><th>Next Run Time</th><th>Author</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>ServerManagerTask</b></td><td><span class="status-pill ok">Ready</span></td><td>At logon of any user</td><td>N/A</td><td>Microsoft Corporation</td></tr>
                        <tr><td><b>ScheduledDefrag</b></td><td><span class="status-pill ok">Ready</span></td><td>Weekly at 01:00</td><td>Sunday 01:00</td><td>Microsoft Corporation</td></tr>
                        <tr><td><b>Automatic Maintenance</b></td><td><span class="status-pill ok">Ready</span></td><td>Daily at 02:00</td><td>Tomorrow 02:00</td><td>Microsoft Corporation</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Task Scheduler</div>
                <div class="action-link" onclick="alert('Create Basic Task Wizard')"><span class="link-icon">➕</span> Create Basic Task...</div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()"><span class="link-icon">🔄</span> Refresh</div>
            </div>
        `;
    }

    renderSharedFolders(mainEl, actionEl) {
        mainEl.innerHTML = `
            <div class="mmc-list-table-container">
                <table class="win-table mmc-table">
                    <thead>
                        <tr><th>Shared Folder</th><th>Shared Path</th><th>Type</th><th>Comment</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>ADMIN$</b></td><td>C:\\Windows</td><td>Windows</td><td>Remote Admin</td></tr>
                        <tr><td><b>C$</b></td><td>C:\\</td><td>Windows</td><td>Default share</td></tr>
                        <tr><td><b>IPC$</b></td><td></td><td>Windows</td><td>Remote IPC</td></tr>
                        <tr><td><b>FinanceData</b></td><td>C:\\FinanceData</td><td>Windows</td><td>Finance Department Share</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Shared Folders</div>
                <div class="action-link" onclick="window.permissionsManager.openSecurityProperties('C:\\FinanceData')"><span class="link-icon">⚙️</span> Share Properties</div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()"><span class="link-icon">🔄</span> Refresh</div>
            </div>
        `;
    }

    renderPerformance(mainEl, actionEl) {
        mainEl.innerHTML = `
            <div style="padding: 20px; font-family: Segoe UI, sans-serif;">
                <h4 style="margin-top:0;">Performance Monitor Overview (WIN-SERVER)</h4>
                <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
                    <div style="background:#f4f4f4; border:1px solid #ddd; padding:12px; border-radius:4px; text-align:center;">
                        <div style="font-size:24px; color:#0078d7; font-weight:bold;">12%</div>
                        <div style="font-size:12px; color:#555; margin-top:4px;">CPU Utilization</div>
                    </div>
                    <div style="background:#f4f4f4; border:1px solid #ddd; padding:12px; border-radius:4px; text-align:center;">
                        <div style="font-size:24px; color:#107c41; font-weight:bold;">1.8 / 4.0 GB</div>
                        <div style="font-size:12px; color:#555; margin-top:4px;">Memory Usage</div>
                    </div>
                    <div style="background:#f4f4f4; border:1px solid #ddd; padding:12px; border-radius:4px; text-align:center;">
                        <div style="font-size:24px; color:#0078d7; font-weight:bold;">0%</div>
                        <div style="font-size:12px; color:#555; margin-top:4px;">Disk Active Time</div>
                    </div>
                </div>
            </div>
        `;
        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Performance</div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()"><span class="link-icon">🔄</span> Refresh</div>
            </div>
        `;
    }

    renderServices(mainEl, actionEl) {
        mainEl.innerHTML = `
            <div class="mmc-list-table-container">
                <table class="win-table mmc-table">
                    <thead>
                        <tr><th>Name</th><th>Description</th><th>Status</th><th>Startup Type</th><th>Log On As</th></tr>
                    </thead>
                    <tbody>
                        <tr><td><b>LanmanServer</b></td><td>Supports file, print, and named-pipe sharing</td><td><span class="status-pill ok">Running</span></td><td>Automatic</td><td>Local System</td></tr>
                        <tr><td><b>LanmanWorkstation</b></td><td>Creates and maintains client network connections</td><td><span class="status-pill ok">Running</span></td><td>Automatic</td><td>Network Service</td></tr>
                        <tr><td><b>EventLog</b></td><td>Manages events and event logs</td><td><span class="status-pill ok">Running</span></td><td>Automatic</td><td>Local Service</td></tr>
                        <tr><td><b>W32Time</b></td><td>Maintains date and time synchronization</td><td><span class="status-pill ok">Running</span></td><td>Manual</td><td>Local Service</td></tr>
                        <tr><td><b>WinDefend</b></td><td>Microsoft Defender Antivirus Service</td><td><span class="status-pill ok">Running</span></td><td>Automatic</td><td>Local System</td></tr>
                    </tbody>
                </table>
            </div>
        `;
        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Services</div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()"><span class="link-icon">🔄</span> Refresh</div>
            </div>
        `;
    }

    refreshActiveMmcView() {
        const mainEl = document.getElementById('mmc-main-view');
        if (mainEl) {
            this.selectTreeNode(this.selectedTreeNode);
        }
    }

    // --- USERS LIST VIEW ---
    renderUsersList(mainEl, actionEl) {
        const users = window.systemState.getState().users;

        mainEl.innerHTML = `
            <div class="mmc-list-table-container" oncontextmenu="window.usersManager.showUsersEmptyContextMenu(event)">
                <table class="win-table mmc-table" id="users-table">
                    <thead>
                        <tr>
                            <th style="width: 140px;">Name</th>
                            <th style="width: 160px;">Full Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${users.map(u => `
                            <tr class="user-row ${u.disabled ? 'disabled-account' : ''}" 
                                onclick="window.usersManager.selectUserRow('${u.username}', this)" 
                                ondblclick="window.usersManager.openUserProperties('${u.username}')"
                                oncontextmenu="window.usersManager.showUserContextMenu(event, '${u.username}')">
                                <td>
                                    <span class="user-icon-badge ${u.disabled ? 'is-disabled' : ''}">👤</span>
                                    <b>${u.username}</b>
                                </td>
                                <td>${u.fullName || ''}</td>
                                <td>${u.description || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Users</div>
                <div class="action-link" onclick="window.usersManager.openNewUserDialog()">
                    <span class="link-icon">👤➕</span> New User...
                </div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()">
                    <span class="link-icon">🔄</span> Refresh
                </div>
                <div class="action-divider"></div>
                <div class="action-header">Educational Analysis</div>
                <div class="action-link" onclick="window.usersManager.openEducationalRoleSummary('jdoe')">
                    <span class="link-icon">🎓</span> RBAC Flow Summary
                </div>
                <div class="action-divider"></div>
                <div class="action-header">Selected User</div>
                <div id="user-selected-actions">
                    <small style="color: #666; padding: 4px 10px; display: block;">Select a user to view actions</small>
                </div>
            </div>
        `;
    }

    selectUserRow(username, rowEl) {
        this.selectedUser = username;
        document.querySelectorAll('#users-table tbody tr').forEach(r => r.classList.remove('selected'));
        if (rowEl) rowEl.classList.add('selected');

        const user = window.systemState.getState().users.find(u => u.username === username);
        const actionsContainer = document.getElementById('user-selected-actions');
        if (!actionsContainer || !user) return;

        actionsContainer.innerHTML = `
            <div class="action-link" onclick="window.usersManager.openUserProperties('${username}')">
                <span class="link-icon">⚙️</span> Properties
            </div>
            <div class="action-link" onclick="window.usersManager.promptRenameUser('${username}')">
                <span class="link-icon">✏️</span> Rename
            </div>
            <div class="action-link" onclick="window.usersManager.toggleUserDisabled('${username}')">
                <span class="link-icon">${user.disabled ? '🟢' : '🔴'}</span> ${user.disabled ? 'Enable Account' : 'Disable Account'}
            </div>
            <div class="action-link" onclick="window.usersManager.promptDeleteUser('${username}')">
                <span class="link-icon">🗑️</span> Delete
            </div>
            <div class="action-link" onclick="window.usersManager.promptSetPassword('${username}')">
                <span class="link-icon">🔑</span> Set Password...
            </div>
        `;
    }

    // --- CONTEXT MENUS ---
    showUsersEmptyContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        this.removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        menu.innerHTML = `
            <div class="menu-item bold" onclick="window.usersManager.openNewUserDialog(); window.usersManager.removeContextMenu();">
                New User...
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="window.usersManager.refreshActiveMmcView(); window.usersManager.removeContextMenu();">
                Refresh
            </div>
        `;

        document.body.appendChild(menu);
        this.bindDismissContextMenu(menu);
    }

    showUserContextMenu(e, username) {
        e.preventDefault();
        e.stopPropagation();
        this.removeContextMenu();
        this.selectedUser = username;

        const user = window.systemState.getState().users.find(u => u.username === username);
        if (!user) return;

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        if (user.disabled) {
            // State: Account is disabled (Requirement 8)
            menu.innerHTML = `
                <div class="menu-item bold" onclick="window.usersManager.openUserProperties('${username}'); window.usersManager.removeContextMenu();">
                    Properties
                </div>
                <div class="menu-item" onclick="window.usersManager.toggleUserDisabled('${username}'); window.usersManager.removeContextMenu();">
                    Enable Account
                </div>
                ${user.username !== 'Administrator' ? `
                    <div class="menu-item" onclick="window.usersManager.promptDeleteUser('${username}'); window.usersManager.removeContextMenu();">
                        Delete
                    </div>
                    <div class="menu-item" onclick="window.usersManager.promptRenameUser('${username}'); window.usersManager.removeContextMenu();">
                        Rename
                    </div>
                ` : ''}
                <div class="menu-separator"></div>
                <div class="menu-item" onclick="alert('Help on managing user accounts.'); window.usersManager.removeContextMenu();">
                    Help
                </div>
            `;
        } else {
            // State: Account is enabled (Requirement 8)
            const userGroups = window.systemState.getUserGroups(username);
            const removableGroups = userGroups.filter(g => g.name !== 'Users' && !(g.name === 'Administrators' && username === 'Administrator'));
            menu.innerHTML = `
                <div class="menu-item bold" onclick="window.usersManager.openUserProperties('${username}'); window.usersManager.removeContextMenu();">
                    Properties
                </div>
                <div class="menu-item" onclick="window.usersManager.promptSetPassword('${username}'); window.usersManager.removeContextMenu();">
                    Set Password...
                </div>
                ${user.username !== 'Administrator' ? `
                    <div class="menu-item" onclick="window.usersManager.promptRenameUser('${username}'); window.usersManager.removeContextMenu();">
                        Rename
                    </div>
                ` : ''}
                <div class="menu-separator"></div>
                <div class="menu-item" onclick="window.usersManager.openSelectGroupDialog('${username}'); window.usersManager.removeContextMenu();">
                    Add to Group...
                </div>
                ${removableGroups.length > 0 ? `
                    <div class="menu-item" onclick="window.usersManager.promptQuickRemoveFromGroup('${username}'); window.usersManager.removeContextMenu();">
                        Remove from Group...
                    </div>
                ` : ''}
                <div class="menu-separator"></div>
                ${user.username !== 'Administrator' ? `
                    <div class="menu-item" onclick="window.usersManager.toggleUserDisabled('${username}'); window.usersManager.removeContextMenu();">
                        Disable Account
                    </div>
                    <div class="menu-item" onclick="window.usersManager.promptDeleteUser('${username}'); window.usersManager.removeContextMenu();">
                        Delete
                    </div>
                ` : ''}
                <div class="menu-separator"></div>
                <div class="menu-item" onclick="alert('Help on managing user accounts.'); window.usersManager.removeContextMenu();">
                    Help
                </div>
            `;
        }

        document.body.appendChild(menu);
        this.bindDismissContextMenu(menu);
    }

    promptQuickRemoveFromGroup(username) {
        const userGroups = window.systemState.getUserGroups(username);
        const removableGroups = userGroups.filter(g => g.name !== 'Users' && !(g.name === 'Administrators' && username === 'Administrator'));
        if (removableGroups.length === 0) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: `User '${username}' does not belong to any removable custom groups.`,
                icon: "info"
            });
            return;
        }

        if (removableGroups.length === 1) {
            const targetGroup = removableGroups[0].name;
            window.windowsManager.showConfirmBox({
                title: "Local Users and Groups",
                message: `Remove user "${username}" from security group "${targetGroup}"?`,
                onYes: () => {
                    const res = window.systemState.removeUserFromGroup(username, targetGroup);
                    if (!res.success) {
                        window.windowsManager.showMsgBox({ title: "Local Users and Groups", message: res.error, icon: "warning" });
                    }
                }
            });
            return;
        }

        // Multiple groups: prompt to choose
        const groupOptions = removableGroups.map(g => g.name).join(', ');
        const chosen = prompt(`Enter group name to remove '${username}' from (${groupOptions}):`, removableGroups[0].name);
        if (chosen) {
            const res = window.systemState.removeUserFromGroup(username, chosen.trim());
            if (!res.success) {
                window.windowsManager.showMsgBox({ title: "Local Users and Groups", message: res.error, icon: "warning" });
            }
        }
    }

    promptRenameUser(username) {
        if (username === 'Administrator') {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: "Renaming the built-in Administrator account is restricted in this lab.",
                icon: "warning"
            });
            return;
        }
        const newName = prompt(`Enter new user name for "${username}":`, username);
        if (newName && newName !== username) {
            const res = window.systemState.renameUser(username, newName);
            if (!res.success) {
                window.windowsManager.showMsgBox({
                    title: "Local Users and Groups",
                    message: res.error,
                    icon: "error"
                });
            }
        }
    }

    removeContextMenu() {
        document.querySelectorAll('.win-context-menu').forEach(m => m.remove());
    }

    bindDismissContextMenu(menu) {
        const dismiss = (ev) => {
            if (!menu.contains(ev.target)) {
                menu.remove();
                document.removeEventListener('click', dismiss);
                document.removeEventListener('contextmenu', dismiss);
            }
        };
        setTimeout(() => {
            document.addEventListener('click', dismiss);
            document.addEventListener('contextmenu', dismiss);
        }, 50);
    }

    // --- CREATE NEW USER DIALOG ---
    openNewUserDialog() {
        if (window.windowsManager.openModals.has('modal-new-user')) {
            window.windowsManager.closeModal('modal-new-user');
        }

        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');

        // Smart default username: if jdoe already exists, suggest next uncreated user
        const existingUsers = (window.systemState && window.systemState.getState().users) || [];
        let defUser = 'jdoe';
        let defFull = 'John Doe';
        let defDesc = 'Financial Analyst';
        if (existingUsers.some(u => u.username.toLowerCase() === 'jdoe')) {
            if (!existingUsers.some(u => u.username.toLowerCase() === 'asmith')) {
                defUser = 'asmith';
                defFull = 'Alice Smith';
                defDesc = 'Finance Manager';
            } else if (!existingUsers.some(u => u.username.toLowerCase() === 'mwilson')) {
                defUser = 'mwilson';
                defFull = 'Mark Wilson';
                defDesc = 'Marketing Specialist';
            } else {
                defUser = 'user' + (existingUsers.length + 1);
                defFull = 'Staff User';
                defDesc = 'Domain User Account';
            }
        }

        const html = `
            <div class="win-dialog new-user-dialog" style="width: 440px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">New User</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('modal-new-user')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <div class="win-form-row">
                        <label for="nu-username">User name:</label>
                        <input type="text" id="nu-username" class="win-input" value="${defUser}" autocomplete="off" />
                    </div>
                    <div class="win-form-row">
                        <label for="nu-fullname">Full name:</label>
                        <input type="text" id="nu-fullname" class="win-input" value="${defFull}" autocomplete="off" />
                    </div>
                    <div class="win-form-row">
                        <label for="nu-description">Description:</label>
                        <input type="text" id="nu-description" class="win-input" value="${defDesc}" autocomplete="off" />
                    </div>
                    <div class="win-form-row">
                        <label for="nu-password">Password:</label>
                        <input type="password" id="nu-password" class="win-input" value="User@12345" />
                    </div>
                    <div class="win-form-row">
                        <label for="nu-confirm">Confirm password:</label>
                        <input type="password" id="nu-confirm" class="win-input" value="User@12345" />
                    </div>

                    <div class="win-dialog-groupbox" style="margin-top: 15px;">
                        <div class="groupbox-title">Account Options</div>
                        <div class="groupbox-content">
                            <label class="win-chk-label">
                                <input type="checkbox" id="nu-must-change"> User must change password at next logon
                            </label>
                            <label class="win-chk-label">
                                <input type="checkbox" id="nu-cannot-change"> User cannot change password
                            </label>
                            <label class="win-chk-label">
                                <input type="checkbox" id="nu-never-expires" checked> Password never expires
                            </label>
                            <label class="win-chk-label">
                                <input type="checkbox" id="nu-disabled"> Account is disabled
                            </label>
                        </div>
                    </div>
                    <div id="nu-error-msg" class="win-error-msg" style="display: none; color: #d13438; margin-top: 8px; font-size: 12px;"></div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.usersManager.submitNewUser()">Create</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('modal-new-user')">Close</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: 'modal-new-user',
            title: 'New User',
            parentWinId: compMgmtWinId,
            html
        });
        setTimeout(() => {
            const input = document.getElementById('nu-username');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    submitNewUser() {
        const username = document.getElementById('nu-username')?.value.trim();
        const fullName = document.getElementById('nu-fullname')?.value.trim();
        const description = document.getElementById('nu-description')?.value.trim();
        const password = document.getElementById('nu-password')?.value;
        const confirm = document.getElementById('nu-confirm')?.value;
        const mustChangePassword = document.getElementById('nu-must-change')?.checked;
        const cannotChangePassword = document.getElementById('nu-cannot-change')?.checked;
        const passwordNeverExpires = document.getElementById('nu-never-expires')?.checked;
        const disabled = document.getElementById('nu-disabled')?.checked;
        const errEl = document.getElementById('nu-error-msg');

        if (!username) {
            this.showDialogError(errEl, "User name cannot be blank.");
            return;
        }

        if (password !== confirm) {
            this.showDialogError(errEl, "The passwords do not match. Please re-enter the password.");
            return;
        }

        const res = window.systemState.createUser({
            username,
            fullName,
            description,
            password,
            mustChangePassword,
            cannotChangePassword,
            passwordNeverExpires,
            disabled
        });

        if (!res.success) {
            this.showDialogError(errEl, res.error);
            return;
        }

        window.windowsManager.closeModal('modal-new-user');
    }

    showDialogError(errEl, message) {
        if (!errEl) return;
        errEl.textContent = message;
        errEl.style.display = 'block';
    }

    // --- USER PROPERTIES DIALOG (General, Member Of, Profile) ---
    openUserProperties(username) {
        const user = window.systemState.getState().users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) return;

        const userGroups = window.systemState.getUserGroups(username);
        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');
        const modalId = `modal-user-${user.username}`;

        const html = `
            <div class="win-dialog user-props-dialog">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">${user.username} Properties</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-tab-header">
                    <div class="win-tab-btn active" onclick="window.usersManager.switchPropTab('general')">General</div>
                    <div class="win-tab-btn" onclick="window.usersManager.switchPropTab('memberof')">Member Of</div>
                    <div class="win-tab-btn" onclick="window.usersManager.switchPropTab('profile')">Profile</div>
                </div>
                <div class="win-dialog-body">
                    <!-- GENERAL TAB -->
                    <div id="uprop-tab-general" class="win-tab-panel active">
                        <div class="win-form-row">
                            <label>Full name:</label>
                            <input type="text" id="up-fullname" class="win-input" value="${user.fullName || ''}" />
                        </div>
                        <div class="win-form-row">
                            <label>Description:</label>
                            <input type="text" id="up-description" class="win-input" value="${user.description || ''}" />
                        </div>
                        <div style="margin: 6px 0 12px 120px;">
                            <button class="win-btn win-btn-sm" style="font-size: 11px;" onclick="window.usersManager.openEducationalRoleSummary('${user.username}')">
                                🎓 View Educational RBAC Flow
                            </button>
                        </div>
                        <div class="win-dialog-groupbox" style="margin-top: 10px;">
                            <div class="groupbox-content">
                                <label class="win-chk-label">
                                    <input type="checkbox" id="up-cannot-change" ${user.cannotChangePassword ? 'checked' : ''}> User cannot change password
                                </label>
                                <label class="win-chk-label">
                                    <input type="checkbox" id="up-never-expires" ${user.passwordNeverExpires ? 'checked' : ''}> Password never expires
                                </label>
                                <label class="win-chk-label">
                                    <input type="checkbox" id="up-disabled" ${user.disabled ? 'checked' : ''} ${user.username === 'Administrator' ? 'disabled' : ''}> Account is disabled
                                </label>
                            </div>
                        </div>
                    </div>

                    <!-- MEMBER OF TAB -->
                    <div id="uprop-tab-memberof" class="win-tab-panel">
                        <p style="margin-bottom: 8px;">Member of:</p>
                        <div class="win-listbox" id="up-groups-listbox">
                            ${userGroups.map(g => `
                                <div class="win-listbox-item" onclick="window.usersManager.selectGroupInList(this, '${g.name}')">
                                    <span class="icon">👥</span> ${g.name}
                                </div>
                            `).join('')}
                        </div>
                        <div class="win-listbox-actions">
                            <button class="win-btn" onclick="window.usersManager.openSelectGroupDialog('${user.username}')">Add...</button>
                            <button class="win-btn" id="up-btn-remove-group" onclick="window.usersManager.removeSelectedGroup('${user.username}')" disabled>Remove</button>
                        </div>
                    </div>

                    <!-- PROFILE TAB -->
                    <div id="uprop-tab-profile" class="win-tab-panel">
                        <div class="win-form-row">
                            <label>Profile path:</label>
                            <input type="text" class="win-input" value="\\\\WIN-SERVER\\Profiles\\${user.username}" disabled />
                        </div>
                        <div class="win-form-row">
                            <label>Logon script:</label>
                            <input type="text" class="win-input" value="logon.bat" disabled />
                        </div>
                        <div class="win-form-row">
                            <label>Local path:</label>
                            <input type="text" class="win-input" value="C:\\Users\\${user.username}" disabled />
                        </div>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.usersManager.submitUserProperties('${user.username}', true)">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                    <button class="win-btn" onclick="window.usersManager.submitUserProperties('${user.username}', false)">Apply</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: `${user.username} Properties`,
            parentWinId: compMgmtWinId,
            html
        });
    }

    switchPropTab(tabId) {
        document.querySelectorAll('.user-props-dialog .win-tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.user-props-dialog .win-tab-panel').forEach(p => p.classList.remove('active'));

        const targetBtn = document.querySelector(`.user-props-dialog .win-tab-btn[onclick*="${tabId}"]`);
        const targetPanel = document.getElementById(`uprop-tab-${tabId}`);
        if (targetBtn) targetBtn.classList.add('active');
        if (targetPanel) targetPanel.classList.add('active');
    }

    selectGroupInList(itemEl, groupName) {
        document.querySelectorAll('#up-groups-listbox .win-listbox-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedGroupInList = groupName;
        const btnRemove = document.getElementById('up-btn-remove-group');
        if (btnRemove) btnRemove.disabled = false;
    }

    removeSelectedGroup(username) {
        if (!this.selectedGroupInList) return;
        const res = window.systemState.removeUserFromGroup(username, this.selectedGroupInList);
        if (!res.success) {
            window.windowsManager.showMsgBox({ title: 'Local Users and Groups', message: res.error, icon: 'warning' });
            return;
        }
        this.openUserProperties(username);
        this.switchPropTab('memberof');
    }

    openSelectGroupDialog(username) {
        const allGroups = window.systemState.getState().groups;
        const userGroups = window.systemState.getUserGroups(username).map(g => g.name);
        const availableGroups = allGroups.filter(g => !userGroups.includes(g.name));
        const subModalId = `modal-select-grp-${username}`;
        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');

        const html = `
            <div class="win-dialog select-object-dialog" style="width: 500px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Select Groups</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${subModalId}')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <p style="margin-bottom: 8px;">Select from existing security groups:</p>
                    <div class="win-listbox" style="height: 150px; margin: 8px 0;">
                        ${availableGroups.map(g => `
                            <div class="win-listbox-item" onclick="this.parentElement.querySelectorAll('.win-listbox-item').forEach(i=>i.classList.remove('selected')); this.classList.add('selected'); document.getElementById('sel-grp-name').value='${g.name}';">
                                <span class="icon">👥</span> <b>${g.name}</b> <small style="color: #666;">- ${g.description}</small>
                            </div>
                        `).join('')}
                    </div>
                    <div class="win-form-row">
                        <label>Enter the object names to select:</label>
                        <input type="text" id="sel-grp-name" class="win-input" value="${availableGroups[0] ? availableGroups[0].name : ''}" autocomplete="off" />
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.usersManager.submitAddGroupMembership('${username}')">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${subModalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: subModalId,
            title: 'Select Groups',
            parentModalId: `modal-user-${username}`,
            parentWinId: compMgmtWinId,
            html
        });

        setTimeout(() => {
            const input = document.getElementById('sel-grp-name');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    submitAddGroupMembership(username) {
        const groupName = document.getElementById('sel-grp-name')?.value.trim();
        if (!groupName) return;

        const subModalId = `modal-select-grp-${username}`;
        const res = window.systemState.addUserToGroup(username, groupName);
        window.windowsManager.closeModal(subModalId);

        if (!res.success) {
            window.windowsManager.showMsgBox({ title: 'Local Users and Groups', message: res.error, icon: 'warning' });
            return;
        }

        this.openUserProperties(username);
        this.switchPropTab('memberof');
    }

    submitUserProperties(username, closeModal = true) {
        const fullName = document.getElementById('up-fullname')?.value.trim();
        const description = document.getElementById('up-description')?.value.trim();
        const cannotChangePassword = document.getElementById('up-cannot-change')?.checked;
        const passwordNeverExpires = document.getElementById('up-never-expires')?.checked;
        const disabled = document.getElementById('up-disabled')?.checked;

        window.systemState.updateUser(username, {
            fullName,
            description,
            cannotChangePassword,
            passwordNeverExpires,
            disabled
        });

        if (closeModal) {
            window.windowsManager.closeModal(`modal-user-${username}`);
        }
    }

    // --- DELETE USER ---
    promptDeleteUser(username) {
        if (username === 'Administrator') {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: "Cannot delete the primary Administrator account.",
                icon: "error"
            });
            return;
        }

        window.windowsManager.showConfirmBox({
            title: "Local Users and Groups",
            message: `Are you sure you want to delete the user "${username}"?\n\nEach user account is represented by a unique security identifier (SID). Even if you create a new user with the same name, it will not have the same access permissions. This action cannot be undone.`,
            onYes: () => this.executeDeleteUser(username)
        });
    }

    executeDeleteUser(username) {
        const res = window.systemState.deleteUser(username);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: res.error,
                icon: "warning"
            });
        }
    }

    // --- DISABLE / ENABLE USER ---
    toggleUserDisabled(username) {
        const res = window.systemState.toggleUserDisabled(username);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: res.error,
                icon: "warning"
            });
        }
    }

    promptSetPassword(username) {
        const pass = prompt(`Enter new password for ${username}:`, "NewPassword123!");
        if (pass) {
            window.systemState.updateUser(username, { password: pass });
            window.windowsManager.showMsgBox({
                title: "Set Password",
                message: `Password for ${username} successfully updated.`,
                icon: "info"
            });
        }
    }

    // --- EDUCATIONAL RBAC SUMMARY (User -> Role -> Group -> Permission) ---
    openEducationalRoleSummary(initialUsername = 'jdoe') {
        const modalId = 'modal-educational-rbac-summary';
        const users = window.systemState.getState().users;
        const currentTargetUser = users.find(u => u.username.toLowerCase() === initialUsername.toLowerCase()) || users[0] || { username: initialUsername };

        const renderContent = (targetUsername) => {
            const u = window.systemState.getState().users.find(x => x.username.toLowerCase() === targetUsername.toLowerCase()) || { username: targetUsername, description: 'No description' };
            const uGroups = window.systemState.getUserGroups(u.username);
            const primaryGroup = uGroups.find(g => g.name.startsWith('GRP_')) || uGroups.find(g => g.name !== 'Users') || uGroups[0] || { name: 'None' };
            const roleMatch = ROLE_CATALOG.find(r => r.securityGroup === primaryGroup.name) || {
                roleName: u.description || 'Standard User',
                resourceDisplay: 'C:\\FinanceData',
                resource: 'C:\\FinanceData',
                permissions: primaryGroup.name === 'GRP_Finance' ? 'Modify' : 'None'
            };

            return `
                <div class="win-dialog" style="width: 720px; max-width: 95vw; box-shadow: 0 10px 35px rgba(0,0,0,0.6);">
                    <div class="win-dialog-titlebar" style="background: #0078d7; color: white;">
                        <span class="win-dialog-title" style="color: white; font-weight: bold;">🎓 Educational Summary: Role-Based Access Control (RBAC)</span>
                        <button class="win-dialog-close" style="color: white;" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                    </div>
                    <div class="win-dialog-body" style="padding: 18px; font-size: 13px;">
                        <div style="background: #eef7ff; border: 1px solid #cce4f7; padding: 10px 14px; border-radius: 4px; margin-bottom: 16px;">
                            <b>Classroom Demonstration Context:</b> Windows Server Local Users and Groups does not natively have an "Assign Role" button. Instead, job roles are documented in user account descriptions and realized through <b>Security Group Memberships</b> and <b>NTFS Permissions</b>.
                        </div>

                        <div style="margin-bottom: 16px; display: flex; align-items: center; gap: 10px;">
                            <label><b>Select Simulated User Account:</b></label>
                            <select id="edu-user-select" class="win-input" style="width: 220px;" onchange="window.usersManager.openEducationalRoleSummary(this.value)">
                                ${users.map(userItem => `
                                    <option value="${userItem.username}" ${userItem.username.toLowerCase() === u.username.toLowerCase() ? 'selected' : ''}>
                                        ${userItem.username} (${userItem.fullName || userItem.username})
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Conceptual RBAC Pipeline Flowchart -->
                        <div style="display: flex; align-items: stretch; justify-content: space-between; gap: 8px; margin: 18px 0; background: #fafafa; border: 1px solid #e1e1e1; padding: 14px; border-radius: 6px;">
                            <div style="flex: 1; background: white; border: 1px solid #d0d0d0; padding: 10px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 22px; margin-bottom: 4px;">👤</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold;">1. User Account</div>
                                <div style="font-weight: bold; font-size: 14px; color: #0078d7; margin-top: 4px;">${u.username}</div>
                                <div style="font-size: 11px; color: #777;">${u.disabled ? '<span style="color:red;">(Account Disabled)</span>' : '(Active)'}</div>
                            </div>
                            <div style="display: flex; align-items: center; color: #999; font-size: 18px;">➔</div>
                            <div style="flex: 1.2; background: white; border: 1px solid #d0d0d0; padding: 10px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 22px; margin-bottom: 4px;">💼</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold;">2. Job Role (Description)</div>
                                <div style="font-weight: bold; font-size: 13px; color: #333; margin-top: 4px;">${u.description || roleMatch.roleName}</div>
                                <div style="font-size: 11px; color: #777;">Organizational Designation</div>
                            </div>
                            <div style="display: flex; align-items: center; color: #999; font-size: 18px;">➔</div>
                            <div style="flex: 1; background: white; border: 1px solid #d0d0d0; padding: 10px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 22px; margin-bottom: 4px;">👥</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold;">3. Security Group</div>
                                <div style="font-weight: bold; font-size: 14px; color: #107c41; margin-top: 4px;">${primaryGroup.name}</div>
                                <div style="font-size: 11px; color: #777;">Member Of</div>
                            </div>
                            <div style="display: flex; align-items: center; color: #999; font-size: 18px;">➔</div>
                            <div style="flex: 1.2; background: white; border: 1px solid #d0d0d0; padding: 10px; border-radius: 4px; text-align: center;">
                                <div style="font-size: 22px; margin-bottom: 4px;">📁</div>
                                <div style="font-size: 11px; text-transform: uppercase; color: #666; font-weight: bold;">4. Resource & Rights</div>
                                <div style="font-weight: bold; font-size: 13px; color: #d83b01; margin-top: 4px;">${roleMatch.resourceDisplay || 'C:\\FinanceData'}</div>
                                <div style="font-size: 12px; font-weight: bold; color: #0078d7; margin-top: 2px;">${roleMatch.permissions || 'Inherited'}</div>
                            </div>
                        </div>

                        <!-- Technical Summary Table -->
                        <table class="win-table" style="width: 100%; margin-top: 14px;">
                            <tbody>
                                <tr>
                                    <td style="width: 180px; font-weight: bold; background: #f8f8f8;">Simulated Username:</td>
                                    <td><b>${u.username}</b> (SID: ${u.sid || 'N/A'})</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; background: #f8f8f8;">Organizational Role:</td>
                                    <td>${u.description || roleMatch.roleName}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; background: #f8f8f8;">Assigned Security Group:</td>
                                    <td><b>${primaryGroup.name}</b> ${uGroups.length > 1 ? `(and ${uGroups.length - 1} other groups: ${uGroups.filter(g => g.name !== primaryGroup.name).map(g => g.name).join(', ')})` : ''}</td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; background: #f8f8f8;">Target Resource:</td>
                                    <td><code>C:\\FinanceData</code></td>
                                </tr>
                                <tr>
                                    <td style="font-weight: bold; background: #f8f8f8;">Effective NTFS Permission:</td>
                                    <td><span class="status-pill ok" style="font-size: 12px;">${primaryGroup.name === 'GRP_Finance' ? 'Modify' : (primaryGroup.name === 'Administrators' ? 'Full Control' : 'None / Denied')}</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div class="win-dialog-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;">
                        <button class="win-btn win-btn-accent" onclick="window.windowsManager.closeModal('${modalId}'); window.permissionsManager?.quickFillTest('${u.username}', 'Modify');">
                            🧪 Test Access in Security Suite
                        </button>
                        <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${modalId}')">
                            Close
                        </button>
                    </div>
                </div>
            `;
        };

        window.windowsManager.openModal({
            id: modalId,
            title: 'Educational RBAC Summary',
            html: renderContent(currentTargetUser.username)
        });
    }

    // --- DISK MANAGEMENT VIEW ---
    renderDiskManagement(mainEl, actionEl) {
        const state = window.systemState.getState();
        mainEl.innerHTML = `
            <div class="disk-mgmt-view" style="padding: 15px;">
                <h3 style="margin-bottom: 10px;">Volume Summary</h3>
                <table class="win-table" style="margin-bottom: 20px;">
                    <thead>
                        <tr>
                            <th>Volume</th>
                            <th>Layout</th>
                            <th>Type</th>
                            <th>File System</th>
                            <th>Status</th>
                            <th>Capacity</th>
                            <th>Free Space</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td><b>(C:)</b></td>
                            <td>Simple</td>
                            <td>Basic</td>
                            <td>NTFS</td>
                            <td>Healthy (Boot, Page File, Crash Dump, Primary Partition)</td>
                            <td>${state.vm.storage}.00 GB</td>
                            <td>38.25 GB</td>
                        </tr>
                    </tbody>
                </table>

                <h3 style="margin-bottom: 10px;">Disk Graphical Layout</h3>
                <div class="disk-graphical-box">
                    <div class="disk-header-cell">
                        <b>Disk 0</b><br>
                        Basic<br>
                        ${state.vm.storage}.00 GB<br>
                        Online
                    </div>
                    <div class="disk-partition-cell">
                        <b>(C:)</b><br>
                        ${state.vm.storage}.00 GB NTFS<br>
                        Healthy (Boot, Page File, Primary Partition)
                    </div>
                </div>
            </div>
        `;

        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Disk Management</div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()"><span class="link-icon">🔄</span> Rescan Disks</div>
                <div class="action-link"><span class="link-icon">Properties</span> Properties</div>
            </div>
        `;
    }

    // --- ORGANIZATIONAL ROLES MANAGER (RBAC & DEMO 8) ---
    renderRolesManager(clientEl, winId) {
        const state = window.systemState.getState();
        const selectedUser = this.selectedRbacUser || 'jdoe';
        const userRole = state.roles.find(r => r.assignedUser && r.assignedUser.toLowerCase() === selectedUser.toLowerCase());
        const userObj = state.users.find(u => u.username.toLowerCase() === selectedUser.toLowerCase());

        // Gather all users for selection (ensure jdoe is always present for classroom presentation)
        const allUsers = [...state.users.map(u => u.username)];
        if (!allUsers.some(u => u.toLowerCase() === 'jdoe')) {
            allUsers.unshift('jdoe');
        }

        const userOptionsHtml = allUsers.map(uname => {
            const uObj = state.users.find(u => u.username.toLowerCase() === uname.toLowerCase());
            const label = uObj ? `${uname} (${uObj.fullName || 'User'})` : `${uname} (Demo User)`;
            const isSel = uname.toLowerCase() === selectedUser.toLowerCase();
            return `<option value="${uname}" ${isSel ? 'selected' : ''}>${label}</option>`;
        }).join('');

        // Find catalog match for current user role if any
        const catalogForUserRole = userRole ? ROLE_CATALOG.find(c => c.roleName.toLowerCase() === userRole.roleName.toLowerCase()) : null;

        // Visual relationship flow HTML
        let visualFlowHtml = '';
        if (userRole) {
            const catalogRole = catalogForUserRole || {
                roleName: userRole.roleName,
                description: userRole.description || "Organizational Business Role",
                securityGroup: userRole.securityGroup,
                resource: userRole.resource,
                resourceDisplay: userRole.resource === 'C:\\FinanceData' ? 'Finance Resources (C:\\FinanceData)' : userRole.resource,
                permissions: userRole.permissions,
                icon: '📊'
            };
            const resourceDisplay = catalogRole.resourceDisplay || (userRole.resource === 'C:\\FinanceData' ? 'Finance Resources (C:\\FinanceData)' : userRole.resource);

            visualFlowHtml = `
                <div class="rbac-visual-flow-container">
                    <div class="flow-header">
                        <span class="flow-title">Visual Relationship Chain (Active Access Path)</span>
                        <span class="flow-badge active">✓ Active Role Chain</span>
                    </div>

                    <div class="rbac-visual-flow">
                        <!-- Node 1: User -->
                        <div class="flow-node flow-node-user">
                            <div class="node-type">1. User Account (Principal)</div>
                            <div class="node-title">👤 ${selectedUser}</div>
                            <div class="node-meta">${userObj?.fullName || 'John Doe'} — Authenticated Identity</div>
                        </div>

                        <!-- Arrow 1 -->
                        <div class="flow-arrow">
                            <div class="flow-arrow-line"></div>
                            <div class="flow-arrow-badge">assigned to role</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 2: Role -->
                        <div class="flow-node flow-node-role">
                            <div class="node-type">2. Organizational Role</div>
                            <div class="node-title">${catalogRole.icon} ${userRole.roleName}</div>
                            <div class="node-meta">${catalogRole.description}</div>
                        </div>

                        <!-- Arrow 2 -->
                        <div class="flow-arrow">
                            <div class="flow-arrow-line"></div>
                            <div class="flow-arrow-badge">maps to security group</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 3: Group -->
                        <div class="flow-node flow-node-group">
                            <div class="node-type">3. Windows Security Group</div>
                            <div class="node-title">👥 ${userRole.securityGroup}</div>
                            <div class="node-meta">Active Directory / Local Security Container</div>
                        </div>

                        <!-- Arrow 3 -->
                        <div class="flow-arrow">
                            <div class="flow-arrow-line"></div>
                            <div class="flow-arrow-badge">grants NTFS permissions on</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 4: Resource -->
                        <div class="flow-node flow-node-resource">
                            <div class="node-type">4. Target Resource & NTFS Rights</div>
                            <div class="node-title">📁 ${resourceDisplay}</div>
                            <div class="node-meta">NTFS Permissions: <b>${userRole.permissions}</b> (Read, Write, Execute, Delete)</div>
                        </div>
                    </div>

                    <!-- Educational Insight Callout -->
                    <div class="rbac-edu-callout">
                        <div class="edu-callout-icon">💡</div>
                        <div class="edu-callout-text">
                            <b>Educational Concept: User → Role → Group → Permissions</b><br/>
                            <code>${selectedUser}</code> ➔ <code>${userRole.roleName}</code> ➔ <code>${userRole.securityGroup}</code> ➔ <code>${resourceDisplay}</code><br/>
                            <span style="font-size: 11px; color: #555;">
                                This visually explains why users are never granted direct ACL access. Instead, users are assigned business roles mapped to security groups, which receive discretionary access permissions on system resources.
                            </span>
                        </div>
                        <div class="edu-callout-actions">
                            <button class="win-btn win-btn-sm win-btn-default" onclick="window.usersManager.openTestRoleAccess('${selectedUser}', '${userRole.resource}', '${userRole.permissions}')">🧪 Test Access</button>
                        </div>
                    </div>
                </div>
            `;
        } else {
            visualFlowHtml = `
                <div class="rbac-visual-flow-container">
                    <div class="flow-header">
                        <span class="flow-title">Visual Relationship Chain (Access Path)</span>
                        <span class="flow-badge inactive">Current Role: None</span>
                    </div>

                    <div class="rbac-visual-flow">
                        <!-- Node 1: User -->
                        <div class="flow-node flow-node-user">
                            <div class="node-type">1. User Account (Principal)</div>
                            <div class="node-title">👤 ${selectedUser}</div>
                            <div class="node-meta">${userObj?.fullName || 'John Doe'} — Authenticated Identity</div>
                        </div>

                        <!-- Arrow 1 -->
                        <div class="flow-arrow empty-arrow">
                            <div class="flow-arrow-line dashed"></div>
                            <div class="flow-arrow-badge">no role assigned</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 2: Role (None) -->
                        <div class="flow-node flow-node-empty">
                            <div class="node-type">2. Organizational Role</div>
                            <div class="node-title">None</div>
                            <div class="node-meta">No organizational role is currently assigned to ${selectedUser}</div>
                        </div>

                        <!-- Arrow 2 -->
                        <div class="flow-arrow empty-arrow">
                            <div class="flow-arrow-line dashed"></div>
                            <div class="flow-arrow-badge">no group mapping</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 3: Group (None) -->
                        <div class="flow-node flow-node-empty">
                            <div class="node-type">3. Windows Security Group</div>
                            <div class="node-title">None</div>
                            <div class="node-meta">User does not inherit departmental security group memberships</div>
                        </div>

                        <!-- Arrow 3 -->
                        <div class="flow-arrow empty-arrow">
                            <div class="flow-arrow-line dashed"></div>
                            <div class="flow-arrow-badge">no resource permissions</div>
                            <div class="flow-arrow-glyph">↓</div>
                        </div>

                        <!-- Node 4: Resource (None) -->
                        <div class="flow-node flow-node-empty">
                            <div class="node-type">4. Target Resource & NTFS Rights</div>
                            <div class="node-title">No Access</div>
                            <div class="node-meta">No authorized access to departmental folders</div>
                        </div>
                    </div>

                    <div class="rbac-edu-callout guide">
                        <div class="edu-callout-icon">👉</div>
                        <div class="edu-callout-text">
                            <b>DEMO 8 — ASSIGN ROLE:</b><br/>
                            1. Confirm <b>${selectedUser}</b> is selected.<br/>
                            2. Notice <b>Current Role: None</b>.<br/>
                            3. In the dropdown, select <b>Financial Analyst</b> and click <b>Assign Role</b>.<br/>
                            <span style="font-size: 11px; color: #555;">
                                This will establish the relationship: <code>${selectedUser}</code> ↓ <code>Financial Analyst</code> ↓ <code>GRP_Finance</code> ↓ <code>Finance Resources</code>.
                            </span>
                        </div>
                    </div>
                </div>
            `;
        }

        clientEl.innerHTML = `
            <div class="roles-manager-wrapper">
                <!-- Educational Header Banner -->
                <div class="rbac-header-banner">
                    <h3><span>👥</span> Role-Based Access Control (RBAC) & Educational Simulator</h3>
                    <p>
                        Demonstrates modern access governance in Windows Server. Users authenticate as principals, are assigned business job roles, roles map to Active Directory / Local Security Groups, and groups are granted NTFS permissions on target resources.
                    </p>
                </div>

                <!-- 1. Standard Role Catalog Table -->
                <div style="background: #ffffff; border: 1px solid #d2d0ce; border-radius: 4px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div class="rbac-section-title">
                        <span><b>Standard Organizational Role Catalog</b></span>
                        <span style="font-size: 11px; color: #666; font-weight: normal;">4 Pre-defined Enterprise Roles</span>
                    </div>
                    <table class="rbac-catalog-table">
                        <thead>
                            <tr>
                                <th style="width: 25%;">Role</th>
                                <th style="width: 32%;">Description</th>
                                <th style="width: 18%;">Mapped Security Group</th>
                                <th style="width: 15%;">Target Resource</th>
                                <th style="width: 10%;">Permissions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${ROLE_CATALOG.map(c => `
                                <tr>
                                    <td><b>${c.icon} ${c.roleName}</b></td>
                                    <td style="color: #444;">${c.description}</td>
                                    <td><span class="group-pill">👥 ${c.securityGroup}</span></td>
                                    <td><code>${c.resourceDisplay}</code></td>
                                    <td><span class="perm-badge ${c.permissions === 'Full Control' ? 'full' : (c.permissions === 'Modify' ? 'modify' : 'read')}">${c.permissions}</span></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- 2. Interactive Role Assignment Card (DEMO 8) -->
                <div class="rbac-assign-card">
                    <div class="rbac-section-title" style="margin-bottom: 4px;">
                        <span><b>Assign Role (Interactive DEMO 8)</b></span>
                        <span style="font-size: 11px; color: #0078d4; font-weight: normal;">Select user ➔ review Current Role ➔ assign role ➔ inspect visual chain</span>
                    </div>

                    <div class="rbac-assign-grid">
                        <!-- User Selector -->
                        <div class="rbac-field-group">
                            <label for="rbac-user-select">Select User:</label>
                            <select id="rbac-user-select" class="win-select" onchange="window.usersManager.selectRbacUser(this.value, '${winId}')">
                                ${userOptionsHtml}
                            </select>
                        </div>

                        <!-- Current Role Display -->
                        <div class="rbac-field-group">
                            <label>Current Role:</label>
                            <div style="display: flex; align-items: center; gap: 8px; min-height: 28px;">
                                ${userRole ? `
                                    <span class="current-role-badge assigned">
                                        <span>${catalogForUserRole?.icon || '📊'}</span>
                                        <b>${userRole.roleName}</b>
                                    </span>
                                    <button class="win-btn win-btn-sm" onclick="window.usersManager.clearRbacRole('${selectedUser}', '${winId}')" title="Reset role to None for demonstration">🔄 Reset to None</button>
                                ` : `
                                    <span class="current-role-badge none">None</span>
                                `}
                            </div>
                        </div>

                        <!-- Role to Assign Dropdown -->
                        <div class="rbac-field-group">
                            <label for="rbac-role-select">Dropdown (Role to Assign):</label>
                            <select id="rbac-role-select" class="win-select">
                                ${ROLE_CATALOG.map(c => `
                                    <option value="${c.roleName}" ${(!userRole && c.roleName === 'Financial Analyst') || (userRole && userRole.roleName === c.roleName) ? 'selected' : ''}>
                                        ${c.icon} ${c.roleName} (${c.description})
                                    </option>
                                `).join('')}
                            </select>
                        </div>

                        <!-- Action Button -->
                        <div class="rbac-field-group" style="justify-content: flex-end;">
                            <label style="visibility: hidden;">Action:</label>
                            <button class="win-btn win-btn-default" style="font-weight: 600; padding: 6px 16px;" onclick="window.usersManager.assignSelectedRbacRole('${winId}')">
                                Assign Role
                            </button>
                        </div>
                    </div>
                </div>

                <!-- 3. Educational Visual Relationship Flow Diagram -->
                ${visualFlowHtml}

                <!-- 4. Configured Roles Table & Audit -->
                <div style="background: #ffffff; border: 1px solid #d2d0ce; border-radius: 4px; padding: 12px 14px; box-shadow: 0 1px 3px rgba(0,0,0,0.04);">
                    <div class="rbac-section-title">
                        <span><b>Configured System Roles (${state.roles.length})</b></span>
                        <button class="win-btn win-btn-sm" onclick="window.usersManager.openAssignRoleDialog()">➕ Map Custom Role</button>
                    </div>

                    <table class="win-table" id="roles-table">
                        <thead>
                            <tr>
                                <th>Role Title</th>
                                <th>Assigned User</th>
                                <th>Windows Security Group</th>
                                <th>Target Resource</th>
                                <th>Assigned Rights</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${state.roles.length === 0 ? `
                                <tr><td colspan="6" style="text-align: center; color: #888; padding: 20px;">No organizational roles mapped yet. Use the assignment panel above or click 'Map Custom Role'.</td></tr>
                            ` : state.roles.map(r => `
                                <tr>
                                    <td><b>${r.roleName}</b></td>
                                    <td><span class="user-pill">👤 ${r.assignedUser}</span></td>
                                    <td><span class="group-pill">👥 ${r.securityGroup}</span></td>
                                    <td><code>${r.resource}</code></td>
                                    <td><span class="perm-badge ${r.permissions === 'Modify' ? 'modify' : (r.permissions === 'Full Control' ? 'full' : 'deny')}">${r.permissions}</span></td>
                                    <td>
                                        <button class="win-btn win-btn-sm" onclick="window.usersManager.openTestRoleAccess('${r.assignedUser}', '${r.resource}', '${r.permissions}')">Test</button>
                                        <button class="win-btn win-btn-sm" onclick="window.systemState.removeRole('${r.id}')">Remove</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    selectRbacUser(username, winId) {
        this.selectedRbacUser = username;
        const clientEl = document.getElementById(`client_${winId}`);
        if (clientEl) {
            this.renderRolesManager(clientEl, winId);
        } else {
            this.refreshRolesManager();
        }
    }

    assignSelectedRbacRole(winId) {
        const userSelect = document.getElementById('rbac-user-select');
        const roleSelect = document.getElementById('rbac-role-select');
        const username = userSelect?.value || this.selectedRbacUser || 'jdoe';
        const roleName = roleSelect?.value || 'Financial Analyst';

        this.assignCatalogRole(username, roleName, winId);
    }

    assignCatalogRole(username, roleName, winId) {
        const catalogRole = ROLE_CATALOG.find(r => r.roleName.toLowerCase() === roleName.toLowerCase()) || {
            roleName,
            description: "Custom Organizational Role",
            securityGroup: "GRP_Finance",
            resource: "C:\\FinanceData",
            resourceDisplay: "Finance Resources (C:\\FinanceData)",
            permissions: "Modify",
            icon: "📊"
        };

        if (!user) {
            window.windowsManager.showMsgBox({
                title: "Organizational Roles (RBAC)",
                message: `User '${username}' does not exist in the SAM database.\n\nPlease create the user account in Computer Management before mapping this organizational role.`,
                icon: "warning"
            });
            return;
        }

        // Assign the role
        window.systemState.assignRole({
            roleName: catalogRole.roleName,
            assignedUser: username,
            securityGroup: catalogRole.securityGroup,
            resource: catalogRole.resource,
            permissions: catalogRole.permissions,
            description: catalogRole.description
        });

        this.selectedRbacUser = username;
        this.refreshRolesManager();
    }

    clearRbacRole(username, winId) {
        if (window.systemState.unassignUserRole) {
            window.systemState.unassignUserRole(username);
        } else {
            const state = window.systemState.getState();
            const roles = state.roles.filter(r => r.assignedUser && r.assignedUser.toLowerCase() === username.toLowerCase());
            roles.forEach(r => window.systemState.removeRole(r.id));
        }
        this.selectedRbacUser = username;
        this.refreshRolesManager();
    }

    openAssignRoleDialog() {
        const state = window.systemState.getState();
        const html = `
            <div class="win-dialog" style="width: 500px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Assign Organizational Role</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('modal-assign-role')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <div class="win-form-row">
                        <label>Role Title:</label>
                        <input type="text" id="role-title" class="win-input" value="Financial Analyst" />
                    </div>
                    <div class="win-form-row">
                        <label>Assigned User:</label>
                        <select id="role-user" class="win-select">
                            ${state.users.map(u => `<option value="${u.username}" ${u.username === 'jdoe' ? 'selected' : ''}>${u.username} (${u.fullName || 'User'})</option>`).join('')}
                        </select>
                    </div>
                    <div class="win-form-row">
                        <label>Security Group:</label>
                        <select id="role-group" class="win-select">
                            ${state.groups.map(g => `<option value="${g.name}" ${g.name === 'GRP_Finance' ? 'selected' : ''}>${g.name}</option>`).join('')}
                        </select>
                    </div>
                    <div class="win-form-row">
                        <label>Target Resource:</label>
                        <input type="text" id="role-resource" class="win-input" value="C:\\FinanceData" />
                    </div>
                    <div class="win-form-row">
                        <label>Permissions:</label>
                        <select id="role-perm" class="win-select">
                            <option value="Modify" selected>Modify (Read, Write, Execute, Delete)</option>
                            <option value="Full Control">Full Control</option>
                            <option value="Read">Read Only</option>
                            <option value="Deny">Deny</option>
                        </select>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.usersManager.submitAssignRole()">Assign Role</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('modal-assign-role')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: 'modal-assign-role',
            title: 'Assign Organizational Role',
            html
        });
    }

    submitAssignRole() {
        const roleName = document.getElementById('role-title')?.value.trim();
        const assignedUser = document.getElementById('role-user')?.value;
        const securityGroup = document.getElementById('role-group')?.value;
        const resource = document.getElementById('role-resource')?.value.trim();
        const permissions = document.getElementById('role-perm')?.value;

        if (!roleName) return;

        window.systemState.assignRole({
            roleName,
            assignedUser,
            securityGroup,
            resource,
            permissions
        });

        window.windowsManager.closeModal('modal-assign-role');
    }

    openTestRoleAccess(username, resource, requiredAction) {
        window.windowsManager.openApp('security-test');
        setTimeout(() => {
            const userIn = document.getElementById('st-username');
            const resIn = document.getElementById('st-resource');
            const actIn = document.getElementById('st-action');
            if (userIn) userIn.value = username;
            if (resIn) resIn.value = resource;
            if (actIn) actIn.value = requiredAction.includes('Modify') ? 'Modify' : (requiredAction.includes('Full') ? 'FullControl' : 'Read');
            document.getElementById('st-btn-test')?.click();
        }, 150);
    }

    refreshRolesManager() {
        if (!window.windowsManager) return;
        for (const [winId, win] of window.windowsManager.openWindows) {
            if (win.appType === 'roles-manager') {
                const clientEl = document.getElementById(`client_${winId}`);
                if (clientEl) this.renderRolesManager(clientEl, winId);
            }
        }
    }

    closeModal() {
        window.windowsManager.closeAllModals();
    }
}

// Global Role Catalog Definition
const ROLE_CATALOG = [
    {
        roleName: "Systems Administrator",
        description: "Full system administration",
        securityGroup: "Administrators",
        resource: "C:\\",
        resourceDisplay: "C:\\ (Full System)",
        permissions: "Full Control",
        icon: "🛡️"
    },
    {
        roleName: "Financial Analyst",
        description: "Access to financial resources",
        securityGroup: "GRP_Finance",
        resource: "C:\\FinanceData",
        resourceDisplay: "Finance Resources (C:\\FinanceData)",
        permissions: "Modify",
        icon: "📊"
    },
    {
        roleName: "Marketing Specialist",
        description: "Access to marketing resources",
        securityGroup: "GRP_Marketing",
        resource: "C:\\MarketingData",
        resourceDisplay: "Marketing Resources (C:\\MarketingData)",
        permissions: "Read & Execute",
        icon: "📢"
    },
    {
        roleName: "Guest",
        description: "Limited access",
        securityGroup: "Guests",
        resource: "Public Resources",
        resourceDisplay: "Public Resources",
        permissions: "Read Only",
        icon: "👤"
    }
];

window.usersManager = new UsersManager();
