# System Administration Simulator (Windows Server 2022 & VirtualBox)

A high-fidelity, functional web-based **System Administration Simulator** designed for classroom demonstrations, laboratory reports, and technical presentations.

---

## 🚀 Quick Start Instructions

1. **Direct Browser Execution**:
   Simply open `index.html` in any modern web browser (Google Chrome, Microsoft Edge, Mozilla Firefox). No installation, backend, or build step is required!

2. **Or Run via Local Static Server**:
   ```bash
   # Using Python 3:
   python -m http.server 8080

   # Or using Node.js:
   npx serve .
   ```
   Navigate to `http://localhost:8080` in your browser.

---

## 🎯 Master Classroom Demonstration Workflow (15 Steps)

Follow this exact workflow during your report or presentation. You can also click the **"📋 Scenario Guide"** button in the top bar inside the simulator at any time to navigate or jump between steps:

| Step | Action | How to Perform in the Simulator | Result |
|---|---|---|---|
| **1** | **Create VM** | In VirtualBox Manager, click **"New"** on the toolbar. Keep default name `WinServer2022`, 4096 MB RAM, 2 CPUs, 50 GB VDI dynamically allocated. Select `Windows_Server_2022.iso`. Click **Finish**. | `WinServer2022` appears in the left VM list in `Powered Off` state. Details pane updates. |
| **2** | **VM Settings** | Click **"Settings"** on the toolbar. View the **Storage** tab to verify `Windows_Server_2022.iso` is mounted to the IDE controller. | Base memory, processors, and ISO mounting can be adjusted. |
| **3** | **Start VM & Boot** | Click **"Start"** on the toolbar. | VM Window opens (`WinServer2022 [Running] - Oracle VM VirtualBox`). Simulated BIOS boots from the Windows Server 2022 ISO. |
| **4** | **Windows Setup** | Click **Next** → **Install now** → Select **Windows Server 2022 Datacenter Evaluation (Desktop Experience)** → Accept License → Select **Custom** → Select Drive 0 (50 GB) → **Next**. | Setup completes installation progress. Set Administrator password (default: `Password123!`). |
| **5** | **Logon to Desktop** | Click on the Lock Screen or select `Input → Insert Ctrl+Alt+Del`. Enter password and sign in. | Windows Server 2022 Desktop loads with taskbar, Start Menu, shortcuts, watermark, and automatic Server Manager startup. |
| **6** | **Open Computer Management** | Double-click **Computer Management** on the desktop (or Start Menu → Administrative Tools → Computer Management). | MMC 3-pane layout opens (`compmgmt.msc`). |
| **7** | **Create User `jdoe`** | Navigate to `System Tools → Local Users and Groups → Users`. Right-click empty area → **New User...** Fill `jdoe`, `John Doe`, `Financial Analyst`, Password `User@12345`. Click **Create**. | Account `jdoe` created in SAM database and added to `Users` group. |
| **8** | **Create Group `GRP_Finance`** | Navigate to `Local Users and Groups → Groups`. Right-click → **New Group...** Fill `GRP_Finance`, Description `Finance Department Users`. Click **Create**. | `GRP_Finance` appears in the Groups list. |
| **9** | **Add `jdoe` to `GRP_Finance`** | Double-click `GRP_Finance` → click **Add...** → select `jdoe` → **OK**. Or open `jdoe` Properties → Member Of → Add `GRP_Finance`. | Membership relationship synchronized across the entire system. |
| **10** | **Assign Organizational Role** | Double-click desktop shortcut **Organizational Roles (RBAC)**. Map `Financial Analyst` to `jdoe`, `GRP_Finance`, and `C:\FinanceData` with `Modify` permissions. | Clearly demonstrates the distinction between job roles and Windows security groups. |
| **11** | **Create Protected Folder** | Open **File Explorer** → `Local Disk (C:)`. Click **New Folder** and name it `FinanceData`. | Folder created at `C:\FinanceData` with default files. |
| **12** | **Configure NTFS Permissions** | Right-click `FinanceData` → **Properties** → **Security** tab. Select or add `GRP_Finance` and check **Modify** under Allow. Click **OK**. (Explore **Advanced** → **Effective Access** tab to view evaluated rights). | NTFS Access Control List (ACL) updated in state. |
| **13** | **Test Authorized Access (`jdoe`)** | Open **Security Test** utility. Select user `jdoe`, action `Modify`, resource `C:\FinanceData`. Click **Test Access**. | **ACCESS GRANTED** (`GRP_Finance` grants Modify). |
| **14** | **Test Unauthorized Access (`mwilson`)** | Select user `mwilson` (Marketing), action `Modify`. Click **Test Access**. | **ACCESS DENIED** (Explicit Deny / No Access). In File Explorer, testing file operations as `mwilson` triggers a genuine Windows "Access is denied" modal. |
| **15** | **Disable & Delete Accounts** | In Computer Management, right-click `jdoe` → **Disable Account**. Retest access in Security Test → **ACCOUNT DISABLED**. Finally right-click `jdoe` → **Delete** (cleans account), and right-click `GRP_Finance` → **Delete** (demonstrates that deleting a group cleans group permissions while preserving users). |

---

## 🛠️ Included Simulation Tools & Features

