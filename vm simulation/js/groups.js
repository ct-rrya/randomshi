/**
 * System Administration Simulator - Groups Management
 * Controls the Groups snap-in within Computer Management (compmgmt.msc),
 * Group creation, Group Properties, Member Add/Remove, and Deletion.
 */

class GroupsManager {
    constructor() {
        this.selectedGroup = null;
        this.selectedMemberInList = null;
        this.newGroupMembersTemp = [];
        this.selectedNewMember = null;
        this.init();
    }

    init() {
        // State updates are handled through state subscriptions
    }

    // --- RENDER GROUPS LIST IN MMC ---
    renderGroupsList(mainEl, actionEl) {
        const groups = window.systemState.getState().groups;

        mainEl.innerHTML = `
            <div class="mmc-list-table-container" oncontextmenu="window.groupsManager.showGroupsEmptyContextMenu(event)">
                <table class="win-table mmc-table" id="groups-table">
                    <thead>
                        <tr>
                            <th style="width: 180px;">Name</th>
                            <th>Description</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${groups.map(g => `
                            <tr class="group-row" 
                                onclick="window.groupsManager.selectGroupRow('${g.name}', this)" 
                                ondblclick="window.groupsManager.openGroupProperties('${g.name}')"
                                oncontextmenu="window.groupsManager.showGroupContextMenu(event, '${g.name}')">
                                <td>
                                    <span class="group-icon-badge">👥</span>
                                    <b>${g.name}</b>
                                </td>
                                <td>${g.description || ''}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;

        actionEl.innerHTML = `
            <div class="mmc-actions-box">
                <div class="action-header">Groups</div>
                <div class="action-link" onclick="window.groupsManager.openNewGroupDialog()">
                    <span class="link-icon">👥➕</span> New Group...
                </div>
                <div class="action-link" onclick="window.usersManager.refreshActiveMmcView()">
                    <span class="link-icon">🔄</span> Refresh
                </div>
                <div class="action-divider"></div>
                <div class="action-header">Selected Group</div>
                <div id="group-selected-actions">
                    <small style="color: #666; padding: 4px 10px; display: block;">Select a group to view actions</small>
                </div>
            </div>
        `;
    }

    selectGroupRow(groupName, rowEl) {
        this.selectedGroup = groupName;
        document.querySelectorAll('#groups-table tbody tr').forEach(r => r.classList.remove('selected'));
        if (rowEl) rowEl.classList.add('selected');

        const group = window.systemState.getState().groups.find(g => g.name === groupName);
        const actionsContainer = document.getElementById('group-selected-actions');
        if (!actionsContainer || !group) return;

        actionsContainer.innerHTML = `
            <div class="action-link" onclick="window.groupsManager.openGroupProperties('${groupName}')">
                <span class="link-icon">⚙️</span> Properties
            </div>
            <div class="action-link" onclick="window.groupsManager.openAddMemberPicker('${groupName}')">
                <span class="link-icon">👤➕</span> Add to Group...
            </div>
            ${!group.builtIn ? `
                <div class="action-link" onclick="window.groupsManager.promptDeleteGroup('${groupName}')">
                    <span class="link-icon">🗑️</span> Delete
                </div>
            ` : ''}
        `;
    }

    // --- CONTEXT MENUS ---
    showGroupsEmptyContextMenu(e) {
        e.preventDefault();
        e.stopPropagation();
        window.usersManager.removeContextMenu();

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        menu.innerHTML = `
            <div class="menu-item bold" onclick="window.groupsManager.openNewGroupDialog(); window.usersManager.removeContextMenu();">
                New Group...
            </div>
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="window.usersManager.refreshActiveMmcView(); window.usersManager.removeContextMenu();">
                Refresh
            </div>
        `;

        document.body.appendChild(menu);
        window.usersManager.bindDismissContextMenu(menu);
    }

