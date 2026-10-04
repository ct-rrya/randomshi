/**
 * System Administration Simulator - Central State Store
 * Manages simulation state for VirtualBox, Windows Server,
 * Users, Groups, Roles, Permissions (NTFS), Resources, and Audit Logs.
 */

const STORAGE_KEY = 'sysadmin_sim_state_v1';

function getDefaultRolesAndFeaturesState() {
    return {
        roles: [
            {
                id: 'ad-ds',
                name: 'Active Directory Domain Services',
                shortName: 'AD DS',
                icon: '🏢',
                category: 'Directory Services',
                installed: false,
                description: 'Active Directory Domain Services (AD DS) stores information about users, computers, and other devices on the network. AD DS helps administrators securely manage this information and facilitates resource sharing and collaboration between users.',
                requiredFeatures: ['gpmc', 'rsat-ad-tools'],
                needsPostConfig: true,
                postConfigTitle: 'Promote this server to a domain controller',
                services: [
                    { name: 'NTDS', display: 'Active Directory Domain Services', status: 'Running', startup: 'Automatic' },
                    { name: 'ADWS', display: 'Active Directory Web Services', status: 'Running', startup: 'Automatic' },
                    { name: 'KDC', display: 'Kerberos Key Distribution Center', status: 'Running', startup: 'Automatic' },
                    { name: 'Netlogon', display: 'Netlogon Service', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'dns',
                name: 'DNS Server',
                shortName: 'DNS',
                icon: '🌐',
                category: 'Network Services',
                installed: false,
                description: 'Domain Name System (DNS) Server provides name resolution for TCP/IP networks. DNS Server is easy to manage and helps you locate network resources.',
                requiredFeatures: ['rsat-dns-tools'],
                needsPostConfig: false,
                services: [
                    { name: 'DNS', display: 'DNS Server', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'dhcp',
                name: 'DHCP Server',
                shortName: 'DHCP',
                icon: '🖧',
                category: 'Network Services',
                installed: false,
                description: 'Dynamic Host Configuration Protocol (DHCP) Server enables you to configure, manage, and provide temporary IP addresses and related information for client computers.',
                requiredFeatures: ['rsat-dhcp-tools'],
                needsPostConfig: true,
                postConfigTitle: 'Complete DHCP configuration',
                services: [
                    { name: 'DhcpServer', display: 'DHCP Server Service', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'file-storage',
                name: 'File and Storage Services',
                shortName: 'File and Storage Services',
                icon: '📁',
                category: 'File Services',
                installed: true,
                description: 'File and Storage Services provides technologies that help you set up and manage one or more file servers.',
                requiredFeatures: [],
                needsPostConfig: false,
                services: [
                    { name: 'LanmanServer', display: 'Server', status: 'Running', startup: 'Automatic' },
                    { name: 'LanmanWorkstation', display: 'Workstation', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'web-server',
                name: 'Web Server (IIS)',
                shortName: 'IIS',
                icon: '🌍',
                category: 'Web Services',
                installed: false,
                description: 'Web Server (IIS) provides a reliable, manageable, and scalable Web application infrastructure for hosting websites and services.',
                requiredFeatures: ['net-framework-48'],
                needsPostConfig: false,
                services: [
                    { name: 'W3SVC', display: 'World Wide Web Publishing Service', status: 'Running', startup: 'Automatic' },
                    { name: 'WAS', display: 'Windows Process Activation Service', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'print-services',
                name: 'Print and Document Services',
                shortName: 'Print Services',
                icon: '🖨️',
                category: 'Print Services',
                installed: false,
                description: 'Print and Document Services enables you to centralize print server and network printer management tasks.',
                requiredFeatures: [],
                needsPostConfig: false,
                services: [
                    { name: 'Spooler', display: 'Print Spooler', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'hyper-v',
                name: 'Hyper-V',
                shortName: 'Hyper-V',
                icon: '⚡',
                category: 'Virtualization',
                installed: false,
                description: 'Hyper-V provides the services that you can use to create and manage virtual computing environments.',
                requiredFeatures: [],
                needsPostConfig: false,
                services: [
                    { name: 'vmms', display: 'Hyper-V Virtual Machine Management', status: 'Running', startup: 'Automatic' }
                ]
            },
            {
                id: 'remote-desktop',
                name: 'Remote Desktop Services',
                shortName: 'RDS',
                icon: '💻',
                category: 'Remote Access',
                installed: false,
                description: 'Remote Desktop Services accelerates and extends desktop and application deployments to any device.',
                requiredFeatures: [],
                needsPostConfig: false,
                services: [
                    { name: 'TermService', display: 'Remote Desktop Services', status: 'Running', startup: 'Automatic' }
                ]
            }
        ],
        features: [
            {
                id: 'net-framework-48',
                name: '.NET Framework 4.8 Features',
                installed: true,
                description: '.NET Framework 4.8 provides high productivity, security, and advanced reliability.'
            },
            {
                id: 'net-framework-35',
                name: '.NET Framework 3.5 Features',
                installed: false,
                description: '.NET Framework 3.5 combines the power of the .NET Framework 2.0 APIs with new technologies.'
            },
            {
                id: 'gpmc',
                name: 'Group Policy Management',
                installed: false,
                description: 'Group Policy Management Console (GPMC) makes it easy to manage Group Policy in an Active Directory environment.'
            },
            {
                id: 'rsat-ad-tools',
                name: 'Remote Server Administration Tools (RSAT) - AD DS and AD LDS Tools',
                installed: false,
                description: 'Includes Active Directory module for Windows PowerShell, Active Directory Users and Computers, Active Directory Administrative Center, Active Directory Domains and Trusts, and ADSI Edit.'
            },
            {
                id: 'rsat-dns-tools',
                name: 'Remote Server Administration Tools (RSAT) - DNS Server Tools',
                installed: false,
                description: 'DNS Server management snap-in and command-line tools.'
            },
            {
                id: 'rsat-dhcp-tools',
                name: 'Remote Server Administration Tools (RSAT) - DHCP Server Tools',
                installed: false,
                description: 'DHCP management console snap-in.'
            },
            {
                id: 'powershell',
                name: 'Windows PowerShell 5.1',
                installed: true,
                description: 'Windows PowerShell is a task-based command-line shell and scripting language.'
            },
            {
                id: 'windows-defender',
                name: 'Windows Defender Antivirus',
                installed: true,
                description: 'Windows Defender Antivirus provides enterprise-grade malware protection.'
            },
            {
                id: 'bitlocker',
                name: 'BitLocker Drive Encryption',
                installed: false,
                description: 'BitLocker Drive Encryption helps protect data on servers by encrypting entire disk volumes.'
            },
            {
                id: 'backup',
                name: 'Windows Server Backup',
                installed: false,
                description: 'Windows Server Backup allows you to back up and recover your operating system, applications, and files.'
            },
            {
                id: 'telnet-client',
                name: 'Telnet Client',
                installed: false,
                description: 'Telnet Client uses the Telnet protocol to connect to remote Telnet servers.'
            },
            {
                id: 'openssh-client',
                name: 'OpenSSH Client',
                installed: false,
                description: 'OpenSSH Client enables secure shell connectivity to remote systems.'
            }
        ],
        domainController: {
            promoted: false,
            forestName: '',
            netbiosName: '',
            domainMode: 'Windows Server 2022',
            forestMode: 'Windows Server 2022',
            promotedDate: null
        },
        notifications: []
    };
}

function getDefaultState() {
    return {
        // Mode: 'sandbox' (default interactive free play) or 'demo' (prepared scenario)
        simulationMode: 'sandbox',

        // Central Server & VM State
        vm: {
            exists: true,
            poweredOn: true,
            osInstalled: true,
            created: true,
            name: "WinServer2022",
            folder: "C:\\Users\\Student\\VirtualBox VMs",
            osType: "Microsoft Windows",
            osVersion: "Windows 2022 (64-bit)",
            status: "running", // running by default in interactive sandbox
            ram: 4096, // MB
            processors: 2,
            storage: 50.00, // GB
            diskType: "VDI",
            allocation: "Dynamically allocated",
            isoAttached: "Windows_Server_2022.iso",
            installed: true,
            bootOrder: ["Floppy", "Optical", "Hard Disk"],
            videoMemory: 128
        },

        // Windows Server Internal State
        server: {
            hostname: "WIN-SERVER",
            os: "Windows Server 2022 Standard Evaluation (Desktop Experience)",
            installedDate: "2026-10-01T08:00:00.000Z",
            adminPassword: "Password123!",
            currentUser: "Administrator",
            isLocked: false,
            domain: "WORKGROUP",
            ipAddress: "192.168.1.50",
            uptimeSeconds: 120
        },

        // Local Users
        users: [
            {
                username: "Administrator",
                fullName: "Built-in Administrator",
                description: "Built-in account for administering the computer/domain",
                password: "Password123!",
                mustChangePassword: false,
                cannotChangePassword: true,
                passwordNeverExpires: true,
                disabled: false,
                builtIn: true,
                sid: "S-1-5-21-3829104-500"
            },
            {
                username: "Guest",
                fullName: "Guest User",
                description: "Built-in account for guest access to the computer/domain",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-501"
            },
            {
                username: "DefaultAccount",
                fullName: "Default Account",
                description: "A user account managed by the system.",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-503"
            }
        ],

        // Local Groups
        groups: [
            {
                name: "Administrators",
                description: "Administrators have complete and unrestricted access to the computer/domain",
                members: ["Administrator"],
                builtIn: true,
                sid: "S-1-5-32-544"
            },
            {
                name: "Users",
                description: "Users are prevented from making accidental or intentional system-wide changes",
                members: ["Administrator"],
                builtIn: true,
                sid: "S-1-5-32-545"
            },
            {
                name: "Backup Operators",
                description: "Backup Operators can override security restrictions for the sole purpose of backing up or restoring files",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-551"
            },
            {
                name: "Remote Desktop Users",
                description: "Members in this group are granted the right to logon remotely",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-555"
            }
        ],

        // Normalized Group Memberships (Requirement 2)
        groupMemberships: [
            { username: "Administrator", groupName: "Administrators" },
            { username: "Administrator", groupName: "Users" }
        ],

        // Organizational Roles (Classroom Scenario RBAC mapping)
        roles: [],

        // Simulated File System Resources
        resources: {
            "C:\\": {
                name: "Local Disk (C:)",
                path: "C:\\",
                type: "drive",
                items: ["PerfLogs", "Program Files", "Users", "Windows"]
            },
            "This PC": {
                name: "This PC",
                path: "C:\\",
                type: "drive",
                items: ["Local Disk (C:)"]
            },
            "C:\\Users": {
                name: "Users",
                path: "C:\\Users",
                type: "folder",
                parent: "C:\\",
                items: ["Administrator", "Public"]
            },
            "C:\\Users\\Administrator": {
                name: "Administrator",
                path: "C:\\Users\\Administrator",
                type: "folder",
                parent: "C:\\Users",
                items: ["Desktop", "Documents", "Downloads"]
            },
            "C:\\Windows": {
                name: "Windows",
                path: "C:\\Windows",
                type: "folder",
                parent: "C:\\",
                items: ["System32", "SYSVOL", "explorer.exe"]
            },
            "C:\\Program Files": {
                name: "Program Files",
                path: "C:\\Program Files",
                type: "folder",
                parent: "C:\\",
                items: ["Common Files"]
            },
            "C:\\PerfLogs": {
                name: "PerfLogs",
                path: "C:\\PerfLogs",
                type: "folder",
                parent: "C:\\",
                items: []
            }
        },

        // Flattened lists for state-based simulation (Requirement 2)
        folders: [
            { name: "Local Disk (C:)", path: "C:\\", type: "drive" },
            { name: "Users", path: "C:\\Users", type: "folder", parent: "C:\\" },
            { name: "Administrator", path: "C:\\Users\\Administrator", type: "folder", parent: "C:\\Users" },
            { name: "Windows", path: "C:\\Windows", type: "folder", parent: "C:\\" },
            { name: "Program Files", path: "C:\\Program Files", type: "folder", parent: "C:\\" },
            { name: "PerfLogs", path: "C:\\PerfLogs", type: "folder", parent: "C:\\" }
        ],
        files: [],

        // NTFS ACLs on Resources
        permissions: {},

        // Server Roles and Features Installed Lists & Services (Requirement 2)
        installedRoles: ['file-storage'],
        installedFeatures: ['net-framework-48', 'powershell', 'windows-defender'],
        services: [
            { name: 'LanmanServer', display: 'Server', status: 'Running', startup: 'Automatic' },
            { name: 'LanmanWorkstation', display: 'Workstation', status: 'Running', startup: 'Automatic' }
        ],

        // Audit Log / Event Viewer Security Logs
        auditLog: [
            {
                id: 1,
                time: "09:00:15",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4608,
                level: "Information",
                user: "SYSTEM",
                task: "System Startup",
                details: "Windows Server 2022 operating system initialization completed successfully."
            },
            {
                id: 2,
                time: "09:01:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4624,
                level: "Information",
                user: "Administrator",
                task: "Logon",
                details: "An account was successfully logged on. Account Name: Administrator. Logon Type: 2 (Interactive)."
            }
        ],

        // Current Open Windows on Windows Server Desktop
        windows: {
            activeWindowId: null,
            openApps: [], // [{ appType: 'computer-management', params: {} }]
            activeMmcNode: 'users',
            nextZIndex: 100,
            instances: {} // windowId: { id, title, icon, x, y, width, height, isMinimized, isMaximized, zIndex, appType, params }
        },

        // Installation wizard step tracker
        setupStage: 'welcome',
        setupProgress: 0,
        setupFastMode: true,

        // Server Roles and Features (Server Manager & AD DS)
        rolesAndFeatures: getDefaultRolesAndFeaturesState()
    };
}

class StateStore {
    constructor() {
        this.listeners = [];
        this.state = this.loadState();
        this.syncDerivedState();
    }

    syncDerivedState() {
        if (!this.state) return;

        // Maintain Central Server State aliases (Requirement 2)
        if (!this.state.vm) this.state.vm = {};
        this.state.vm.exists = !!(this.state.vm.created || this.state.vm.name);
        this.state.vm.poweredOn = (this.state.vm.status === 'running');
        this.state.vm.osInstalled = !!this.state.vm.installed;

        // Keep groupMemberships synchronized with groups array
        this.state.groupMemberships = [];
        if (Array.isArray(this.state.groups)) {
            this.state.groups.forEach(g => {
                (g.members || []).forEach(m => {
                    this.state.groupMemberships.push({ username: m, groupName: g.name });
                });
            });
        }

        // Keep folders and files lists synchronized with resources dictionary
        if (this.state.resources) {
            this.state.folders = Object.values(this.state.resources).filter(r => r.type === 'folder' || r.type === 'drive');
            this.state.files = Object.values(this.state.resources).filter(r => r.type === 'file');
        } else {
            this.state.folders = [];
            this.state.files = [];
        }

        // Keep installedRoles and installedFeatures synchronized
        if (this.state.rolesAndFeatures) {
            this.state.installedRoles = (this.state.rolesAndFeatures.roles || []).filter(r => r.installed).map(r => r.id);
            this.state.installedFeatures = (this.state.rolesAndFeatures.features || []).filter(f => f.installed).map(f => f.id);
            this.state.services = [];
            (this.state.rolesAndFeatures.roles || []).filter(r => r.installed).forEach(r => {
                if (Array.isArray(r.services)) {
                    this.state.services.push(...r.services);
                }
            });
        }

        // Expose global serverState reference
        window.serverState = this.state;
    }

    loadState() {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                if (!parsed.rolesAndFeatures) {
                    parsed.rolesAndFeatures = getDefaultRolesAndFeaturesState();
                }
                if (parsed.server) {
                    if (!parsed.server.domain) parsed.server.domain = "WORKGROUP";
                    if (!parsed.server.hostname || parsed.server.hostname === "WIN-SERVER-2022") parsed.server.hostname = "WIN-SERVER";
                    if (!parsed.server.ipAddress || parsed.server.ipAddress === "192.168.1.105") parsed.server.ipAddress = "192.168.1.50";
                }
                if (!parsed.simulationMode) {
                    parsed.simulationMode = 'sandbox';
                }
                if (parsed.vm) {
                    parsed.vm.exists = true;
                    parsed.vm.created = true;
                    if (parsed.simulationMode === 'sandbox') {
                        parsed.vm.status = 'running';
                        parsed.vm.installed = true;
                        parsed.vm.poweredOn = true;
                        parsed.vm.osInstalled = true;
                    }
                }
                if (!parsed.windows) {
                    parsed.windows = { openApps: [], activeMmcNode: 'users' };
                }
                if (!Array.isArray(parsed.windows.openApps)) {
                    parsed.windows.openApps = [];
                }
                if (!parsed.windows.activeMmcNode) {
                    parsed.windows.activeMmcNode = 'users';
                }
                return parsed;
            }
        } catch (e) {
            console.warn('Failed to load state from localStorage', e);
        }
        return getDefaultState();
    }

    saveState() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
        } catch (e) {
            console.warn('Failed to save state to localStorage', e);
        }
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    notify(changeKey) {
        this.syncDerivedState();
        this.saveState();
        for (const listener of this.listeners) {
            try {
                listener(this.state, changeKey);
            } catch (err) {
                console.error(`Error in state listener for ${changeKey}:`, err);
            }
        }
    }

    getState() {
        return this.state;
    }

    setSimulationMode(mode) {
        if (mode === 'demo') {
            this.loadDemoScenario();
        } else {
            this.loadSandboxScenario();
        }
    }

    loadSandboxScenario() {
        if (window.windowsManager && window.windowsManager.closeAllWindows) {
            window.windowsManager.closeAllWindows();
        }
        const fresh = getDefaultState();
        fresh.simulationMode = 'sandbox';
        fresh.vm.created = true;
        fresh.vm.exists = true;
        fresh.vm.poweredOn = true;
        fresh.vm.osInstalled = true;
        fresh.vm.status = 'running';
        fresh.vm.installed = true;
        this.state = fresh;
        this.syncDerivedState();
        this.logAudit("Microsoft-Windows-Security-Auditing", 4608, "Information", "SYSTEM", "Sandbox Initialized", "Interactive System Administration Sandbox initialized. Standard administrative environment ready.");
        this.notify('all');
    }

    addOpenApp(appType, params = {}) {
        if (!this.state.windows) {
            this.state.windows = { openApps: [], activeMmcNode: 'users' };
        }
        if (!Array.isArray(this.state.windows.openApps)) {
            this.state.windows.openApps = [];
        }
        const existingIdx = this.state.windows.openApps.findIndex(a => a.appType === appType);
        if (existingIdx >= 0) {
            this.state.windows.openApps[existingIdx].params = params;
        } else {
            this.state.windows.openApps.push({ appType, params });
        }
        this.saveState();
    }

    removeOpenApp(appType) {
        if (!this.state.windows || !Array.isArray(this.state.windows.openApps)) return;
        this.state.windows.openApps = this.state.windows.openApps.filter(a => a.appType !== appType);
        this.saveState();
    }

    setActiveMmcNode(nodeKey) {
        if (!this.state.windows) {
            this.state.windows = { openApps: [], activeMmcNode: nodeKey };
        } else {
            this.state.windows.activeMmcNode = nodeKey;
        }
        this.saveState();
    }

    setSetupStage(stageNum) {
        this.state.setupStage = stageNum;
        this.saveState();
    }

    // Reset specifically to clean interactive Sandbox environment (running Windows Server)
    resetSandboxState() {
        if (window.windowsManager && window.windowsManager.closeAllWindows) {
            window.windowsManager.closeAllWindows();
        }
        this.state = getDefaultState();
        this.state.simulationMode = 'sandbox';
        this.logAudit("VirtualBox", 1000, "Information", "SYSTEM", "Sandbox Initialized", "Interactive administration sandbox initialized in clean state.");
        this.notify('all');
    }

    // Reset everything to virgin VirtualBox state
    resetAll() {
        if (window.windowsManager && window.windowsManager.closeAllWindows) {
            window.windowsManager.closeAllWindows();
        }
        this.state = getDefaultState();
        this.state.simulationMode = 'sandbox';
        this.state.vm.created = true;
        this.state.vm.name = "WinServer2022";
        this.state.vm.status = "poweredOff";
        this.state.vm.installed = false;
        this.state.server.hostname = "WIN-SERVER";
        this.state.server.ipAddress = "192.168.1.50";
        this.state.users = [
            {
                username: "Administrator",
                fullName: "Built-in Administrator",
                description: "Built-in account for administering the computer/domain",
                password: "Password123!",
                mustChangePassword: false,
                cannotChangePassword: true,
                passwordNeverExpires: true,
                disabled: false,
                builtIn: true,
                sid: "S-1-5-21-3829104-500"
            },
            {
                username: "Guest",
                fullName: "Guest User",
                description: "Built-in account for guest access to the computer/domain",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-501"
            },
            {
                username: "DefaultAccount",
                fullName: "Default Account",
                description: "A user account managed by the system.",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-503"
            }
        ];
        this.state.groups = [
            {
                name: "Administrators",
                description: "Administrators have complete and unrestricted access to the computer/domain",
                members: ["Administrator"],
                builtIn: true,
                sid: "S-1-5-32-544"
            },
            {
                name: "Users",
                description: "Users are prevented from making accidental or intentional system-wide changes",
                members: ["Administrator"],
                builtIn: true,
                sid: "S-1-5-32-545"
            },
            {
                name: "Backup Operators",
                description: "Backup Operators can override security restrictions for the sole purpose of backing up or restoring files",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-551"
            },
            {
                name: "Remote Desktop Users",
                description: "Members in this group are granted the right to logon remotely",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-555"
            }
        ];
        this.state.roles = [];
        this.state.resources = getDefaultState().resources;
        this.state.permissions = {};
        this.state.rolesAndFeatures = getDefaultRolesAndFeaturesState();
        this.state.server.domain = "WORKGROUP";
        this.state.auditLog = [
            {
                id: 1,
                time: "13:00:00",
                date: "2026-10-01",
                source: "VirtualBox",
                eventId: 1000,
                level: "Information",
                user: "VirtualBox Manager",
                task: "VM Initialized",
                details: "Virtual machine 'WinServer2022' initialized in Powered Off state."
            }
        ];
        this.state.windows.instances = {};
        this.state.windows.openApps = [];
        this.state.windows.activeMmcNode = 'users';
        this.state.windows.activeWindowId = null;
        this.state.activeScenarioStep = 1;
        this.logAudit("VirtualBox", 1000, "Information", "SYSTEM", "Simulator Reset", "Simulation environment reset to initial state.");
        this.notify('all');
    }

    // Load full demonstration scenario for presentation fast-forward
    loadDemoScenario() {
        if (window.windowsManager && window.windowsManager.closeAllWindows) {
            window.windowsManager.closeAllWindows();
        }
        this.state.simulationMode = 'demo';
        this.state.vm.created = true;
        this.state.vm.exists = true;
        this.state.vm.poweredOn = true;
        this.state.vm.osInstalled = true;
        this.state.vm.name = "WinServer2022";
        this.state.vm.ram = 4096;
        this.state.vm.processors = 2;
        this.state.vm.storage = 50.00;
        this.state.vm.isoAttached = "Windows_Server_2022.iso";
        this.state.vm.installed = true;
        this.state.vm.status = "running";
        this.state.server.hostname = "WIN-SERVER";
        this.state.server.os = "Windows Server 2022 Standard Evaluation (Desktop Experience)";
        this.state.server.ipAddress = "192.168.1.50";
        this.state.server.installedDate = new Date().toISOString();
        this.state.server.currentUser = "Administrator";

        // Create standard classroom users
        this.state.users = [
            {
                username: "Administrator",
                fullName: "Built-in Administrator",
                description: "Built-in account for administering the computer/domain",
                password: "Password123!",
                mustChangePassword: false,
                cannotChangePassword: true,
                passwordNeverExpires: true,
                disabled: false,
                builtIn: true,
                sid: "S-1-5-21-3829104-500"
            },
            {
                username: "Guest",
                fullName: "Guest User",
                description: "Built-in account for guest access to the computer/domain",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-501"
            },
            {
                username: "DefaultAccount",
                fullName: "Default Account",
                description: "A user account managed by the system.",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-503"
            },
            {
                username: "jdoe",
                fullName: "John Doe",
                description: "Financial Analyst",
                password: "User@12345",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: false,
                builtIn: false,
                sid: "S-1-5-21-3829104-1001"
            },
            {
                username: "mwilson",
                fullName: "Mark Wilson",
                description: "Marketing Specialist",
                password: "User@12345",
                mustChangePassword: false,
                cannotChangePassword: false,
                passwordNeverExpires: true,
                disabled: false,
                builtIn: false,
                sid: "S-1-5-21-3829104-1003"
            }
        ];

        // Create standard classroom groups
        this.state.groups = [
            {
                name: "Administrators",
                description: "Administrators have complete and unrestricted access to the computer/domain",
                members: ["Administrator"],
                builtIn: true,
                sid: "S-1-5-32-544"
            },
            {
                name: "Users",
                description: "Users are prevented from making accidental or intentional system-wide changes",
                members: ["Administrator", "jdoe", "mwilson"],
                builtIn: true,
                sid: "S-1-5-32-545"
            },
            {
                name: "Backup Operators",
                description: "Backup Operators can override security restrictions for the sole purpose of backing up or restoring files",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-551"
            },
            {
                name: "Remote Desktop Users",
                description: "Members in this group are granted the right to logon remotely",
                members: [],
                builtIn: true,
                sid: "S-1-5-32-555"
            },
            {
                name: "GRP_Finance",
                description: "Finance Department Security Group",
                members: ["jdoe"],
                builtIn: false,
                sid: "S-1-5-21-3829104-2001"
            }
        ];

        // Organizational Roles (educational RBAC representation)
        this.state.roles = [
            {
                id: "role_1",
                roleName: "Financial Analyst",
                assignedUser: "jdoe",
                securityGroup: "GRP_Finance",
                resource: "C:\\FinanceData",
                permissions: "Modify",
                description: "Organizational job role: Financial Analyst; Windows authorization boundary: GRP_Finance"
            }
        ];

        // Resources with simulated files
        this.state.resources = {
            "C:\\": {
                name: "Local Disk (C:)",
                path: "C:\\",
                type: "drive",
                items: ["FinanceData", "PerfLogs", "Program Files", "Users", "Windows"]
            },
            "C:\\FinanceData": {
                name: "FinanceData",
                path: "C:\\FinanceData",
                type: "folder",
                parent: "C:\\",
                owner: "Administrators",
                created: "2026-10-01 09:30:00",
                items: ["Budget.xlsx", "FinancialReport.docx", "Payroll.xlsx"]
            },
            "C:\\FinanceData\\Budget.xlsx": {
                name: "Budget.xlsx",
                path: "C:\\FinanceData\\Budget.xlsx",
                type: "file",
                size: "24.5 KB",
                content: "Q4 Operating Budget Spreadsheet\n\nDepartment: Finance\nTotal Budget: $1,250,000\nAllocated OPEX: $820,000\nAllocated CAPEX: $430,000\nStatus: Approved by CFO",
                parent: "C:\\FinanceData"
            },
            "C:\\FinanceData\\FinancialReport.docx": {
                name: "FinancialReport.docx",
                path: "C:\\FinanceData\\FinancialReport.docx",
                type: "file",
                size: "18.2 KB",
                content: "CONFIDENTIAL FINANCIAL REPORT - Q3/Q4\n\nExecutive Summary:\nQuarterly revenue increased by 14.2% year-over-year. Operating margins held steady at 22.8%.\nAll audit compliance measures satisfy SOX compliance standards.\nPrepared by: John Doe (Financial Analyst)",
                parent: "C:\\FinanceData"
            },
            "C:\\FinanceData\\Payroll.xlsx": {
                name: "Payroll.xlsx",
                path: "C:\\FinanceData\\Payroll.xlsx",
                type: "file",
                size: "52.1 KB",
                content: "MONTHLY DEPARTMENTAL PAYROLL REGISTER\n\nEmp ID | Name           | Position           | Gross Pay | Net Pay\n-----------------------------------------------------------------\nE-1001 | John Doe       | Financial Analyst  | $7,500.00 | $5,625.00\nE-1002 | Sarah Jenkins  | Senior Accountant  | $8,200.00 | $6,150.00\nE-1003 | David Miller   | Controller         | $11,500.00| $8,625.00",
                parent: "C:\\FinanceData"
            },
            "This PC": {
                name: "This PC",
                path: "C:\\",
                type: "drive",
                items: ["Local Disk (C:)"]
            },
            "C:\\Users": {
                name: "Users",
                path: "C:\\Users",
                type: "folder",
                parent: "C:\\",
                items: ["Administrator", "jdoe", "Public"]
            },
            "C:\\Users\\Administrator": {
                name: "Administrator",
                path: "C:\\Users\\Administrator",
                type: "folder",
                parent: "C:\\Users",
                items: ["Desktop", "Documents", "Downloads"]
            },
            "C:\\Windows": {
                name: "Windows",
                path: "C:\\Windows",
                type: "folder",
                parent: "C:\\",
                items: ["System32", "SYSVOL", "explorer.exe"]
            },
            "C:\\Program Files": {
                name: "Program Files",
                path: "C:\\Program Files",
                type: "folder",
                parent: "C:\\",
                items: ["Common Files"]
            },
            "C:\\PerfLogs": {
                name: "PerfLogs",
                path: "C:\\PerfLogs",
                type: "folder",
                parent: "C:\\",
                items: []
            }
        };

        // NTFS ACLs on Resources
        this.state.permissions = {
            "C:\\FinanceData": {
                owner: "Administrators",
                inheritance: false,
                entries: [
                    {
                        principal: "Administrators",
                        type: "Allow",
                        rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"]
                    },
                    {
                        principal: "SYSTEM",
                        type: "Allow",
                        rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"]
                    },
                    {
                        principal: "GRP_Finance",
                        type: "Allow",
                        rights: ["Modify", "ReadExecute", "ListFolder", "Read", "Write"]
                    },
                    {
                        principal: "Users",
                        type: "Allow",
                        rights: ["ReadExecute", "ListFolder", "Read"]
                    }
                ]
            }
        };

        // Roles and Features
        this.state.rolesAndFeatures = getDefaultRolesAndFeaturesState();
        this.state.server.domain = "WORKGROUP";

        // Simulated Administration Log (Exact timeline from prompt Section 20)
        this.state.auditLog = [
            {
                id: 9,
                time: "13:25:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4663,
                level: "Failure Audit",
                user: "mwilson",
                task: "Access Check",
                details: "Access test: mwilson — DENIED (mwilson is not a member of GRP_Finance; no Modify permission on C:\\FinanceData)."
            },
            {
                id: 8,
                time: "13:24:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4663,
                level: "Success Audit",
                user: "jdoe",
                task: "Access Check",
                details: "Access test: jdoe — GRANTED (jdoe is a member of GRP_Finance; GRP_Finance has Modify permission on C:\\FinanceData)."
            },
            {
                id: 7,
                time: "13:22:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4670,
                level: "Information",
                user: "Administrator",
                task: "Permissions Modified",
                details: "Permission assigned to C:\\FinanceData: GRP_Finance granted Modify rights."
            },
            {
                id: 6,
                time: "13:18:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4728,
                level: "Information",
                user: "Administrator",
                task: "Member Added to Group",
                details: "jdoe added to GRP_Finance."
            },
            {
                id: 5,
                time: "13:17:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4727,
                level: "Information",
                user: "Administrator",
                task: "Security Group Created",
                details: "Security group created: GRP_Finance."
            },
            {
                id: 4,
                time: "13:15:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Security-Auditing",
                eventId: 4720,
                level: "Information",
                user: "Administrator",
                task: "User Account Created",
                details: "User created: jdoe (Full Name: John Doe, Role: Financial Analyst)."
            },
            {
                id: 3,
                time: "13:12:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Setup",
                eventId: 1002,
                level: "Information",
                user: "SYSTEM",
                task: "Installation",
                details: "Windows Server installation completed."
            },
            {
                id: 2,
                time: "13:05:00",
                date: "2026-10-01",
                source: "Microsoft-Windows-Setup",
                eventId: 1001,
                level: "Information",
                user: "SYSTEM",
                task: "Installation",
                details: "Windows Server installation started."
            },
            {
                id: 1,
                time: "13:02:00",
                date: "2026-10-01",
                source: "VirtualBox",
                eventId: 1000,
                level: "Information",
                user: "VirtualBox Manager",
                task: "VM Created",
                details: "VM created: WinServer2022."
            }
        ];

        this.state.windows.instances = {};
        this.state.windows.openApps = [{ appType: 'computer-management', params: {} }];
        this.state.windows.activeMmcNode = 'users';
        this.state.windows.activeWindowId = null;

        this.notify('all');
    }

    // --- VM ACTIONS ---
    createVM(config) {
        this.state.vm.created = true;
        this.state.vm.name = config.name || "WinServer2022";
        this.state.vm.folder = config.folder || "C:\\Users\\Student\\VirtualBox VMs";
        this.state.vm.osType = config.osType || "Microsoft Windows";
        this.state.vm.osVersion = config.osVersion || "Windows 2022 (64-bit)";
        this.state.vm.ram = parseInt(config.ram, 10) || 4096;
        this.state.vm.processors = parseInt(config.processors, 10) || 2;
        this.state.vm.storage = parseFloat(config.storage) || 50.00;
        this.state.vm.diskType = config.diskType || "VDI";
        this.state.vm.allocation = config.allocation || "Dynamically allocated";
        this.state.vm.isoAttached = config.isoAttached || "Windows_Server_2022.iso";
        this.state.vm.status = "poweredOff";
        this.state.vm.installed = false;

        this.logAudit("VirtualBox", 1002, "Information", "VirtualBox Manager", "VM Created", `Virtual machine '${this.state.vm.name}' created with ${this.state.vm.ram}MB RAM, ${this.state.vm.processors} vCPUs, and ${this.state.vm.storage}GB VDI disk.`);
        this.notify('vm');
    }

    updateVMSettings(settings) {
        if (settings.ram !== undefined) this.state.vm.ram = parseInt(settings.ram, 10);
        if (settings.processors !== undefined) this.state.vm.processors = parseInt(settings.processors, 10);
        if (settings.bootOrder) this.state.vm.bootOrder = settings.bootOrder;
        if (settings.isoAttached !== undefined) this.state.vm.isoAttached = settings.isoAttached;
        if (settings.networkEnabled !== undefined) this.state.vm.networkEnabled = settings.networkEnabled;
        if (settings.networkAttachedTo !== undefined) this.state.vm.networkAttachedTo = settings.networkAttachedTo;

        this.logAudit("VirtualBox", 1003, "Information", "VirtualBox Manager", "VM Settings Changed", `Settings updated for '${this.state.vm.name}'. RAM: ${this.state.vm.ram}MB, vCPUs: ${this.state.vm.processors}, ISO: ${this.state.vm.isoAttached || 'None'}, Network: ${settings.networkAttachedTo || 'NAT'}`);
        this.notify('vm');
    }

    startVM() {
        if (!this.state.vm.created) return { success: false, error: "No virtual machine selected." };

        // Check bootable medium
        if (!this.state.vm.installed && !this.state.vm.isoAttached) {
            return {
                success: false,
                error: "FATAL: No bootable medium found! System halted.\n\nPlease attach 'Windows_Server_2022.iso' to the virtual optical drive in VM Settings."
            };
        }

        this.state.vm.status = "running";
        this.logAudit("VirtualBox", 1004, "Information", "VirtualBox Manager", "VM Started", `Virtual machine '${this.state.vm.name}' powered on.`);
        this.notify('vm');
        return { success: true };
    }

    stopVM(mode = "powerOff") {
        if (mode === "powerOff") {
            this.state.vm.status = "poweredOff";
        } else if (mode === "save") {
            this.state.vm.status = "saved";
        }
        this.logAudit("VirtualBox", 1005, "Information", "VirtualBox Manager", "VM Stopped", `Virtual machine '${this.state.vm.name}' powered off.`);
        this.notify('vm');
    }

    finishInstallation(adminPassword) {
        this.state.vm.installed = true;
        this.state.server.installedDate = new Date().toISOString();
        if (adminPassword) {
            this.state.server.adminPassword = adminPassword;
            const adminUser = this.state.users.find(u => u.username === "Administrator");
            if (adminUser) adminUser.password = adminPassword;
        }
        this.logAudit("Windows Setup", 4608, "Information", "SYSTEM", "OS Installation Complete", "Windows Server 2022 Datacenter Evaluation installed successfully.");
        this.notify('server');
    }

    // --- USERS MANAGEMENT ---
    createUser(userData) {
        if (!this.state.vm.installed) {
            return { success: false, error: "Action cannot be completed. Windows Server is not installed." };
        }

        const username = (userData.username || "").trim();
        if (!username) return { success: false, error: "User name cannot be empty." };

        // Check duplicate (Requirement 4.A)
        if (this.state.users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4720, "Failure Audit", this.state.server.currentUser, "User Account Creation Failed", `Failed to create user account '${username}'. The user name already exists.`);
            return { success: false, error: "The user name already exists." };
        }

        const newUser = {
            username: username,
            fullName: userData.fullName || "",
            description: userData.description || "",
            password: userData.password || "",
            mustChangePassword: !!userData.mustChangePassword,
            cannotChangePassword: !!userData.cannotChangePassword,
            passwordNeverExpires: !!userData.passwordNeverExpires,
            disabled: !!userData.disabled,
            builtIn: false,
            sid: `S-1-5-21-3829104-${1000 + this.state.users.length + 1}`
        };

        this.state.users.push(newUser);

        // Always add to Users group by default
        const usersGroup = this.state.groups.find(g => g.name === "Users");
        if (usersGroup && !usersGroup.members.includes(username)) {
            usersGroup.members.push(username);
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4720, "Information", this.state.server.currentUser, "User Account Created", `A user account was created: Account Name: ${username}, Full Name: ${newUser.fullName}.`);
        this.notify('users');
        return { success: true, user: newUser };
    }

    deleteUser(username) {
        if (!username) return { success: false, error: "The specified account could not be found." };
        const index = this.state.users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
        if (index === -1) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4726, "Failure Audit", this.state.server.currentUser, "User Account Deletion Failed", `Failed to delete user '${username}'. The specified account could not be found.`);
            return { success: false, error: "The specified account could not be found." };
        }

        const user = this.state.users[index];
        if (user.builtIn && user.username === "Administrator") {
            return { success: false, error: "Cannot delete the primary Administrator account." };
        }

        this.state.users.splice(index, 1);

        // Remove from all groups
        for (const group of this.state.groups) {
            group.members = group.members.filter(m => m.toLowerCase() !== username.toLowerCase());
        }

        // Remove from roles if any
        this.state.roles = this.state.roles.filter(r => r.assignedUser.toLowerCase() !== username.toLowerCase());

        // Clean up direct permissions referring to this user
        for (const resPath in this.state.permissions) {
            const acl = this.state.permissions[resPath];
            if (acl && acl.entries) {
                acl.entries = acl.entries.filter(e => e.principal.toLowerCase() !== username.toLowerCase());
            }
        }

        // Close any open properties dialog for this user
        if (window.windowsManager && window.windowsManager.closeModal) {
            window.windowsManager.closeModal(`modal-user-${username}`);
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4726, "Warning", this.state.server.currentUser, "User Account Deleted", `A user account was deleted: Account Name: ${username}, SID: ${user.sid}.`);
        this.notify('users');
        this.notify('groups');
        this.notify('permissions');
        return { success: true };
    }

    toggleUserDisabled(username, disabledState) {
        const user = this.state.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());
        if (!user) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4725, "Failure Audit", this.state.server.currentUser, "User Status Change Failed", `Failed to change status of user '${username}'. The specified account could not be found.`);
            return { success: false, error: "The specified account could not be found." };
        }

        if (user.username === "Administrator" && disabledState) {
            return { success: false, error: "Cannot disable the primary Administrator account." };
        }

        user.disabled = disabledState !== undefined ? disabledState : !user.disabled;
        const eventId = user.disabled ? 4725 : 4722;
        const action = user.disabled ? "User Account Disabled" : "User Account Enabled";

        this.logAudit("Microsoft-Windows-Security-Auditing", eventId, "Warning", this.state.server.currentUser, action, `User account '${username}' status changed to ${user.disabled ? 'Disabled' : 'Enabled'}.`);
        this.notify('users');
        return { success: true, disabled: user.disabled };
    }

    updateUser(username, changes) {
        const user = this.state.users.find(u => u.username.toLowerCase() === username.toLowerCase());
        if (!user) return { success: false, error: `The user '${username}' was not found.` };

        if (changes.fullName !== undefined) user.fullName = changes.fullName;
        if (changes.description !== undefined) user.description = changes.description;
        if (changes.password !== undefined) user.password = changes.password;
        if (changes.cannotChangePassword !== undefined) user.cannotChangePassword = changes.cannotChangePassword;
        if (changes.passwordNeverExpires !== undefined) user.passwordNeverExpires = changes.passwordNeverExpires;
        if (changes.disabled !== undefined) {
            this.toggleUserDisabled(username, changes.disabled);
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4738, "Information", this.state.server.currentUser, "User Account Modified", `User account '${username}' attributes updated.`);
        this.notify('users');
        return { success: true, user };
    }

    renameUser(oldUsername, newUsername) {
        const user = this.state.users.find(u => u.username.toLowerCase() === oldUsername.toLowerCase());
        if (!user) return { success: false, error: `User '${oldUsername}' not found.` };
        if (user.builtIn) return { success: false, error: "Cannot rename built-in accounts." };
        newUsername = (newUsername || "").trim();
        if (!newUsername) return { success: false, error: "New user name cannot be empty." };
        if (this.state.users.some(u => u.username.toLowerCase() === newUsername.toLowerCase())) {
            return { success: false, error: `The user name '${newUsername}' already exists.` };
        }

        user.username = newUsername;

        // Update group memberships
        for (const g of this.state.groups) {
            const idx = g.members.findIndex(m => m.toLowerCase() === oldUsername.toLowerCase());
            if (idx !== -1) g.members[idx] = newUsername;
        }

        // Update roles
        for (const r of this.state.roles) {
            if (r.assignedUser && r.assignedUser.toLowerCase() === oldUsername.toLowerCase()) {
                r.assignedUser = newUsername;
            }
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4781, "Information", this.state.server.currentUser, "User Account Renamed", `User account '${oldUsername}' renamed to '${newUsername}'.`);
        this.notify('users');
        this.notify('groups');
        return { success: true };
    }

    // --- GROUPS MANAGEMENT ---
    createGroup(groupData) {
        if (!this.state.vm.installed) {
            return { success: false, error: "Action cannot be completed. Windows Server is not installed." };
        }

        const groupName = (groupData.name || "").trim();
        if (!groupName) return { success: false, error: "Group name cannot be empty." };

        // Check duplicate (Requirement 4.B)
        if (this.state.groups.some(g => g.name.toLowerCase() === groupName.toLowerCase())) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4727, "Failure Audit", this.state.server.currentUser, "Security Group Creation Failed", `Failed to create security group '${groupName}'. The group already exists.`);
            return { success: false, error: "The group already exists." };
        }

        const newGroup = {
            name: groupName,
            description: groupData.description || "",
            members: groupData.members ? [...groupData.members] : [],
            builtIn: false,
            sid: `S-1-5-21-3829104-${2000 + this.state.groups.length + 1}`
        };

        this.state.groups.push(newGroup);

        this.logAudit("Microsoft-Windows-Security-Auditing", 4727, "Information", this.state.server.currentUser, "Security Group Created", `A security-enabled local group was created: Group Name: ${groupName}.`);
        this.notify('groups');
        return { success: true, group: newGroup };
    }

    deleteGroup(groupName) {
        if (!groupName) return { success: false, error: "The specified group could not be found." };
        const index = this.state.groups.findIndex(g => g.name.toLowerCase() === groupName.toLowerCase());
        if (index === -1) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4730, "Failure Audit", this.state.server.currentUser, "Security Group Deletion Failed", `Failed to delete group '${groupName}'. The specified group could not be found.`);
            return { success: false, error: "The specified group could not be found." };
        }

        const group = this.state.groups[index];
        if (group.builtIn) {
            return { success: false, error: `Cannot delete built-in group '${groupName}'.` };
        }

        // ALLOW DELETION EVEN IF GROUP HAS MEMBERS (Requirement 4.F)
        // Group disappears, memberships removed, and permissions assigned to group stop providing access.
        this.state.groups.splice(index, 1);

        // Clean up permissions referring to this group so it no longer grants access
        for (const resPath in this.state.permissions) {
            const acl = this.state.permissions[resPath];
            if (acl && acl.entries) {
                acl.entries = acl.entries.filter(e => e.principal.toLowerCase() !== groupName.toLowerCase());
            }
        }

        // Clean up roles mapping referencing this group
        this.state.roles = this.state.roles.filter(r => r.securityGroup.toLowerCase() !== groupName.toLowerCase());

        // Close any open properties dialog for this group
        if (window.windowsManager && window.windowsManager.closeModal) {
            window.windowsManager.closeModal(`modal-group-${groupName}`);
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4730, "Warning", this.state.server.currentUser, "Security Group Deleted", `A security-enabled local group was deleted: Group Name: ${groupName}, SID: ${group.sid}.`);
        this.notify('groups');
        this.notify('permissions');
        this.notify('roles');
        return { success: true };
    }

    addUserToGroup(username, groupName) {
        if (!this.state.vm.installed) {
            return { success: false, error: "Action cannot be completed. Windows Server is not installed." };
        }

        const user = this.state.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());
        // Requirement 4.C: Add nonexistent user produces realistic error
        if (!user) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4728, "Failure Audit", this.state.server.currentUser, "Add Member Failed", `Failed to add member to '${groupName}'. The specified account '${username}' could not be found.`);
            return { success: false, error: "The specified account could not be found." };
        }

        const group = this.state.groups.find(g => g.name.toLowerCase() === (groupName || '').toLowerCase());
        if (!group) return { success: false, error: `The specified security group '${groupName}' does not exist.` };

        if (group.members.some(m => m.toLowerCase() === user.username.toLowerCase())) {
            return { success: false, error: `User '${user.username}' is already a member of '${group.name}'.` };
        }

        group.members.push(user.username);

        this.logAudit("Microsoft-Windows-Security-Auditing", 4728, "Information", this.state.server.currentUser, "Member Added to Group", `A member was added to a security-enabled local group. Member: ${user.username}, Target Group: ${group.name}.`);
        this.notify('groups');
        return { success: true };
    }

    removeUserFromGroup(username, groupName) {
        const group = this.state.groups.find(g => g.name.toLowerCase() === (groupName || '').toLowerCase());
        if (!group) return { success: false, error: `Group '${groupName}' not found.` };

        if (group.name === "Administrators" && username === "Administrator") {
            return { success: false, error: "Cannot remove primary Administrator from the Administrators group." };
        }

        const initialLength = group.members.length;
        group.members = group.members.filter(m => m.toLowerCase() !== username.toLowerCase());

        if (group.members.length === initialLength) {
            return { success: false, error: `User '${username}' is not a member of '${groupName}'.` };
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4729, "Information", this.state.server.currentUser, "Member Removed from Group", `A member was removed from a security-enabled local group. Member: ${username}, Target Group: ${groupName}.`);
        this.notify('groups');
        return { success: true };
    }

    getUserGroups(username) {
        return this.state.groups.filter(g => g.members.some(m => m.toLowerCase() === username.toLowerCase()));
    }

    // --- ORGANIZATIONAL ROLES ---
    assignRole(roleData) {
        const existingIndex = this.state.roles.findIndex(r =>
            (roleData.assignedUser && r.assignedUser.toLowerCase() === roleData.assignedUser.toLowerCase()) ||
            r.roleName.toLowerCase() === roleData.roleName.toLowerCase()
        );
        const newRole = {
            id: roleData.id || (existingIndex >= 0 ? this.state.roles[existingIndex].id : `role_${Date.now()}`),
            roleName: roleData.roleName,
            assignedUser: roleData.assignedUser,
            securityGroup: roleData.securityGroup,
            resource: roleData.resource || "C:\\FinanceData",
            permissions: roleData.permissions || "Modify",
            description: roleData.description || ""
        };

        if (existingIndex >= 0) {
            this.state.roles[existingIndex] = newRole;
        } else {
            this.state.roles.push(newRole);
        }

        // Notice: We do NOT automatically add the user to the security group here.
        // The administrator must consciously establish group membership (Requirement 1 & 5).

        this.logAudit("Role-Based Access Control", 5001, "Information", this.state.server.currentUser, "Role Assigned", `Organizational Role '${newRole.roleName}' mapped to user '${newRole.assignedUser}' and security group '${newRole.securityGroup}'.`);
        this.notify('roles');
        return { success: true, role: newRole };
    }

    removeRole(roleId) {
        const index = this.state.roles.findIndex(r => r.id === roleId);
        if (index === -1) return { success: false, error: "Role not found." };
        const removed = this.state.roles.splice(index, 1)[0];
        this.logAudit("Role-Based Access Control", 5002, "Information", this.state.server.currentUser, "Role Removed", `Organizational Role '${removed.roleName}' unassigned.`);
        this.notify('roles');
        return { success: true };
    }

    unassignUserRole(username) {
        const initialLen = this.state.roles.length;
        const removed = this.state.roles.filter(r => r.assignedUser.toLowerCase() === username.toLowerCase());
        this.state.roles = this.state.roles.filter(r => r.assignedUser.toLowerCase() !== username.toLowerCase());
        if (this.state.roles.length !== initialLen) {
            this.logAudit("Role-Based Access Control", 5002, "Information", this.state.server.currentUser, "Role Removed", `Organizational Role unassigned from user '${username}'.`);
            this.notify('roles');
            return { success: true, removed };
        }
        return { success: false, error: "No role assigned to user." };
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
        if (this.state && this.state.resources) {
            if (this.state.resources[norm]) return norm;
            const normLower = norm.toLowerCase();
            for (const key of Object.keys(this.state.resources)) {
                if (key.toLowerCase() === normLower) {
                    return key;
                }
            }
        }
        return norm;
    }

    // --- RESOURCES & FOLDERS ---
    createFolder(parentPath, folderName) {
        if (!this.state.vm.installed) {
            return { success: false, error: "Action cannot be completed. Windows Server is not installed." };
        }

        parentPath = this.normalizePath(parentPath);
        if (!this.state.resources[parentPath]) {
            parentPath = "C:\\";
        }

        const fullPath = parentPath === 'C:\\' ? `C:\\${folderName}` : `${parentPath}\\${folderName}`;
        if (this.state.resources[fullPath]) {
            return { success: false, error: `Folder '${folderName}' already exists at this location.` };
        }

        this.state.resources[fullPath] = {
            name: folderName,
            path: fullPath,
            type: "folder",
            parent: parentPath,
            created: new Date().toISOString().replace('T', ' ').substring(0, 19),
            items: []
        };

        // Add to parent items
        if (this.state.resources[parentPath]) {
            if (!this.state.resources[parentPath].items.includes(folderName)) {
                this.state.resources[parentPath].items.push(folderName);
            }
        }

        // Initialize default ACL for folder
        this.state.permissions[fullPath] = {
            owner: "Administrators",
            inheritance: false,
            entries: [
                { principal: "Administrators", type: "Allow", rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"] },
                { principal: "SYSTEM", type: "Allow", rights: ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write"] },
                { principal: "Users", type: "Allow", rights: ["ReadExecute", "ListFolder", "Read"] }
            ]
        };

        // If creating FinanceData, seed standard classroom files so students can test reading & editing
        if (folderName.toLowerCase() === 'financedata') {
            this.state.resources[fullPath].items = ["Budget.xlsx", "FinancialReport.docx", "Payroll.xlsx"];
            this.state.resources[`${fullPath}\\Budget.xlsx`] = {
                name: "Budget.xlsx",
                path: `${fullPath}\\Budget.xlsx`,
                type: "file",
                size: "24.5 KB",
                content: "Q4 Operating Budget Spreadsheet\n\nDepartment: Finance\nTotal Budget: $1,250,000\nAllocated OPEX: $820,000\nAllocated CAPEX: $430,000\nStatus: Approved by CFO",
                parent: fullPath
            };
            this.state.resources[`${fullPath}\\FinancialReport.docx`] = {
                name: "FinancialReport.docx",
                path: `${fullPath}\\FinancialReport.docx`,
                type: "file",
                size: "18.2 KB",
                content: "CONFIDENTIAL FINANCIAL REPORT - Q3/Q4\n\nExecutive Summary:\nQuarterly revenue increased by 14.2% year-over-year. Operating margins held steady at 22.8%.\nAll audit compliance measures satisfy SOX compliance standards.\nPrepared by: John Doe (Financial Analyst)",
                parent: fullPath
            };
            this.state.resources[`${fullPath}\\Payroll.xlsx`] = {
                name: "Payroll.xlsx",
                path: `${fullPath}\\Payroll.xlsx`,
                type: "file",
                size: "52.1 KB",
                content: "MONTHLY DEPARTMENTAL PAYROLL REGISTER\n\nEmp ID | Name           | Position           | Gross Pay | Net Pay\n-----------------------------------------------------------------\nE-1001 | John Doe       | Financial Analyst  | $7,500.00 | $5,625.00\nE-1002 | Sarah Jenkins  | Senior Accountant  | $8,200.00 | $6,150.00\nE-1003 | David Miller   | Controller         | $11,500.00| $8,625.00",
                parent: fullPath
            };
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4656, "Information", this.state.server.currentUser, "Object Created", `File system object created: Path: ${fullPath}, Owner: Administrators.`);
        this.notify('resources');
        return { success: true, path: fullPath };
    }

    createFile(parentPath, fileName, content = "") {
        parentPath = this.normalizePath(parentPath);
        if (!this.state.resources[parentPath]) {
            parentPath = "C:\\";
        }
        const fullPath = parentPath === 'C:\\' ? `C:\\${fileName}` : `${parentPath}\\${fileName}`;
        if (this.state.resources[fullPath]) {
            return { success: false, error: `File '${fileName}' already exists.` };
        }

        this.state.resources[fullPath] = {
            name: fileName,
            path: fullPath,
            type: "file",
            size: "1.2 KB",
            content: content || "Sample text file created by administrator.",
            parent: parentPath
        };

        if (this.state.resources[parentPath]) {
            if (!this.state.resources[parentPath].items.includes(fileName)) {
                this.state.resources[parentPath].items.push(fileName);
            }
        }

        this.logAudit("Microsoft-Windows-Security-Auditing", 4656, "Information", this.state.server.currentUser, "File Created", `File created: ${fullPath}`);
        this.notify('resources');
        return { success: true, path: fullPath };
    }

    deleteResource(resourcePath) {
        resourcePath = this.normalizePath(resourcePath);
        const res = this.state.resources[resourcePath];
        if (!res) return { success: false, error: "Resource not found." };
        if (resourcePath === "C:\\") return { success: false, error: "Cannot delete root drive." };

        // Remove from parent
        if (res.parent && this.state.resources[res.parent]) {
            this.state.resources[res.parent].items = this.state.resources[res.parent].items.filter(item => item !== res.name);
        }

        delete this.state.resources[resourcePath];
        delete this.state.permissions[resourcePath];

        this.logAudit("Microsoft-Windows-Security-Auditing", 4660, "Warning", this.state.server.currentUser, "Object Deleted", `File system object deleted: ${resourcePath}`);
        this.notify('resources');
        return { success: true };
    }

    // --- PERMISSIONS / ACL ---
    updateResourceACL(resourcePath, aclData) {
        resourcePath = this.normalizePath(resourcePath);
        if (!this.state.resources[resourcePath]) {
            return { success: false, error: `Cannot assign permissions. The target folder '${resourcePath}' does not exist.` };
        }

        if (!this.state.permissions[resourcePath]) {
            this.state.permissions[resourcePath] = {
                owner: "Administrators",
                inheritance: false,
                entries: []
            };
        }

        if (aclData.owner) this.state.permissions[resourcePath].owner = aclData.owner;
        if (aclData.inheritance !== undefined) this.state.permissions[resourcePath].inheritance = aclData.inheritance;
        if (aclData.entries) this.state.permissions[resourcePath].entries = aclData.entries;

        this.logAudit("Microsoft-Windows-Security-Auditing", 4670, "Information", this.state.server.currentUser, "Permissions Modified", `Permissions on object '${resourcePath}' were modified.`);
        this.notify('permissions');
        return { success: true };
    }

    // --- PERMISSION ENGINE (Real NTFS evaluation logic) ---
    evaluateAccess(username, resourcePath, requestedAction) {
        resourcePath = this.normalizePath(resourcePath);
        const user = this.state.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase());

        // 1. Check if user exists
        if (!user) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4625, "Failure Audit", username || "UNKNOWN", "Access Check", `An attempt was made to access '${resourcePath}'. Logon / Access Denied: User account '${username}' does not exist.`);
            return {
                granted: false,
                reason: "USER_NOT_FOUND",
                message: `The user account '${username}' does not exist on this computer.`,
                user: username,
                groups: [],
                effectivePermission: "None",
                auditStatus: "Failure"
            };
        }

        const userGroups = this.getUserGroups(username).map(g => g.name);

        // 2. Check if user is disabled
        if (user.disabled) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4625, "Failure Audit", username, "Access Check", `Access Denied to object '${resourcePath}'. The account '${username}' is currently disabled.`);
            return {
                granted: false,
                reason: "ACCOUNT_DISABLED",
                message: `ACCESS DENIED: The account '${username}' is disabled. Logon is not permitted.`,
                user: username,
                groups: userGroups,
                effectivePermission: "Account Disabled",
                auditStatus: "Failure"
            };
        }

        // 3. Check if resource exists
        const res = this.state.resources[resourcePath];
        if (!res && resourcePath !== 'C:\\') {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4656, "Failure Audit", username, "Access Check", `An attempt was made to access object '${resourcePath}'. Object Access Failed: The system cannot find the path specified.`);
            return {
                granted: false,
                reason: "RESOURCE_NOT_FOUND",
                message: `The system cannot find the path specified: '${resourcePath}'.`,
                user: username,
                groups: userGroups,
                effectivePermission: "None",
                auditStatus: "Failure"
            };
        }

        // Normalize requested action to standard rights
        // Actions: 'Read', 'List', 'Write', 'Create', 'Modify', 'Delete', 'FullControl'
        const rightsHierarchy = {
            "FullControl": ["FullControl", "Modify", "ReadExecute", "ListFolder", "Read", "Write", "Delete"],
            "Modify": ["Modify", "ReadExecute", "ListFolder", "Read", "Write", "Delete"],
            "Write": ["Write"],
            "ReadExecute": ["ReadExecute", "ListFolder", "Read"],
            "ListFolder": ["ListFolder"],
            "Read": ["Read", "ListFolder"],
            "Delete": ["Delete", "Modify", "FullControl"]
        };

        const actionMapping = {
            "Read": "Read",
            "List": "ListFolder",
            "Write": "Write",
            "Create": "Write",
            "Edit": "Modify",
            "Modify": "Modify",
            "Delete": "Modify",
            "FullControl": "FullControl"
        };

        const targetRight = actionMapping[requestedAction] || requestedAction;

        // Retrieve ACL
        const acl = this.state.permissions[resourcePath];
        if (!acl) {
            // Implicit grant for root or non-protected system dirs for admin
            if (userGroups.includes("Administrators")) {
                this.logAudit("Microsoft-Windows-Security-Auditing", 4663, "Success Audit", username, "Access Check", `Access Granted to '${resourcePath}' via Administrator privileges. Action: ${requestedAction}`);
                return {
                    granted: true,
                    reason: "ADMIN_OVERRIDE",
                    message: `ACCESS GRANTED to ${resourcePath} (Administrator privileges).`,
                    user: username,
                    groups: userGroups,
                    allowedBy: "Administrators",
                    effectivePermission: "Full Control",
                    auditStatus: "Success"
                };
            }
            this.logAudit("Microsoft-Windows-Security-Auditing", 4663, "Failure Audit", username, "Access Check", `Access Denied to object: ${resourcePath}. No permissions configured.`);
            return {
                granted: false,
                reason: "NO_ACL",
                message: `ACCESS DENIED: No permissions configured for '${username}' on ${resourcePath}.`,
                user: username,
                groups: userGroups,
                effectivePermission: "None",
                auditStatus: "Failure"
            };
        }

        // All principals applicable to this user
        const applicablePrincipals = [user.username, ...userGroups];

        // 1. Check for explicit DENY in any applicable principal (Deny takes precedence!)
        for (const entry of acl.entries) {
            if (applicablePrincipals.some(p => p.toLowerCase() === entry.principal.toLowerCase())) {
                if (entry.type === "Deny") {
                    // Check if the denied rights cover our target right or FullControl
                    const deniedRights = entry.rights || [];
                    if (deniedRights.includes("FullControl") || deniedRights.includes(targetRight)) {
                        this.logAudit("Microsoft-Windows-Security-Auditing", 4663, "Failure Audit", username, "Access Check", `An attempt was made to access an object. Access Denied (Explicit Deny on ${entry.principal}). Object: ${resourcePath}, Requested: ${requestedAction}`);
                        return {
                            granted: false,
                            reason: "EXPLICIT_DENY",
                            message: `ACCESS DENIED: Explicit Deny permission exists for '${entry.principal}' on ${resourcePath}.`,
                            user: username,
                            groups: userGroups,
                            deniedBy: entry.principal,
                            effectivePermission: "Explicit Deny",
                            auditStatus: "Failure"
                        };
                    }
                }
            }
        }

        // 2. Check for explicit ALLOW
        let matchedAllowPrincipals = [];
        let matchedRights = new Set();

        for (const entry of acl.entries) {
            if (applicablePrincipals.some(p => p.toLowerCase() === entry.principal.toLowerCase())) {
                if (entry.type === "Allow") {
                    for (const r of (entry.rights || [])) {
                        matchedRights.add(r);
                        if (rightsHierarchy[r]) {
                            rightsHierarchy[r].forEach(subRight => matchedRights.add(subRight));
                        }
                    }
                    matchedAllowPrincipals.push(entry.principal);
                }
            }
        }

        // Determine effective highest permission
        let effectivePermission = "None";
        if (matchedRights.has("FullControl")) effectivePermission = "Full Control";
        else if (matchedRights.has("Modify")) effectivePermission = "Modify";
        else if (matchedRights.has("Write")) effectivePermission = "Write";
        else if (matchedRights.has("ReadExecute")) effectivePermission = "Read & Execute";
        else if (matchedRights.has("Read")) effectivePermission = "Read";
        else if (matchedRights.has("ListFolder")) effectivePermission = "List folder contents";

        const hasRequiredRight = matchedRights.has(targetRight) || matchedRights.has("FullControl");

        if (hasRequiredRight) {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4663, "Success Audit", username, "Access Check", `Access Granted to object: ${resourcePath}. Principal: ${username}, Effective Permission: ${effectivePermission}, Action: ${requestedAction}`);
            return {
                granted: true,
                reason: "ALLOWED",
                message: `ACCESS GRANTED to ${resourcePath}`,
                user: username,
                groups: userGroups,
                allowedBy: matchedAllowPrincipals.join(", "),
                effectivePermission: effectivePermission,
                auditStatus: "Success"
            };
        } else {
            this.logAudit("Microsoft-Windows-Security-Auditing", 4663, "Failure Audit", username, "Access Check", `Access Denied to object: ${resourcePath}. Principal: ${username}, Required: ${requestedAction}, Effective: ${effectivePermission}`);
            return {
                granted: false,
                reason: "INSUFFICIENT_PERMISSIONS",
                message: `ACCESS DENIED: Insufficient permissions for '${username}' on ${resourcePath}.`,
                user: username,
                groups: userGroups,
                effectivePermission: effectivePermission,
                requiredRight: targetRight,
                auditStatus: "Failure"
            };
        }
    }

    // --- AUDIT LOGGING ---
    logAudit(source, eventId, level, user, task, details) {
        const now = new Date();
        const timeStr = now.toTimeString().substring(0, 8);
        const dateStr = now.toISOString().substring(0, 10);

        const event = {
            id: this.state.auditLog.length + 1,
            time: timeStr,
            date: dateStr,
            source: source,
            eventId: eventId,
            level: level,
            user: user,
            task: task,
            details: details
        };

        this.state.auditLog.unshift(event);
        if (this.state.auditLog.length > 500) {
            this.state.auditLog.pop();
        }

        this.notify('audit');
        return event;
    }

    clearAuditLog() {
        this.state.auditLog = [];
        this.logAudit("Microsoft-Windows-Security-Auditing", 1102, "Warning", this.state.server.currentUser, "Log Cleared", "The security audit log was cleared.");
        this.notify('audit');
    }

    // --- ROLES AND FEATURES (Server Manager & AD DS) ---
    getRoles() {
        return this.state.rolesAndFeatures?.roles || [];
    }

    getFeatures() {
        return this.state.rolesAndFeatures?.features || [];
    }

    isRoleInstalled(roleId) {
        const role = this.getRoles().find(r => r.id === roleId);
        return role ? !!role.installed : false;
    }

    isFeatureInstalled(featureId) {
        const feat = this.getFeatures().find(f => f.id === featureId);
        return feat ? !!feat.installed : false;
    }

    installRolesAndFeatures(roleIds = [], featureIds = []) {
        if (!this.state.rolesAndFeatures) {
            this.state.rolesAndFeatures = getDefaultRolesAndFeaturesState();
        }

        const installedNames = [];
        const isInstallingAdDs = roleIds.includes('ad-ds');

        // AD DS dependencies: GPMC, RSAT, and DNS
        if (isInstallingAdDs) {
            if (!featureIds.includes('gpmc')) featureIds.push('gpmc');
            if (!featureIds.includes('rsat-ad-tools')) featureIds.push('rsat-ad-tools');
            if (!roleIds.includes('dns')) roleIds.push('dns');
        }

        this.state.rolesAndFeatures.roles.forEach(role => {
            if (roleIds.includes(role.id) && !role.installed) {
                role.installed = true;
                installedNames.push(role.name);
            }
        });

        this.state.rolesAndFeatures.features.forEach(feat => {
            if (featureIds.includes(feat.id) && !feat.installed) {
                feat.installed = true;
                installedNames.push(feat.name);
            }
        });

        if (isInstallingAdDs && !this.state.rolesAndFeatures.domainController?.promoted) {
            const existingNotif = this.state.rolesAndFeatures.notifications.find(n => n.id === 'notif_ad_ds_post_config');
            if (!existingNotif) {
                this.state.rolesAndFeatures.notifications.unshift({
                    id: 'notif_ad_ds_post_config',
                    title: 'Post-deployment Configuration',
                    severity: 'warning',
                    server: 'WIN-SERVER',
                    role: 'Active Directory Domain Services',
                    message: 'Configuration required for Active Directory Domain Services at WIN-SERVER',
                    actionLabel: 'Promote this server to a domain controller',
                    action: 'promote-dc'
                });
            }

            if (!this.state.resources['C:\\Windows\\NTDS']) {
                this.state.resources['C:\\Windows\\NTDS'] = {
                    name: 'NTDS',
                    path: 'C:\\Windows\\NTDS',
                    type: 'folder',
                    parent: 'C:\\Windows',
                    owner: 'SYSTEM',
                    items: ['ntds.dit', 'edb.log', 'edb.chk']
                };
            }
            if (!this.state.resources['C:\\Windows\\SYSVOL']) {
                this.state.resources['C:\\Windows\\SYSVOL'] = {
                    name: 'SYSVOL',
                    path: 'C:\\Windows\\SYSVOL',
                    type: 'folder',
                    parent: 'C:\\Windows',
                    owner: 'Administrators',
                    items: ['domain', 'staging']
                };
            }
        }

        this.logAudit("Microsoft-Windows-ServerManager-Deployment", 1000, "Information", this.state.server.currentUser || "Administrator", "Feature Installation", `Feature installation succeeded on WIN-SERVER: ${installedNames.join(', ')}.`);

        this.notify('roles');
        this.notify('server');
        return { success: true, installedCount: installedNames.length, installedNames };
    }

    uninstallRolesAndFeatures(roleIds = [], featureIds = []) {
        if (!this.state.rolesAndFeatures) return { success: false, error: "No roles installed." };

        const removedNames = [];

        this.state.rolesAndFeatures.roles.forEach(role => {
            if (roleIds.includes(role.id) && role.installed) {
                if (role.id === 'file-storage') return;
                role.installed = false;
                removedNames.push(role.name);
            }
        });

        this.state.rolesAndFeatures.features.forEach(feat => {
            if (featureIds.includes(feat.id) && feat.installed) {
                if (feat.id === 'powershell' || feat.id === 'windows-defender') return;
                feat.installed = false;
                removedNames.push(feat.name);
            }
        });

        if (roleIds.includes('ad-ds')) {
            this.state.rolesAndFeatures.notifications = this.state.rolesAndFeatures.notifications.filter(n => n.id !== 'notif_ad_ds_post_config');
            if (this.state.rolesAndFeatures.domainController?.promoted) {
                this.state.rolesAndFeatures.domainController.promoted = false;
                this.state.rolesAndFeatures.domainController.forestName = '';
                this.state.rolesAndFeatures.domainController.netbiosName = '';
                this.state.server.domain = 'WORKGROUP';
            }
        }

        this.logAudit("Microsoft-Windows-ServerManager-Deployment", 1001, "Information", this.state.server.currentUser || "Administrator", "Feature Removal", `Roles/features removed from WIN-SERVER: ${removedNames.join(', ')}.`);

        this.notify('roles');
        this.notify('server');
        return { success: true, removedCount: removedNames.length, removedNames };
    }

    promoteToDomainController(config = {}) {
        if (!this.state.rolesAndFeatures) {
            this.state.rolesAndFeatures = getDefaultRolesAndFeaturesState();
        }

        const forest = config.forestName || 'corp.contoso.com';
        const netbios = config.netbiosName || forest.split('.')[0].toUpperCase();

        this.state.rolesAndFeatures.domainController = {
            promoted: true,
            forestName: forest.toLowerCase(),
            netbiosName: netbios,
            domainMode: 'Windows Server 2022',
            forestMode: 'Windows Server 2022',
            promotedDate: new Date().toISOString()
        };

        this.state.server.domain = forest.toUpperCase();
        this.state.rolesAndFeatures.notifications = this.state.rolesAndFeatures.notifications.filter(n => n.id !== 'notif_ad_ds_post_config');

        // Add Active Directory standard groups
        const standardAdGroups = [
            { name: "Domain Admins", description: "Designated administrators of the domain", members: ["Administrator"], builtIn: true, sid: "S-1-5-21-3829104-512" },
            { name: "Domain Users", description: "All domain users", members: ["Administrator", "Guest", "krbtgt", "jdoe"], builtIn: true, sid: "S-1-5-21-3829104-513" },
            { name: "Enterprise Admins", description: "Designated administrators of the enterprise", members: ["Administrator"], builtIn: true, sid: "S-1-5-21-3829104-519" },
            { name: "Schema Admins", description: "Designated administrators of the schema", members: ["Administrator"], builtIn: true, sid: "S-1-5-21-3829104-518" },
            { name: "Group Policy Creator Owners", description: "Members in this group can modify group policy for the domain", members: ["Administrator"], builtIn: true, sid: "S-1-5-21-3829104-520" }
        ];

        standardAdGroups.forEach(adg => {
            if (!this.state.groups.some(g => g.name === adg.name)) {
                this.state.groups.push(adg);
            }
        });

        if (!this.state.users.some(u => u.username.toLowerCase() === 'krbtgt')) {
            this.state.users.push({
                username: "krbtgt",
                fullName: "Key Distribution Center Service Account",
                description: "Key Distribution Center Service Account",
                password: "",
                mustChangePassword: false,
                cannotChangePassword: true,
                passwordNeverExpires: true,
                disabled: true,
                builtIn: true,
                sid: "S-1-5-21-3829104-502"
            });
        }

        this.logAudit("Microsoft-Windows-ActiveDirectory_DomainService", 1000, "Information", "NT AUTHORITY\\SYSTEM", "Active Directory Promotion", `The Active Directory Domain Services directory database NTDS.DIT and SYSVOL initialized successfully. WIN-SERVER promoted to primary domain controller for domain ${forest.toUpperCase()}.`);
        this.logAudit("Microsoft-Windows-Security-Auditing", 4624, "Success Audit", "Administrator", "Domain Logon", `Account logged on with domain credentials. Domain: ${netbios}, Account Name: Administrator.`);

        this.notify('roles');
        this.notify('server');
        this.notify('users');
        this.notify('groups');
        return { success: true, forestName: forest, netbiosName: netbios };
    }

    getNotifications() {
        return this.state.rolesAndFeatures?.notifications || [];
    }

    dismissNotification(id) {
        if (!this.state.rolesAndFeatures) return;
        this.state.rolesAndFeatures.notifications = this.state.rolesAndFeatures.notifications.filter(n => n.id !== id);
        this.notify('roles');
    }

    // --- SCENARIO STEP TRACKING ---
    setScenarioStep(stepNumber) {
        this.state.activeScenarioStep = stepNumber;
        this.notify('scenario');
    }

    // --- DEMO STATE (Single Source of Truth) ---
    getDemoState() {
        const vm = this.state.vm;
        const hasVm = !!vm.created;
        const vmConfigured = hasVm && (vm.ram >= 4096 || vm.processors >= 2);
        const windowsInstalled = !!vm.installed;

        const jdoeUser = this.state.users.find(u => u.username.toLowerCase() === 'jdoe');
        const jdoeExists = !!jdoeUser;
        const financeGroup = this.state.groups.find(g => g.name === 'GRP_Finance');
        const financeGroupExists = !!financeGroup;
        const jdoeInFinance = financeGroupExists && financeGroup.members.some(m => m.toLowerCase() === 'jdoe');

        const roleDocumented = (this.state.roles && this.state.roles.some(r => r.assignedUser && r.assignedUser.toLowerCase() === 'jdoe' && r.roleName.toLowerCase().includes('financial'))) ||
            (jdoeExists && jdoeUser.description && jdoeUser.description.toLowerCase().includes('financial'));

        const financeFolderExists = !!this.state.resources['C:\\FinanceData'];

        const financeAcl = this.state.permissions['C:\\FinanceData'];
        const financePermAssigned = financeFolderExists && !!financeAcl && !!financeAcl.entries && financeAcl.entries.some(e => e.principal === 'GRP_Finance');

        const accessTestPassed = this.state.auditLog.some(e =>
            e.task === "Access Check" && e.details && e.details.includes("Access Granted") && (e.user === "jdoe" || e.details.includes("jdoe"))
        );
        const unauthorizedAccessTested = this.state.auditLog.some(e =>
            e.task === "Access Check" && (e.details && (e.details.includes("Access Denied") || e.details.includes("Insufficient")))
        );

        const jdoeDisabled = jdoeExists && !!jdoeUser.disabled;
        const jdoeDeleted = !jdoeExists && this.state.auditLog.some(e => e.task === "User Account Deleted" && e.details && e.details.includes("jdoe"));
        const financeGroupDeleted = !financeGroupExists && this.state.auditLog.some(e => e.task === "Security Group Deleted" && e.details && e.details.includes("GRP_Finance"));

        const isSandbox = (this.state.simulationMode === 'sandbox');
        const currentStepTitle = isSandbox ? "Interactive Sandbox" : "Demonstration Ready";

        const steps = [
            { num: 1, title: "Create Virtual Machine", desc: "Create VM (WinServer2022, 4096 MB RAM, 2 CPUs, 50 GB VDI disk).", tool: "VirtualBox New Machine Wizard", completed: hasVm, locked: false },
            { num: 2, title: "Configure VM Settings", desc: "Verify system resources and storage controller with Windows Server 2022 ISO.", tool: "VirtualBox Settings", completed: vmConfigured, locked: false },
            { num: 3, title: "Start VM & Boot Setup", desc: "Power on the VM and boot from virtual optical drive.", tool: "VirtualBox Execution Window", completed: vm.status === 'running', locked: false },
            { num: 4, title: "Complete Windows Setup", desc: "Install Windows Server 2022 Datacenter Evaluation (Desktop Experience).", tool: "Windows Setup", completed: windowsInstalled, locked: false },
            { num: 5, title: "Sign In to Windows Server", desc: "Interactive logon with Administrator account credentials.", tool: "Windows Server Desktop", completed: windowsInstalled, locked: false },
            { num: 6, title: "Create User Account", desc: "Create local user account in SAM database (e.g. jdoe / John Doe).", tool: "Computer Management → Users", completed: jdoeExists || jdoeDeleted, locked: false },
            { num: 7, title: "Create Security Group", desc: "Create departmental Windows security group (e.g. GRP_Finance).", tool: "Computer Management → Groups", completed: financeGroupExists || financeGroupDeleted, locked: false },
            { num: 8, title: "Add User to Security Group", desc: "Add user as member of security group to establish authorization boundary.", tool: "Group Properties / Member Of", completed: jdoeInFinance || jdoeDeleted, locked: false },
            { num: 9, title: "Document Organizational Role (RBAC)", desc: "Examine distinction between business roles and Windows security groups.", tool: "Organizational Roles (RBAC)", completed: roleDocumented, locked: false },
            { num: 10, title: "Create Protected Folder", desc: "Create folder structure in file system (e.g. C:\\FinanceData).", tool: "File Explorer", completed: financeFolderExists, locked: false },
            { num: 11, title: "Configure NTFS Permissions (ACL)", desc: "Assign Modify or Read permissions to security group on folder DACL.", tool: "Folder Properties → Security", completed: financePermAssigned, locked: false },
            { num: 12, title: "Test Authorized Access", desc: "Verify that user inheriting group permission is granted access.", tool: "Security Test (SecurityTest.exe)", completed: accessTestPassed, locked: false },
            { num: 13, title: "Test Unauthorized Access", desc: "Verify that user without permissions receives Access Denied.", tool: "Security Test / File Explorer", completed: unauthorizedAccessTested, locked: false },
            { num: 14, title: "Disable User Account", desc: "Observe consequences of account disabling: immediate logon rejection.", tool: "User Properties / Security Test", completed: jdoeDisabled, locked: false },
            { num: 15, title: "Delete Accounts & Clean Up", desc: "Demonstrate that deleting group removes permissions while preserving accounts.", tool: "Computer Management", completed: jdoeDeleted || financeGroupDeleted, locked: false }
        ];

        return {
            simulationMode: this.state.simulationMode,
            currentStepTitle,
            currentStep: isSandbox ? 1 : 12,
            steps,
            vmCreated: hasVm,
            vmConfigured,
            windowsInstalled,
            jdoeCreated: jdoeExists || jdoeDeleted,
            jdoeExists,
            financeGroupCreated: financeGroupExists || financeGroupDeleted,
            financeGroupExists,
            roleDocumented,
            jdoeAddedToFinanceGroup: jdoeInFinance || jdoeDeleted,
            financeFolderCreated: financeFolderExists,
            financePermissionAssigned: financePermAssigned,
            accessTestPassed,
            unauthorizedAccessTested,
            jdoeDisabled,
            jdoeDeleted,
            financeGroupDeleted
        };
    }
}

// Global instance exported to window
window.systemState = new StateStore();
