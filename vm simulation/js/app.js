/**
 * System Administration Simulator - App Orchestrator & CLI (CMD / PowerShell)
 * Controls application lifecycle, Presentation Mode toolbar,
 * Interactive Demonstration Workflow Guide, and simulated Command Prompt / PowerShell consoles.
 */

class AppMain {
    constructor() {
        this.cmdHistory = [];
        this.cmdHistoryIndex = 0;
        this.psHistory = [];
        this.psHistoryIndex = 0;
        this.isGuideOpen = false;

        this.init();
    }

    init() {
        window.addEventListener('DOMContentLoaded', () => {
            this.bindTopControls();
            this.renderScenarioTracker();
            this.restoreSession();
        });

        window.systemState.subscribe((state, changeKey) => {
            if (changeKey === 'scenario' || changeKey === 'all') {
                this.renderScenarioTracker();
            }
        });
    }

    restoreSession() {
        const state = window.systemState.getState();
        if (!state || !state.vm) return;

        // If VM is running, resume the running session immediately
        if (state.vm.status === 'running') {
            const vmWindowEl = document.getElementById('vm-running-window');
            if (vmWindowEl) {
                vmWindowEl.style.display = 'flex';
                vmWindowEl.classList.remove('minimized');
            }
            const titleEl = document.getElementById('vm-win-title-text');
            if (titleEl) {
                titleEl.textContent = `${state.vm.name} [Running] - Oracle VM VirtualBox`;
            }

            if (state.vm.installed) {
                window.windowsManager.renderDesktop();
            } else {
                const stage = state.setupStage || 1;
                if (stage > 1 && stage <= 8) {
                    window.windowsManager.renderWindowsSetup();
                    window.windowsManager.setupStepNext(stage);
                } else {
                    window.windowsManager.runBootSequence();
                }
            }
        }
    }