    showGroupContextMenu(e, groupName) {
        e.preventDefault();
        e.stopPropagation();
        window.usersManager.removeContextMenu();
        this.selectedGroup = groupName;

        const group = window.systemState.getState().groups.find(g => g.name === groupName);
        if (!group) return;

        const menu = document.createElement('div');
        menu.className = 'win-context-menu';
        menu.style.top = `${e.clientY}px`;
        menu.style.left = `${e.clientX}px`;

        menu.innerHTML = `
            <div class="menu-item bold" onclick="window.groupsManager.openGroupProperties('${groupName}'); window.usersManager.removeContextMenu();">
                Properties
            </div>
            <div class="menu-item" onclick="window.groupsManager.openAddMemberPicker('${groupName}'); window.usersManager.removeContextMenu();">
                Add to Group...
            </div>
            ${!group.builtIn ? `
                <div class="menu-separator"></div>
                <div class="menu-item" onclick="window.groupsManager.promptDeleteGroup('${groupName}'); window.usersManager.removeContextMenu();">
                    Delete
                </div>
            ` : ''}
            <div class="menu-separator"></div>
            <div class="menu-item" onclick="window.windowsManager.showMsgBox({ title: 'Help', message: 'Help on managing security groups.', icon: 'info' }); window.usersManager.removeContextMenu();">
                Help
            </div>
        `;

        document.body.appendChild(menu);
        window.usersManager.bindDismissContextMenu(menu);
    }