- **Oracle VM VirtualBox Manager**:
  - Top menu (File, Machine, Help), toolbar (New, Settings, Start, Discard), and collapsible VM details accordion.
  - Multi-tab VM Settings (System, Storage with IDE/SATA controllers, ISO mount/unmount).
  - VM Execution window with VirtualBox titlebar, menu (Input → Ctrl+Alt+Del), and bottom status LEDs.
- **Windows Server 2022 Installation & Desktop**:
  - Full authentic Windows Setup workflow with OS edition table, custom disk partition, progress checklist, and initial administrator password configuration.
  - Desktop with Segoe UI typography, taskbar, start menu, system tray with real-time clock, and draggable/minimizable/maximizable windows.
  - Server Manager dashboard with Local Server properties.
- **Computer Management (`compmgmt.msc`)**:
  - 3-pane MMC snap-in with collapsible tree, context menus, and action pane.
  - **Local Users**: Create, edit properties (General, Member Of, Profile), set password, disable (with visual overlay badge), and delete with SID warning.
  - **Local Groups**: Create, edit members (with object selector picker), and delete with ACL cleanup.
  - **Disk Management**: Volume summary and graphical partition layout.
- **Event Viewer (`eventvwr.msc`)**:
  - Security audit log with authentic Event IDs (4720, 4726, 4722, 4725, 4728, 4729, 4730, 4663, 4624, 4625).
  - Detailed preview pane, clear log, and CSV export.
- **File Explorer & NTFS Permissions**:
  - Address bar navigation, file creation, editing, and deletion.
  - Folder Properties → Security tab: Group/user names, interactive Allow/Deny checkboxes for Full Control, Modify, Read & Execute, List, Read, Write.
  - Advanced Security Settings dialog with Owner and **Effective Access** calculator.
- **Security & Access Test Utility (`SecurityTest.exe`)**:
  - Immediate evaluation breakdown of User, Group, Required Permission, Effective Permission, and Audit Event.
  - One-click presets for `jdoe`, `mwilson`, and disabled account tests.
- **Power User CLI (Command Prompt & Windows PowerShell)**:
  - Command Prompt (`cmd.exe`): supports `whoami`, `hostname`, `net user`, `net user <name>`, `net user <name> /add`, `net user <name> /delete`, `net user <name> /active:no`, `net localgroup`, `net localgroup <group> <user> /add`, `icacls "C:\FinanceData"`, `cls`.
  - PowerShell (`powershell.exe`): supports `whoami`, `hostname`, `Get-LocalUser`, `New-LocalUser`, `Get-LocalGroup`, `New-LocalGroup`, `Get-LocalGroupMember GRP_Finance`, `Add-LocalGroupMember`, `Disable-LocalUser`, `Get-Acl C:\FinanceData`, `Get-WindowsFeature`, `Install-WindowsFeature`, `Uninstall-WindowsFeature`, `Clear`.
  - Executing CLI commands modifies the shared simulation state in real time!
- **Presentation & Demonstration Controls**:
  - `SIMULATION MODE` indicator.
  - `📋 Scenario Guide` with active step tracking and shortcuts.
  - `⚡ Load Demo Scenario` (pre-configures the entire scenario for quick demonstration: `WIN-SERVER`, `jdoe` as Financial Analyst, `GRP_Finance`, `C:\FinanceData` with Modify permissions).
  - `🧹 Reset Lab` (resets to fresh VirtualBox state).
  - `🗑️ Clear Audit Log` (clears the administrative/security log and logs Event 1102).
  - `📜 Activity Log` (opens the complete Section 20 demonstration timeline and security audit trail).
  - `🎓 Role vs Group (RBAC)` (opens clear educational breakdown distinguishing organizational roles from Windows security groups).
- **Realistic File System & Document Viewers**:
  - `Budget.xlsx` opens an authentic Microsoft Excel spreadsheet viewer with formula bar, ribbon, and cost center breakdown.
  - `Payroll.xlsx` opens Microsoft Excel with departmental payroll register.
  - `FinancialReport.docx` opens a formatted Microsoft Word document viewer with letterhead, executive summary, and approval signatures.
  - Folder Properties with General, Sharing, Security (with Allow/Deny ACLs), and Previous Versions tabs.

---

## 📁 Project Architecture

```text
/index.html                     # Main application entry point
/css/
    styles.css                  # Authentic Windows Server & VirtualBox styling
/js/
    state.js                    # Centralized reactive state store, NTFS permission engine, audit logger
    virtualbox.js               # VirtualBox Manager UI, New VM wizard, Settings, VM window chrome
    windows.js                  # Boot sequence, Setup installer, Desktop, Taskbar, Window manager
    users.js                    # Computer Management MMC, Users snap-in, User CRUD, Role manager
    groups.js                   # Groups snap-in, Group CRUD, Member Add/Remove picker
    permissions.js              # File Explorer, Folder Properties (Security), Effective Access, SecurityTest.exe
    audit.js                    # Event Viewer MMC snap-in, Security Auditing logs, CSV exporter
    app.js                      # Application orchestrator, Scenario guide, CMD & PowerShell console
/assets/
    icons/                      # SVG assets (VirtualBox, Windows, Folder, User, Group, Shield)
```

No external CDNs, npm packages, or internet connections are required.