    bindTopControls() {
        const wrapper = document.getElementById('sim-tools-dropdown-wrapper');
        const trigger = document.getElementById('sim-tools-trigger');

        const closeDropdown = () => {
            if (wrapper && wrapper.classList.contains('open')) {
                wrapper.classList.remove('open');
                trigger?.setAttribute('aria-expanded', 'false');
            }
        };

        const toggleDropdown = (e) => {
            e.stopPropagation();
            if (wrapper) {
                const isOpen = wrapper.classList.toggle('open');
                trigger?.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            }
        };

        trigger?.addEventListener('click', toggleDropdown);

        // Click outside closes dropdown
        document.addEventListener('click', (e) => {
            if (wrapper && !wrapper.contains(e.target)) {
                closeDropdown();
            }
        });

        // Pressing Escape closes dropdown
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeDropdown();
            }
        });

        // Helper to run action and close dropdown
        const runAction = (fn) => {
            closeDropdown();
            fn();
        };

        // Status indicator click: switch back to sandbox if currently in demo mode
        document.getElementById('sim-mode-badge')?.addEventListener('click', () => {
            const state = window.systemState?.getState();
            if (state && state.simulationMode !== 'sandbox') {
                this.switchToSandboxMode();
            }
        });

        document.getElementById('sim-btn-sandbox')?.addEventListener('click', () => runAction(() => this.switchToSandboxMode()));
        document.getElementById('sim-btn-demo-load')?.addEventListener('click', () => runAction(() => this.promptLoadDemo()));
        document.getElementById('sim-btn-hint')?.addEventListener('click', () => runAction(() => this.showSystemHint()));
        document.getElementById('sim-btn-reset')?.addEventListener('click', () => runAction(() => this.promptReset()));
        document.getElementById('sim-btn-clear-audit')?.addEventListener('click', () => runAction(() => this.promptClearAudit()));
        document.getElementById('sim-btn-view-audit')?.addEventListener('click', () => runAction(() => this.openActivityLogModal()));
        document.getElementById('sim-btn-role-summary')?.addEventListener('click', () => runAction(() => window.usersManager.openEducationalRoleSummary('jdoe')));
        document.getElementById('sim-btn-guide')?.addEventListener('click', () => runAction(() => this.toggleGuideModal()));
    }

    switchToSandboxMode() {
        window.systemState.setSimulationMode('sandbox');
        const state = window.systemState.getState();
        if (state.vm && state.vm.installed && state.vm.status === 'running') {
            window.windowsManager.renderDesktop();
        }
        this.renderScenarioTracker();
        window.windowsManager.showMsgBox({
            title: "Sandbox Mode Activated",
            message: "Interactive Sandbox Mode is now active.\n\nYou have unrestricted administrative control. You can create, modify, or delete users, groups, folders, and permissions in any order.\n\nNo rigid sequences will constrain your actions.",
            icon: "info"
        });
    }

    showSystemHint() {
        const state = window.systemState.getState();
        const modalId = `modal-sys-hint-${Date.now()}`;
        
        let hints = [];
        if (!state.vm.exists) {
            hints.push({
                icon: "🖥️",
                title: "Virtual Machine Setup",
                desc: "No VM is created yet. In VirtualBox Manager, click 'New' to configure a new virtual machine (e.g. WinServer2022) with RAM, CPU, and virtual hard disk."
            });
        } else if (state.vm.status !== 'running') {
            hints.push({
                icon: "⚡",
                title: "Power On Machine",
                desc: "The VM exists but is currently powered off. Select the VM and click 'Start' in VirtualBox to power on and boot the server."
            });
        } else if (!state.vm.installed) {
            hints.push({
                icon: "💿",
                title: "Operating System Installation",
                desc: "Windows Server 2022 setup is running. Progress through the installation wizard to format Drive 0 and configure the local Administrator password."
            });
        } else {
            // Running VM with installed OS
            hints.push({
                icon: "👥",
                title: "User & Security Group Best Practices (AGDLP)",
                desc: "Windows administration standard practice is to assign NTFS permissions to Security Groups rather than individual accounts. Manage accounts in Computer Management (lusrmgr.msc) or CLI."
            });

            hints.push({
                icon: "📁",
                title: "NTFS Folder Permissions (DACL)",
                desc: "Open File Explorer (explorer.exe) to browse C:\\, create folders (e.g., C:\\FinanceData), and right-click -> Properties -> Security to manage Access Control Entries."
            });

            hints.push({
                icon: "🔍",
                title: "Access Verification (SecurityTest.exe)",
                desc: "Open Security Access Test from the desktop to test whether an account can access a resource. The test dynamically checks authentication, account status, group resolution, and DACL rules."
            });

            const hasDisabledUsers = (state.users || []).some(u => u.disabled);
            if (hasDisabledUsers) {
                hints.push({
                    icon: "🛑",
                    title: "Account Lifecycle Note",
                    desc: "Disabled user accounts fail logon authentication (STATUS_ACCOUNT_DISABLED) regardless of what folder permissions exist."
                });
            }

            hints.push({
                icon: "📜",
                title: "Auditing & Security Log",
                desc: "Open Event Viewer (eventvwr.msc) or click 'Security Log' to inspect security audit events (Event 4720: User Created, 4728: Member Added, 4730: Group Deleted, 4663: Object Access)."
            });
        }

        const html = `
            <div class="win-dialog" style="width: 620px; max-height: 80vh; display: flex; flex-direction: column;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">💡 System Administrator Guidance (Optional)</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-dialog-body" style="padding: 16px; overflow-y: auto; flex: 1;">
                    <div style="background: #eef7ff; border: 1px solid #cce4f7; padding: 10px 14px; border-radius: 4px; margin-bottom: 14px; font-size: 12px; color: #1e3a8a;">
                        <b>Interactive Sandbox:</b> You are free to explore and perform administrative tasks in any order you choose. The simulator reacts to the real server state.
                    </div>
                    <div style="display: flex; flex-direction: column; gap: 10px;">
                        ${hints.map(h => `
                            <div style="display: flex; gap: 12px; padding: 10px; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px;">
                                <span style="font-size: 24px;">${h.icon}</span>
                                <div style="flex: 1;">
                                    <div style="font-weight: 600; font-size: 12px; color: #1e293b; margin-bottom: 2px;">${h.title}</div>
                                    <div style="font-size: 12px; color: #475569; line-height: 1.4;">${h.desc}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="win-dialog-footer" style="padding: 10px 16px; display: flex; justify-content: flex-end;">
                    <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${modalId}')">Got it</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: "System Administrator Guidance",
            html
        });
    }

    promptClearAudit() {
        window.windowsManager.showConfirmBox({
            title: "Clear Audit Log",
            message: "Clear simulated administration and security audit log? All security event entries will be cleared, and Event ID 1102 will be recorded.",
            onYes: () => {
                window.systemState.clearAuditLog();
                window.windowsManager.showMsgBox({
                    title: "Security Audit Log",
                    message: "Audit log cleared successfully. Event ID 1102 (The security audit log was cleared) has been logged.",
                    icon: "info"
                });
            }
        });
    }

    openActivityLogModal() {
        const state = window.systemState.getState();
        const logs = state.auditLog || [];
        const hostname = state.server.hostname || 'WIN-SERVER';

        const timelineItems = [
            { time: "13:02", title: "VM created: WinServer2022", desc: "Oracle VM VirtualBox New Machine Wizard completed (4096 MB RAM, 2 vCPUs, 50 GB VDI disk)." },
            { time: "13:05", title: "Windows Server installation started", desc: "Booted from virtual optical drive ISO; custom partitioning on Drive 0." },
            { time: "13:12", title: "Windows Server installation completed", desc: "First boot completed; Administrator password configured." },
            { time: "13:15", title: "User created: jdoe", desc: "Local user created: John Doe (Organizational Role: Financial Analyst)." },
            { time: "13:17", title: "Security group created: GRP_Finance", desc: "Windows Security Group created: GRP_Finance (Finance Department Security Group)." },
            { time: "13:18", title: "jdoe added to GRP_Finance", desc: "User 'John Doe (jdoe)' added as a member of 'GRP_Finance'." },
            { time: "13:22", title: "Permission assigned to C:\\FinanceData", desc: "Security ACL configured on C:\\FinanceData: GRP_Finance granted Modify permissions." },
            { time: "13:24", title: "Access test: jdoe — GRANTED", desc: "jdoe → member of GRP_Finance → GRP_Finance has Modify permission → access granted." },
            { time: "13:25", title: "Access test: mwilson — DENIED", desc: "mwilson → not a member of GRP_Finance → no applicable permission → access denied." },
            { time: "13:27", title: "Account disabled: jdoe", desc: "Account disabled via Computer Management; logon denied ('Account disabled. Logon is not permitted.')." }
        ];

        const modalId = `sim_activity_log_modal_${Date.now()}`;
        const html = `
            <div class="win-dialog" style="width: 720px; max-height: 85vh; display: flex; flex-direction: column; background: #fff; font-family: 'Segoe UI', Tahoma, sans-serif;">
                <div class="win-dialog-titlebar" style="background: #0078d4; color: #fff; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: 600; font-size: 13px;">📜 Simulated Administration & Security Activity Log</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')" style="background: none; border: none; color: #fff; font-size: 14px; cursor: pointer;">✕</button>
                </div>

                <div class="win-tab-header" style="background: #f0f0f0; border-bottom: 1px solid #ccc; display: flex; padding: 0 10px;">
                    <div class="win-tab-btn active" id="act-tab-btn-timeline" onclick="window.appMain.switchActivityTab('${modalId}', 'timeline')" style="padding: 8px 16px; cursor: pointer; border-bottom: 2px solid #0078d4; font-weight: 600; font-size: 12px;">Demonstration Narrative Log (Section 20)</div>
                    <div class="win-tab-btn" id="act-tab-btn-audit" onclick="window.appMain.switchActivityTab('${modalId}', 'audit')" style="padding: 8px 16px; cursor: pointer; font-size: 12px; color: #555;">Windows Security Audit Trail (${logs.length} Events)</div>
                </div>

                <div class="win-dialog-body" style="padding: 14px; overflow-y: auto; flex: 1; font-size: 12px;">
                    <!-- TIMELINE PANEL -->
                    <div id="act-tab-timeline-${modalId}" style="display: block;">
                        <p style="margin: 0 0 12px 0; color: #555; font-size: 12px;">
                            Chronological administration activity log recording the complete System Administration classroom demonstration:
                        </p>
                        <div style="border: 1px solid #e1dfdd; border-radius: 4px; overflow: hidden; background: #faf9f8;">
                            <table class="win-table" style="width: 100%; border-collapse: collapse; font-size: 12px;">
                                <thead style="background: #f3f2f1; border-bottom: 1px solid #d2d0ce;">
                                    <tr>
                                        <th style="width: 70px; padding: 6px 10px; text-align: left;">Time</th>
                                        <th style="width: 260px; padding: 6px 10px; text-align: left;">Event / Action</th>
                                        <th style="padding: 6px 10px; text-align: left;">Demonstration Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${timelineItems.map(item => `
                                        <tr style="border-bottom: 1px solid #edebe9;">
                                            <td style="padding: 6px 10px; font-family: monospace; font-weight: bold; color: #0078d4;">${item.time}</td>
                                            <td style="padding: 6px 10px; font-weight: 600; color: #323130;">${item.title}</td>
                                            <td style="padding: 6px 10px; color: #605e5c;">${item.desc}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- AUDIT TRAIL PANEL -->
                    <div id="act-tab-audit-${modalId}" style="display: none;">
                        <p style="margin: 0 0 12px 0; color: #555; font-size: 12px;">
                            Active security event log stored in <code>${hostname}</code> Security subsystem (Microsoft-Windows-Security-Auditing):
                        </p>
                        <div style="border: 1px solid #e1dfdd; max-height: 320px; overflow-y: auto; background: #fff;">
                            <table class="win-table" style="width: 100%; border-collapse: collapse; font-size: 11px;">
                                <thead style="background: #f3f2f1; position: sticky; top: 0;">
                                    <tr>
                                        <th style="padding: 5px 8px;">Time</th>
                                        <th style="padding: 5px 8px;">Level</th>
                                        <th style="padding: 5px 8px;">Event ID</th>
                                        <th style="padding: 5px 8px;">User</th>
                                        <th style="padding: 5px 8px;">Task</th>
                                        <th style="padding: 5px 8px;">Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${logs.length ? logs.map(e => `
                                        <tr style="border-bottom: 1px solid #eee;">
                                            <td style="padding: 4px 8px; font-family: monospace;">${e.time}</td>
                                            <td style="padding: 4px 8px;">${e.level.includes('Failure') ? '🛑 ' + e.level : (e.level.includes('Warning') ? '⚠️ ' + e.level : 'ℹ️ ' + e.level)}</td>
                                            <td style="padding: 4px 8px; font-weight: bold;">${e.eventId}</td>
                                            <td style="padding: 4px 8px;">${e.user}</td>
                                            <td style="padding: 4px 8px;">${e.task}</td>
                                            <td style="padding: 4px 8px; max-width: 250px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${e.details}">${e.details}</td>
                                        </tr>
                                    `).join('') : `
                                        <tr><td colspan="6" style="padding: 16px; text-align: center; color: #888;">No audit events recorded.</td></tr>
                                    `}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div class="win-dialog-footer" style="padding: 10px 14px; background: #f8f8f8; border-top: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; gap: 8px;">
                        <button class="win-btn" onclick="window.auditManager.exportLogCsv()">💾 Export CSV</button>
                        <button class="win-btn" onclick="window.appMain.promptClearAudit(); window.windowsManager.closeModal('${modalId}');">🧹 Clear Log</button>
                    </div>
                    <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${modalId}')">Close</button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: "Simulated Administration & Security Activity Log",
            html,
            width: 740,
            height: 520
        });
    }

    switchActivityTab(modalId, tab) {
        const timePanel = document.getElementById(`act-tab-timeline-${modalId}`);
        const auditPanel = document.getElementById(`act-tab-audit-${modalId}`);
        const timeBtn = document.getElementById('act-tab-btn-timeline');
        const auditBtn = document.getElementById('act-tab-btn-audit');

        if (tab === 'timeline') {
            if (timePanel) timePanel.style.display = 'block';
            if (auditPanel) auditPanel.style.display = 'none';
            if (timeBtn) { timeBtn.style.borderBottom = '2px solid #0078d4'; timeBtn.style.fontWeight = '600'; timeBtn.style.color = '#000'; }
            if (auditBtn) { auditBtn.style.borderBottom = 'none'; auditBtn.style.fontWeight = 'normal'; auditBtn.style.color = '#555'; }
        } else {
            if (timePanel) timePanel.style.display = 'none';
            if (auditPanel) auditPanel.style.display = 'block';
            if (timeBtn) { timeBtn.style.borderBottom = 'none'; timeBtn.style.fontWeight = 'normal'; timeBtn.style.color = '#555'; }
            if (auditBtn) { auditBtn.style.borderBottom = '2px solid #0078d4'; auditBtn.style.fontWeight = '600'; auditBtn.style.color = '#000'; }
        }
    }

    promptReset() {
        window.windowsManager.showConfirmBox({
            title: "Reset Simulation Environment",
            message: "Reset the entire simulated environment?\n\nAll created virtual machines, Windows installations, users, groups, permissions, resources, and audit logs will be permanently cleared. The simulator will return to Oracle VM VirtualBox Manager with no virtual machines.",
            onYes: () => {
                window.systemState.resetAll();
                const vmWin = document.getElementById('vm-running-window');
                if (vmWin) vmWin.style.display = 'none';
                window.vboxManager.render();
            }
        });
    }

    promptLoadDemo() {
        window.windowsManager.showConfirmBox({
            title: "Load Demonstration Scenario",
            message: "Load full demonstration scenario? This prepares Windows Server with pre-configured users (jdoe, asmith, mwilson), groups (GRP_Finance, GRP_IT_Admins, GRP_Marketing), and C:\\FinanceData ACLs for instant presentation.",
            onYes: () => {
                window.systemState.loadDemoScenario();
                window.vboxManager.openVmWindow();
                window.windowsManager.renderDesktop();
                window.windowsManager.openApp('computer-management');
                if (window.usersManager) {
                    window.usersManager.selectTreeNode('users');
                }
            }
        });
    }

    // --- PRESENTATION WORKFLOW TRACKER ---
    renderScenarioTracker() {
        if (!window.systemState) return;
        const state = window.systemState.getState();
        const badgeEl = document.getElementById('sim-mode-badge');
        const descEl = document.getElementById('sim-mode-desc');
        const trackerPill = document.getElementById('sim-active-step-label');

        if (state.simulationMode === 'sandbox') {
            if (badgeEl) {
                badgeEl.textContent = '🎮 SANDBOX MODE';
                badgeEl.className = 'sim-mode-badge sandbox';
                badgeEl.title = 'Simulator Mode: Sandbox (Unrestricted system administration)';
            }
            if (descEl) {
                descEl.textContent = 'Free Exploration System Administration (Actions in any order)';
            }
            if (trackerPill) {
                trackerPill.textContent = 'Sandbox Active';
            }
        } else {
            if (badgeEl) {
                badgeEl.textContent = '🎬 DEMO MODE';
                badgeEl.className = 'sim-mode-badge demo';
                badgeEl.title = 'Simulator Mode: Demonstration Scenario (Click to switch back to Sandbox Mode)';
            }
            if (descEl) {
                descEl.textContent = 'Demonstration Scenario (jdoe, GRP_Finance, C:\\FinanceData)';
            }
            if (trackerPill) {
                const demo = window.systemState.getDemoState();
                trackerPill.textContent = demo.currentStepTitle || 'Presentation Ready';
            }
        }
    }

    toggleGuideModal() {
        const demo = window.systemState.getDemoState();
        const curStep = demo.currentStep;
        const modalId = 'modal-scenario-guide';

        const html = `
            <div class="win-dialog" style="width: 760px; max-width: 95vw; max-height: 85vh; display:flex; flex-direction:column;">
                <div class="win-dialog-titlebar">
                    <span class="win-dialog-title">📋 Classroom Reference Guide (Optional Tasks)</span>
                    <button class="win-dialog-close" onclick="window.windowsManager.closeModal('${modalId}')">✕</button>
                </div>
                <div class="win-dialog-body" style="overflow-y:auto; flex:1; padding: 16px;">
                    <div style="background: #eef7ff; border: 1px solid #cce4f7; padding: 10px 14px; border-radius: 4px; margin-bottom: 14px; font-size: 12px; color: #333;">
                        <b>Reference Laboratory Workflow:</b> These steps serve as optional guidance. The sandbox does NOT force a sequential path—you are free to explore, create, and test resources in any order you choose.
                    </div>
                    <div class="guide-steps-list">
                        ${demo.steps.map(s => `
                            <div class="guide-step-card ${s.completed ? 'completed' : (s.num === curStep ? 'current' : 'ready')}" style="display: flex; gap: 12px; padding: 10px 12px; border-bottom: 1px solid #e1dfdd; align-items: center;">
                                <div class="guide-step-num" style="width: 28px; height: 28px; border-radius: 50%; background: ${s.completed ? '#107c41' : '#0078d4'}; color: white; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 12px;">
                                    ${s.completed ? '✓' : s.num}
                                </div>
                                <div class="guide-step-info" style="flex: 1;">
                                    <div class="guide-step-title" style="display: flex; align-items: center; gap: 8px;">
                                        <b>${s.title}</b>
                                        ${s.completed ? '<span class="status-pill ok" style="font-size: 11px;">Completed ✓</span>' : '<span class="status-pill current" style="font-size: 11px;">Available ▶</span>'}
                                    </div>
                                    <div class="guide-step-desc" style="font-size: 12px; color: #555; margin-top: 2px;">
                                        ${s.desc}
                                    </div>
                                </div>
                                <div class="guide-step-btn-wrap">
                                    <button class="win-btn win-btn-sm ${s.num === curStep ? 'win-btn-default' : ''}" 
                                            onclick="window.windowsManager.closeModal('${modalId}'); window.appMain.executeGuideStep(${s.num});">
                                        ${s.completed ? 'Review' : 'Open Tool'}
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="win-dialog-footer" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 16px;">
                    <button class="win-btn" onclick="window.windowsManager.closeModal('${modalId}'); window.systemState.loadDemoScenario(); window.vboxManager.openVmWindow(); window.windowsManager.renderDesktop();">
                        ⚡ Load Full Demo Scenario
                    </button>
                    <button class="win-btn win-btn-default" onclick="window.windowsManager.closeModal('${modalId}')">
                        Close
                    </button>
                </div>
            </div>
        `;

        window.windowsManager.openModal({
            id: modalId,
            title: 'Classroom Reference Guide',
            html
        });
    }

    executeGuideStep(stepNum) {

        switch (stepNum) {
            case 1:
                window.vboxManager.openNewVmModal();
                break;
            case 2:
                window.vboxManager.openSettingsModal();
                break;
            case 3:
                window.vboxManager.handleStartVm();
                break;
            case 4:
                window.windowsManager.renderDesktop();
                window.windowsManager.openApp('server-manager');
                break;
            case 5:
                window.windowsManager.openApp('computer-management');
                setTimeout(() => window.usersManager.openNewUserDialog(), 300);
                break;
            case 6:
                window.windowsManager.openApp('computer-management');
                setTimeout(() => {
                    window.usersManager.selectTreeNode('groups');
                    window.groupsManager.openNewGroupDialog();
                }, 300);
                break;
            case 7:
                window.windowsManager.openApp('computer-management');
                setTimeout(() => {
                    window.usersManager.selectTreeNode('groups');
                    window.groupsManager.openAddMemberPicker('GRP_Finance');
                }, 300);
                break;
            case 8:
                // Classroom educational role summary
                window.usersManager.openEducationalRoleSummary('jdoe');
                break;
            case 9:
                window.windowsManager.openApp('explorer', { path: 'C:\\' });
                setTimeout(() => {
                    window.permissionsManager.promptNewFolder(window.windowsManager.activeWindowId);
                }, 300);
                break;
            case 10:
                window.permissionsManager.openSecurityProperties('C:\\FinanceData');
                break;
            case 11:
                window.windowsManager.openApp('security-test');
                setTimeout(() => {
                    window.permissionsManager.quickFillTest('jdoe', 'Modify');
                }, 200);
                break;
            case 12:
                window.windowsManager.openApp('security-test');
                setTimeout(() => {
                    window.permissionsManager.quickFillTest('mwilson', 'Modify');
                }, 200);
                break;
            case 13:
                window.usersManager.toggleUserDisabled('jdoe');
                window.windowsManager.openApp('security-test');
                setTimeout(() => {
                    window.permissionsManager.quickFillTest('jdoe', 'Modify');
                }, 200);
                break;
            case 14:
                window.windowsManager.openApp('computer-management');
                setTimeout(() => {
                    window.usersManager.selectTreeNode('users');
                    window.usersManager.promptDeleteUser('jdoe');
                }, 300);
                break;
            case 15:
                window.windowsManager.openApp('computer-management');
                setTimeout(() => {
                    window.usersManager.selectTreeNode('groups');
                    window.groupsManager.promptDeleteGroup('GRP_Finance');
                }, 300);
                break;
            case 16:
                window.windowsManager.openApp('server-manager');
                setTimeout(() => {
                    window.rolesManager?.openAddRolesWizard();
                }, 400);
                break;
            case 17:
                window.rolesManager?.openDCPromotionWizard();
                break;
        }
    }

    // --- COMMAND PROMPT (cmd.exe) EMULATION ---
    renderCmd(clientEl, winId) {
        clientEl.innerHTML = `
            <div class="cli-console cmd-console" id="cmd-wrap-${winId}">
                <div class="cli-output" id="cmd-out-${winId}">
                    Microsoft Windows [Version 10.0.20348.2461]<br>
                    (c) Microsoft Corporation. All rights reserved.<br><br>
                </div>
                <div class="cli-input-line">
                    <span class="cli-prompt">C:\\Users\\Administrator&gt;</span>
                    <input type="text" class="cli-input" id="cmd-in-${winId}" 
                           onkeydown="window.appMain.handleCmdKey(event, '${winId}')" autofocus />
                </div>
            </div>
        `;
        setTimeout(() => document.getElementById(`cmd-in-${winId}`)?.focus(), 100);
    }

    handleCmdKey(e, winId) {
        if (e.key === 'Enter') {
            const input = document.getElementById(`cmd-in-${winId}`);
            if (!input) return;
            const command = input.value.trim();
            this.executeCmdCommand(winId, command);
            input.value = '';
        }
    }

    executeCmdCommand(winId, rawCmd) {
        const out = document.getElementById(`cmd-out-${winId}`);
        if (!out) return;

        out.innerHTML += `<div class="cli-cmd-echo">C:\\Users\\Administrator&gt;${rawCmd}</div>`;

        if (!rawCmd) return;
        const cmdLower = rawCmd.toLowerCase();
        const parts = rawCmd.split(/\s+/);
        const main = parts[0].toLowerCase();

        if (main === 'cls' || main === 'clear') {
            out.innerHTML = '';
            return;
        }

        if (main === 'whoami') {
            const host = (window.systemState ? window.systemState.getState().server.hostname : 'win-server').toLowerCase();
            const currUser = (window.systemState ? window.systemState.getState().server.currentUser : 'administrator').toLowerCase();
            out.innerHTML += `<div>${host}\\${currUser}</div><br>`;
            return;
        }

        if (main === 'hostname') {
            const host = window.systemState ? window.systemState.getState().server.hostname : 'WIN-SERVER';
            out.innerHTML += `<div>${host}</div><br>`;
            return;
        }

        if (main === 'help') {
            out.innerHTML += `
                <div>Supported Simulated Commands:</div>
                <div>  net user                         - List all user accounts</div>
                <div>  net user &lt;name&gt;                    - View account details</div>
                <div>  net user &lt;name&gt; &lt;pass&gt; /add       - Create a new user</div>
                <div>  net user &lt;name&gt; /delete          - Delete a user account</div>
                <div>  net user &lt;name&gt; /active:no       - Disable a user account</div>
                <div>  net user &lt;name&gt; /active:yes      - Enable a user account</div>
                <div>  net localgroup                   - List all local groups</div>
                <div>  net localgroup &lt;group&gt;             - View group members</div>
                <div>  net localgroup &lt;group&gt; &lt;user&gt; /add - Add user to group</div>
                <div>  icacls "C:\\FinanceData"           - View folder permissions</div>
                <div>  cls                              - Clear console screen</div><br>
            `;
            return;
        }

        // --- NET COMMANDS ---
        if (main === 'net') {
            const sub = (parts[1] || '').toLowerCase();

            // net user
            if (sub === 'user') {
                if (parts.length === 2) {
                    // List users
                    const users = window.systemState.getState().users;
                    const host = window.systemState ? window.systemState.getState().server.hostname : 'WIN-SERVER';
                    out.innerHTML += `
                        <div>User accounts for \\\\${host}</div>
                        <div>-------------------------------------------------------------------------------</div>
                        <div>${users.map(u => u.username.padEnd(25)).join('')}</div>
                        <div>The command completed successfully.</div><br>
                    `;
                    return;
                }

                const targetUser = parts[2];

                if (rawCmd.includes('/add')) {
                    const pass = parts[3] && !parts[3].startsWith('/') ? parts[3] : "User@12345";
                    const res = window.systemState.createUser({ username: targetUser, password: pass, fullName: targetUser });
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }

                if (rawCmd.includes('/delete')) {
                    const res = window.systemState.deleteUser(targetUser);
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }

                if (rawCmd.includes('/active:no')) {
                    const res = window.systemState.toggleUserDisabled(targetUser, true);
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }

                if (rawCmd.includes('/active:yes')) {
                    const res = window.systemState.toggleUserDisabled(targetUser, false);
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }

                // Show user details
                const u = window.systemState.getState().users.find(x => x.username.toLowerCase() === targetUser.toLowerCase());
                if (!u) {
                    out.innerHTML += `<div class="cli-err">The user name could not be found.</div><br>`;
                    return;
                }

                const groups = window.systemState.getUserGroups(u.username).map(g => `*${g.name}`).join(' ');
                out.innerHTML += `
                    <div>User name                    ${u.username}</div>
                    <div>Full Name                    ${u.fullName || ''}</div>
                    <div>Comment                      ${u.description || ''}</div>
                    <div>Account active               ${u.disabled ? 'No' : 'Yes'}</div>
                    <div>Password never expires       ${u.passwordNeverExpires ? 'Yes' : 'No'}</div>
                    <div>Local Group Memberships      ${groups}</div>
                    <div>The command completed successfully.</div><br>
                `;
                return;
            }

            // net localgroup
            if (sub === 'localgroup') {
                if (parts.length === 2) {
                    const groups = window.systemState.getState().groups;
                    const host = window.systemState ? window.systemState.getState().server.hostname : 'WIN-SERVER';
                    out.innerHTML += `
                        <div>Aliases for \\\\${host}</div>
                        <div>-------------------------------------------------------------------------------</div>
                        <div>${groups.map(g => `*${g.name}`.padEnd(25)).join('')}</div>
                        <div>The command completed successfully.</div><br>
                    `;
                    return;
                }

                const targetGroup = parts[2];

                // Group operations: net localgroup <group> /add or /delete
                if (parts.length === 4 && (parts[3].toLowerCase() === '/add' || parts[3].toLowerCase() === '/delete')) {
                    if (parts[3].toLowerCase() === '/add') {
                        const res = window.systemState.createGroup({ name: targetGroup, description: "Created via Command Prompt" });
                        if (res.success) {
                            out.innerHTML += `<div>The command completed successfully.</div><br>`;
                        } else {
                            out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                        }
                        return;
                    } else if (parts[3].toLowerCase() === '/delete') {
                        const res = window.systemState.deleteGroup(targetGroup);
                        if (res.success) {
                            out.innerHTML += `<div>The command completed successfully.</div><br>`;
                        } else {
                            out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                        }
                        return;
                    }
                }

                if (parts.length === 3) {
                    const g = window.systemState.getState().groups.find(x => x.name.toLowerCase() === targetGroup.toLowerCase());
                    if (!g) {
                        out.innerHTML += `<div class="cli-err">The specified local group does not exist.</div><br>`;
                        return;
                    }
                    out.innerHTML += `
                        <div>Alias name     ${g.name}</div>
                        <div>Comment        ${g.description || ''}</div>
                        <div>Members</div>
                        <div>-------------------------------------------------------------------------------</div>
                        ${g.members.map(m => `<div>${m}</div>`).join('')}
                        <div>The command completed successfully.</div><br>
                    `;
                    return;
                }

                const memberUser = parts[3];
                if (rawCmd.includes('/add')) {
                    const res = window.systemState.addUserToGroup(memberUser, targetGroup);
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }

                if (rawCmd.includes('/delete')) {
                    const res = window.systemState.removeUserFromGroup(memberUser, targetGroup);
                    if (res.success) {
                        out.innerHTML += `<div>The command completed successfully.</div><br>`;
                    } else {
                        out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                    }
                    return;
                }
            }
        }

        if (main === 'icacls') {
            const path = parts[1]?.replace(/"/g, '') || "C:\\FinanceData";
            const acl = window.systemState.getState().permissions[path];
            if (acl) {
                out.innerHTML += `
                    <div>${path} ${acl.entries.map(e => `${e.principal}:(${e.rights.includes('FullControl') ? 'F' : (e.rights.includes('Modify') ? 'M' : 'R')})`).join(' ')}</div>
                    <div>Successfully processed 1 files; Failed processing 0 files</div><br>
                `;
            } else {
                out.innerHTML += `<div>${path}: Access is denied or path not found.</div><br>`;
            }
            return;
        }

        out.innerHTML += `<div class="cli-err">'${main}' is not recognized as an internal or external command, operable program or batch file. Type 'help' for available commands.</div><br>`;
    }

    // --- WINDOWS POWERSHELL EMULATION ---
    renderPowerShell(clientEl, winId) {
        clientEl.innerHTML = `
            <div class="cli-console ps-console" id="ps-wrap-${winId}">
                <div class="cli-output" id="ps-out-${winId}">
                    Windows PowerShell<br>
                    Copyright (C) Microsoft Corporation. All rights reserved.<br><br>
                    Install the latest PowerShell for new features and improvements! https://aka.ms/PSWindows<br><br>
                </div>
                <div class="cli-input-line">
                    <span class="cli-prompt ps-prompt">PS C:\\Users\\Administrator&gt;</span>
                    <input type="text" class="cli-input ps-input" id="ps-in-${winId}" 
                           onkeydown="window.appMain.handlePsKey(event, '${winId}')" autofocus />
                </div>
            </div>
        `;
        setTimeout(() => document.getElementById(`ps-in-${winId}`)?.focus(), 100);
    }

    handlePsKey(e, winId) {
        if (e.key === 'Enter') {
            const input = document.getElementById(`ps-in-${winId}`);
            if (!input) return;
            const command = input.value.trim();
            this.executePsCommand(winId, command);
            input.value = '';
        }
    }

    executePsCommand(winId, rawCmd) {
        const out = document.getElementById(`ps-out-${winId}`);
        if (!out) return;

        out.innerHTML += `<div class="cli-cmd-echo ps-echo">PS C:\\Users\\Administrator&gt; ${rawCmd}</div>`;

        if (!rawCmd) return;
        const cmdLower = rawCmd.toLowerCase();
        const parts = rawCmd.split(/\s+/);
        const cmd = parts[0];

        if (cmd.toLowerCase() === 'clear' || cmd.toLowerCase() === 'cls') {
            out.innerHTML = '';
            return;
        }

        if (cmd.toLowerCase() === 'whoami') {
            const host = (window.systemState ? window.systemState.getState().server.hostname : 'win-server').toLowerCase();
            const currUser = (window.systemState ? window.systemState.getState().server.currentUser : 'administrator').toLowerCase();
            out.innerHTML += `<div>${host}\\${currUser}</div><br>`;
            return;
        }

        if (cmd.toLowerCase() === 'hostname') {
            const host = window.systemState ? window.systemState.getState().server.hostname : 'WIN-SERVER';
            out.innerHTML += `<div>${host}</div><br>`;
            return;
        }

        if (cmd.toLowerCase() === 'get-localgroupmember') {
            const groupMatch = rawCmd.match(/-Group\s+"?([^"\s]+)"?/i);
            const groupName = groupMatch ? groupMatch[1] : (parts[1] || '').replace(/['"]/g, '');
            if (!groupName) {
                out.innerHTML += `<div class="cli-err">Get-LocalGroupMember : Cannot bind parameter 'Group'. Parameter name is required.</div><br>`;
                return;
            }

            const state = window.systemState.getState();
            const group = state.groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
            if (!group) {
                out.innerHTML += `<div class="cli-err">Get-LocalGroupMember : Group '${groupName}' was not found.</div><br>`;
                return;
            }

            const host = state.server.hostname || 'WIN-SERVER';
            const lines = group.members.map(m => {
                return `User        ${host}\\${m}`;
            });

            out.innerHTML += `
                <div><pre style="font-family: Consolas, monospace; font-size: 12px; margin: 4px 0;">
ObjectClass Name
----------- ----
${lines.length ? lines.join('\n') : '(No members in this group)'}
                </pre></div><br>
            `;
            return;
        }

        if (cmd.toLowerCase() === 'get-acl') {
            const pathMatch = rawCmd.match(/-Path\s+"?([^"\s]+)"?/i);
            const path = pathMatch ? pathMatch[1] : (parts[1] || 'C:\\FinanceData').replace(/['"]/g, '');
            const state = window.systemState.getState();
            const acl = state.permissions[path];
            const host = state.server.hostname || 'WIN-SERVER';

            if (!acl) {
                out.innerHTML += `<div class="cli-err">Get-Acl : Cannot find path '${path}' because it does not exist.</div><br>`;
                return;
            }

            const dir = path.includes('\\') ? path.substring(0, path.lastIndexOf('\\') + 1) : 'C:\\';
            const name = path.split('\\').pop();
            const owner = `${host}\\${acl.owner || 'Administrators'}`;

            const accessLines = acl.entries.map(e => {
                const rightsStr = e.rights.includes('FullControl') ? 'FullControl' : (e.rights.includes('Modify') ? 'Modify, Synchronize' : 'ReadAndExecute, Synchronize');
                return `${host}\\${e.principal} ${e.type}  ${rightsStr}`;
            });

            out.innerHTML += `
                <div><pre style="font-family: Consolas, monospace; font-size: 12px; margin: 4px 0;">
    Directory: ${dir}

Path        Owner                   Access
----        -----                   ------
${name.padEnd(11)} ${owner.padEnd(23)} ${accessLines.join('\n' + ' '.repeat(36))}
                </pre></div><br>
            `;
            return;
        }

        if (cmd.toLowerCase() === 'get-localuser') {
            const users = window.systemState.getState().users;
            out.innerHTML += `
                <div><pre>
Name               Enabled Description
----               ------- -----------
${users.map(u => `${u.username.padEnd(18)} ${(!u.disabled).toString().padEnd(7)} ${u.description || ''}`).join('\n')}
                </pre></div><br>
            `;
            return;
        }

        if (cmd.toLowerCase() === 'new-localuser') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : `User_${Date.now()}`;
            const res = window.systemState.createUser({ username: name, fullName: name, description: "Created via PowerShell" });
            if (res.success) {
                out.innerHTML += `
                    <div><pre>
Name        Enabled Description
----        ------- -----------
${name.padEnd(11)} True    Created via PowerShell
                    </pre></div><br>
                `;
            } else {
                out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'get-localgroup') {
            const groups = window.systemState.getState().groups;
            out.innerHTML += `
                <div><pre>
Name                 Description
----                 -----------
${groups.map(g => `${g.name.padEnd(20)} ${g.description || ''}`).join('\n')}
                </pre></div><br>
            `;
            return;
        }

        if (cmd.toLowerCase() === 'new-localgroup') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : `Group_${Date.now()}`;
            const res = window.systemState.createGroup({ name: name, description: "Created via PowerShell" });
            if (res.success) {
                out.innerHTML += `<div>New-LocalGroup : Group '${name}' created successfully.</div><br>`;
            } else {
                out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'add-localgroupmember') {
            const groupMatch = rawCmd.match(/-Group\s+"?([^"\s]+)"?/i);
            const memberMatch = rawCmd.match(/-Member\s+"?([^"\s]+)"?/i);
            if (groupMatch && memberMatch) {
                const res = window.systemState.addUserToGroup(memberMatch[1], groupMatch[1]);
                if (res.success) {
                    out.innerHTML += `<div>Add-LocalGroupMember : Successfully added '${memberMatch[1]}' to '${groupMatch[1]}'.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            } else {
                out.innerHTML += `<div class="cli-err">Syntax: Add-LocalGroupMember -Group &lt;GroupName&gt; -Member &lt;UserName&gt;</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'disable-localuser') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : parts[1];
            if (name) {
                const res = window.systemState.toggleUserDisabled(name, true);
                if (res.success) {
                    out.innerHTML += `<div>Disable-LocalUser : Account '${name}' disabled.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            }
            return;
        }

        if (cmd.toLowerCase() === 'enable-localuser') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : parts[1];
            if (name) {
                const res = window.systemState.toggleUserDisabled(name, false);
                if (res.success) {
                    out.innerHTML += `<div>Enable-LocalUser : Account '${name}' enabled.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            }
            return;
        }

        if (cmd.toLowerCase() === 'remove-localuser') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : parts[1];
            if (name) {
                const res = window.systemState.deleteUser(name);
                if (res.success) {
                    out.innerHTML += `<div>Remove-LocalUser : Account '${name}' deleted successfully.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            } else {
                out.innerHTML += `<div class="cli-err">Syntax: Remove-LocalUser -Name &lt;UserName&gt;</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'remove-localgroup') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const name = nameMatch ? nameMatch[1] : parts[1];
            if (name) {
                const res = window.systemState.deleteGroup(name);
                if (res.success) {
                    out.innerHTML += `<div>Remove-LocalGroup : Group '${name}' deleted successfully.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            } else {
                out.innerHTML += `<div class="cli-err">Syntax: Remove-LocalGroup -Name &lt;GroupName&gt;</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'remove-localgroupmember') {
            const groupMatch = rawCmd.match(/-Group\s+"?([^"\s]+)"?/i);
            const memberMatch = rawCmd.match(/-Member\s+"?([^"\s]+)"?/i);
            if (groupMatch && memberMatch) {
                const res = window.systemState.removeUserFromGroup(memberMatch[1], groupMatch[1]);
                if (res.success) {
                    out.innerHTML += `<div>Remove-LocalGroupMember : Successfully removed '${memberMatch[1]}' from '${groupMatch[1]}'.</div><br>`;
                } else {
                    out.innerHTML += `<div class="cli-err">${res.error}</div><br>`;
                }
            } else {
                out.innerHTML += `<div class="cli-err">Syntax: Remove-LocalGroupMember -Group &lt;GroupName&gt; -Member &lt;UserName&gt;</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'get-windowsfeature') {
            const state = window.systemState.getState();
            const roles = state.rolesAndFeatures?.roles || [];
            const features = state.rolesAndFeatures?.features || [];

            let lines = [
                "Display Name                                            Name                       Install State",
                "------------                                            ----                       -------------"
            ];

            roles.forEach(r => {
                const marker = r.installed ? '[X]' : '[ ]';
                const stateStr = r.installed ? 'Installed' : 'Available';
                lines.push(`${marker} ${r.name.padEnd(50)} ${r.id.padEnd(26)} ${stateStr}`);
            });

            features.forEach(f => {
                const marker = f.installed ? '[X]' : '[ ]';
                const stateStr = f.installed ? 'Installed' : 'Available';
                lines.push(`${marker} ${f.name.padEnd(50)} ${f.id.padEnd(26)} ${stateStr}`);
            });

            out.innerHTML += `<div><pre style="font-family: monospace; font-size: 11px;">${lines.join('\n')}</pre></div><br>`;
            return;
        }

        if (cmd.toLowerCase() === 'install-windowsfeature') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const featureName = nameMatch ? nameMatch[1].toLowerCase() : (parts[1] || '').toLowerCase();

            if (!featureName) {
                out.innerHTML += `<div class="cli-err">Syntax: Install-WindowsFeature -Name &lt;FeatureName&gt; [-IncludeManagementTools]</div><br>`;
                return;
            }

            let roleId = '';
            if (featureName.includes('ad-domain') || featureName.includes('ad-ds') || featureName.includes('activedirectory')) {
                roleId = 'ad-ds';
            } else if (featureName.includes('dns')) {
                roleId = 'dns';
            } else if (featureName.includes('dhcp')) {
                roleId = 'dhcp';
            } else if (featureName.includes('web-server') || featureName.includes('iis')) {
                roleId = 'web-server';
            }

            if (roleId) {
                const res = window.systemState.installRolesAndFeatures([roleId], ['rsat-ad-tools', 'gpmc']);
                out.innerHTML += `
                    <div><pre style="font-family: monospace; font-size: 11px;">
Success Restart Needed Exit Code      Feature Result
------- -------------- ---------      --------------
True    No             Success        {${res.installedNames.join(', ')}}
                    </pre></div>
                    ${roleId === 'ad-ds' ? `<div><b>[WARNING]</b> Active Directory Domain Services requires post-deployment configuration. Run Server Manager to promote this server to a domain controller.</div><br>` : '<br>'}
                `;
            } else {
                out.innerHTML += `<div class="cli-err">Feature '${featureName}' is not recognized or already installed.</div><br>`;
            }
            return;
        }

        if (cmd.toLowerCase() === 'uninstall-windowsfeature') {
            const nameMatch = rawCmd.match(/-Name\s+"?([^"\s]+)"?/i);
            const featureName = nameMatch ? nameMatch[1].toLowerCase() : (parts[1] || '').toLowerCase();

            let roleId = '';
            if (featureName.includes('ad-domain') || featureName.includes('ad-ds')) roleId = 'ad-ds';
            else if (featureName.includes('dns')) roleId = 'dns';
            else if (featureName.includes('dhcp')) roleId = 'dhcp';
            else if (featureName.includes('web-server') || featureName.includes('iis')) roleId = 'web-server';

            if (roleId) {
                window.systemState.uninstallRolesAndFeatures([roleId], []);
                out.innerHTML += `
                    <div><pre style="font-family: monospace; font-size: 11px;">
Success Restart Needed Exit Code      Feature Result
------- -------------- ---------      --------------
True    No             Success        {${roleId}}
                    </pre></div><br>
                `;
            } else {
                out.innerHTML += `<div class="cli-err">Feature '${featureName}' not found or cannot be removed.</div><br>`;
            }
            return;
        }

        out.innerHTML += `<div class="cli-err">${cmd} : The term '${cmd}' is not recognized as the name of a cmdlet. Supported: whoami, hostname, Get-LocalUser, New-LocalUser, Remove-LocalUser, Enable-LocalUser, Disable-LocalUser, Get-LocalGroup, New-LocalGroup, Remove-LocalGroup, Get-LocalGroupMember, Add-LocalGroupMember, Remove-LocalGroupMember, Get-Acl, Get-WindowsFeature, Install-WindowsFeature, Uninstall-WindowsFeature, Clear</div><br>`;
    }
}

window.appMain = new AppMain();