    // --- NEW GROUP DIALOG ---
    openNewGroupDialog() {
        if (window.windowsManager.openModals.has('modal-new-group')) {
            window.windowsManager.closeModal('modal-new-group');
        }

        this.newGroupMembersTemp = [];
        this.selectedNewMember = null;
        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');

        const html = `
            <div class="win-dialog new-group-dialog" style="width: 440px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">New Group</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('modal-new-group')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <div class="win-form-row">
                        <label for="ng-groupname">Group name:</label>
                        <input type="text" id="ng-groupname" class="win-input" value="GRP_Finance" autocomplete="off" />
                    </div>
                    <div class="win-form-row">
                        <label for="ng-description">Description:</label>
                        <input type="text" id="ng-description" class="win-input" value="Finance Department Security Group" autocomplete="off" />
                    </div>

                    <div class="win-dialog-groupbox" style="margin-top: 15px;">
                        <div class="groupbox-title">Members:</div>
                        <div class="groupbox-content">
                            <div class="win-listbox" id="ng-members-list" style="height: 120px;">
                                <div style="color: #888; padding: 10px; text-align: center;">No members added yet</div>
                            </div>
                            <div class="win-listbox-actions" style="margin-top: 8px;">
                                <button class="win-btn" onclick="window.groupsManager.openAddMemberPickerToNewGroup()">Add...</button>
                                <button class="win-btn" id="ng-btn-remove" onclick="window.groupsManager.removeMemberFromNewGroup()" disabled>Remove</button>
                            </div>
                        </div>
                    </div>
                    <div id="ng-error-msg" class="win-error-msg" style="display: none; color: #d13438; margin-top: 8px; font-size: 12px;"></div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.groupsManager.submitNewGroup()">Create</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('modal-new-group')">Close</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: 'modal-new-group',
            title: 'New Group',
            parentWinId: compMgmtWinId,
            html
        });
        setTimeout(() => {
            const input = document.getElementById('ng-groupname');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    openAddMemberPickerToNewGroup() {
        const allUsers = window.systemState.getState().users;
        const available = allUsers.filter(u => !this.newGroupMembersTemp.includes(u.username));
        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');

        const html = `
            <div class="win-dialog select-object-dialog" style="width: 500px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Select Users</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${subModalId}')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <p style="margin-bottom: 8px;">Select users to add to the group:</p>
                    <div class="win-listbox" style="height: 150px; margin: 8px 0;">
                        ${available.map(u => `
                            <div class="win-listbox-item" onclick="this.parentElement.querySelectorAll('.win-listbox-item').forEach(i=>i.classList.remove('selected')); this.classList.add('selected'); document.getElementById('sel-user-name').value='${u.username}';">
                                <span class="icon">👤</span> <b>${u.username}</b> (${u.fullName || 'User'})
                            </div>
                        `).join('')}
                    </div>
                    <div class="win-form-row">
                        <label>Enter the object names to select:</label>
                        <input type="text" id="sel-user-name" class="win-input" value="${available[0] ? available[0].username : ''}" autocomplete="off" />
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.groupsManager.confirmAddMemberToNewGroup()">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${subModalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: subModalId,
            title: 'Select Users',
            parentModalId: 'modal-new-group',
            parentWinId: compMgmtWinId,
            html
        });

        setTimeout(() => {
            const input = document.getElementById('sel-user-name');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    confirmAddMemberToNewGroup() {
        const username = document.getElementById('sel-user-name')?.value.trim();
        if (username && !this.newGroupMembersTemp.includes(username)) {
            this.newGroupMembersTemp.push(username);
            this.renderNewGroupMembersList();
        }
        window.windowsManager.closeModal('modal-select-users-new-group');
    }

    renderNewGroupMembersList() {
        const listEl = document.getElementById('ng-members-list');
        if (!listEl) return;

        if (this.newGroupMembersTemp.length === 0) {
            listEl.innerHTML = `<div style="color: #888; padding: 10px; text-align: center;">No members added yet</div>`;
            return;
        }

        listEl.innerHTML = this.newGroupMembersTemp.map(m => {
            const u = window.systemState.getState().users.find(x => x.username.toLowerCase() === m.toLowerCase());
            const label = u && u.fullName ? `${u.fullName} (${m})` : m;
            return `
                <div class="win-listbox-item" onclick="this.parentElement.querySelectorAll('.win-listbox-item').forEach(i=>i.classList.remove('selected')); this.classList.add('selected'); window.groupsManager.selectedNewMember = '${m}'; document.getElementById('ng-btn-remove').disabled = false;">
                    <span class="icon">👤</span> ${label}
                </div>
            `;
        }).join('');
    }

    removeMemberFromNewGroup() {
        if (!this.selectedNewMember) return;
        this.newGroupMembersTemp = this.newGroupMembersTemp.filter(m => m !== this.selectedNewMember);
        this.selectedNewMember = null;
        const btn = document.getElementById('ng-btn-remove');
        if (btn) btn.disabled = true;
        this.renderNewGroupMembersList();
    }

    submitNewGroup() {
        const name = document.getElementById('ng-groupname')?.value.trim();
        const description = document.getElementById('ng-description')?.value.trim();
        const errEl = document.getElementById('ng-error-msg');

        if (!name) {
            this.showDialogError(errEl, "Group name cannot be blank.");
            return;
        }

        const res = window.systemState.createGroup({
            name,
            description,
            members: this.newGroupMembersTemp
        });

        if (!res.success) {
            this.showDialogError(errEl, res.error);
            return;
        window.windowsManager.closeModal('modal-new-group');
    }

    showDialogError(errEl, message) {
        if (!errEl) return;
        errEl.textContent = message;
        errEl.style.display = 'block';
    }

    // --- GROUP PROPERTIES DIALOG ---
    openGroupProperties(groupName) {
        const group = window.systemState.getState().groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (!group) return;

        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');
        const modalId = `modal-group-${group.name}`;

        const html = `
            <div class="win-dialog group-props-dialog">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">${group.name} Properties</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-tab-header">
                    <div class="win-tab-btn active">General</div>
                </div>
                <div class="win-dialog-body">
                    <div class="win-form-row">
                        <label>Group name:</label>
                        <input type="text" class="win-input" value="${group.name}" disabled />
                    </div>
                    <div class="win-form-row">
                        <label>Description:</label>
                        <input type="text" id="gp-desc" class="win-input" value="${group.description || ''}" />
                    </div>

                    <div class="win-dialog-groupbox" style="margin-top: 15px;">
                        <div class="groupbox-title">Members:</div>
                        <div class="groupbox-content">
                            <div class="win-listbox" id="gp-members-list" style="height: 140px;">
                                ${group.members.map(m => {
                                    const u = window.systemState.getState().users.find(x => x.username.toLowerCase() === m.toLowerCase());
                                    const label = u && u.fullName ? `${u.fullName} (${m})` : m;
                                    return `
                                        <div class="win-listbox-item" onclick="window.groupsManager.selectMemberInGroup(this, '${m}')">
                                            <span class="icon">👤</span> ${label}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                            <div class="win-listbox-actions" style="margin-top: 8px;">
                                <button class="win-btn" onclick="window.groupsManager.openAddMemberPicker('${group.name}')">Add...</button>
                                <button class="win-btn" id="gp-btn-remove" onclick="window.groupsManager.removeMemberFromGroup('${group.name}')" disabled>Remove</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.groupsManager.saveGroupProperties('${group.name}')">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: `${group.name} Properties`,
            parentWinId: compMgmtWinId,
            html
        });
    }

    selectMemberInGroup(itemEl, memberUsername) {
        document.querySelectorAll('#gp-members-list .win-listbox-item').forEach(i => i.classList.remove('selected'));
        itemEl.classList.add('selected');
        this.selectedMemberInList = memberUsername;
        const btnRemove = document.getElementById('gp-btn-remove');
        if (btnRemove) btnRemove.disabled = false;
    }

    removeMemberFromGroup(groupName) {
        if (!this.selectedMemberInList) return;
        const res = window.systemState.removeUserFromGroup(this.selectedMemberInList, groupName);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: res.error,
                icon: "warning"
            });
            return;
        }
        this.selectedMemberInList = null;
        this.openGroupProperties(groupName);
    }

    openAddMemberPicker(groupName) {
        const group = window.systemState.getState().groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (!group) return;

        const allUsers = window.systemState.getState().users;
        const availableUsers = allUsers.filter(u => !group.members.some(m => m.toLowerCase() === u.username.toLowerCase()));
        const subModalId = `modal-select-users-${groupName}`;

        const compMgmtWinId = Array.from(window.windowsManager.openWindows.keys()).find(k => window.windowsManager.openWindows.get(k).appType === 'computer-management');

        const html = `
            <div class="win-dialog select-object-dialog" style="width: 500px;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">Select Users</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${subModalId}')">✕</button>
                </div>
                <div class="win-dialog-body">
                    <p style="margin-bottom: 8px;">Select users to add to <b>${group.name}</b>:</p>
                    <div class="win-listbox" style="height: 150px; margin: 8px 0;">
                        ${availableUsers.map(u => `
                            <div class="win-listbox-item" onclick="this.parentElement.querySelectorAll('.win-listbox-item').forEach(i=>i.classList.remove('selected')); this.classList.add('selected'); document.getElementById('sel-picker-user').value='${u.username}';">
                                <span class="icon">👤</span> <b>${u.username}</b> (${u.fullName || 'User'})
                            </div>
                        `).join('')}
                    </div>
                    <div class="win-form-row">
                        <label>Enter the object names to select:</label>
                        <input type="text" id="sel-picker-user" class="win-input" value="${availableUsers[0] ? availableUsers[0].username : ''}" autocomplete="off" />
                    </div>
                </div>
                <div class="win-dialog-footer">
                    <button class="win-btn win-btn-default" onclick="window.groupsManager.confirmAddMember('${group.name}')">OK</button>
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${subModalId}')">Cancel</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: subModalId,
            title: 'Select Users',
            parentModalId: `modal-group-${groupName}`,
            parentWinId: compMgmtWinId,
            html
        });

        setTimeout(() => {
            const input = document.getElementById('sel-picker-user');
            if (input) {
                input.focus();
                input.select();
            }
        }, 50);
    }

    confirmAddMember(groupName) {
        const username = document.getElementById('sel-picker-user')?.value.trim();
        if (!username) return;

        const subModalId = `modal-select-users-${groupName}`;
        const res = window.systemState.addUserToGroup(username, groupName);
        window.windowsManager.closeModal(subModalId);

        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: res.error,
                icon: "warning"
            });
            return;
        }

        this.openGroupProperties(groupName);
    }

    saveGroupProperties(groupName) {
        const desc = document.getElementById('gp-desc')?.value.trim();
        const group = window.systemState.getState().groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (group && desc !== undefined) {
            group.description = desc;
            window.systemState.notify('groups');
        }
        window.windowsManager.closeModal(`modal-group-${groupName}`);
    }

    // --- DELETE GROUP ---
    promptDeleteGroup(groupName) {
        const group = window.systemState.getState().groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (!group) return;

        if (group.builtIn) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: `Cannot delete built-in group '${groupName}'.`,
                icon: "error"
            });
            return;
        }

        window.windowsManager.showConfirmBox({
            title: "Local Users and Groups",
            message: `Are you sure you want to delete the group "${groupName}"?\n\nDeleting a group does not delete the users that belong to it. However, the group will be permanently removed from all access control lists.`,
            onYes: () => this.executeDeleteGroup(groupName)
        });
    }

    executeDeleteGroup(groupName) {
        const res = window.systemState.deleteGroup(groupName);
        if (!res.success) {
            window.windowsManager.showMsgBox({
                title: "Local Users and Groups",
                message: res.error,
                icon: "warning"
            });
        }
    }

    closeModal() {
        window.windowsManager.closeAllModals();
    }
}

window.groupsManager = new GroupsManager();
