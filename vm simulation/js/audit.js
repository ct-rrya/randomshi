/**
 * System Administration Simulator - Audit Log & Event Viewer
 * Controls the Event Viewer snap-in (eventvwr.msc) within Computer Management,
 * displaying authentic Windows Security Auditing logs with real Event IDs and details.
 */

class AuditManager {
    constructor() {
        this.selectedEventId = null;
        this.activeFilter = 'All'; // All, Security, System, VirtualBox

        this.init();
    }

    init() {
        // State updates trigger re-render if event viewer is active
        window.systemState.subscribe((state, changeKey) => {
            if (changeKey === 'audit' || changeKey === 'all') {
                this.refreshEventViewer();
            }
        });
    }

    renderEventViewer(mainEl, actionEl) {
        const state = window.systemState.getState();
        const logs = state.auditLog;
        const selectedEvent = logs.find(e => e.id === this.selectedEventId) || logs[0];

        mainEl.innerHTML = `
            <div class="eventvwr-wrapper">
                <!-- Top Split: Events Table -->
                <div class="eventvwr-table-container">
                    <table class="win-table eventvwr-table" id="eventvwr-table">
                        <thead>
                            <tr>
                                <th style="width: 120px;">Level</th>
                                <th style="width: 140px;">Date and Time</th>
                                <th style="width: 180px;">Source</th>
                                <th style="width: 80px;">Event ID</th>
                                <th>Task Category</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${logs.map(e => {
                                const isSelected = selectedEvent && selectedEvent.id === e.id;
                                const isFailure = e.level.includes('Failure') || e.level === 'Error';
                                const isWarning = e.level === 'Warning';
                                const levelIcon = isFailure ? '🛑' : (isWarning ? '⚠️' : 'ℹ️');

                                return `
                                    <tr class="event-row ${isSelected ? 'selected' : ''}" 
                                        onclick="window.auditManager.selectEventRow(${e.id}, this)">
                                        <td>
                                            <span class="event-level-icon">${levelIcon}</span>
                                            <span>${e.level}</span>
                                        </td>
                                        <td>${e.date} ${e.time}</td>
                                        <td>${e.source}</td>
                                        <td><b>${e.eventId}</b></td>
                                        <td>${e.task}</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>

                <!-- Bottom Split: Event Details Pane -->
                <div class="eventvwr-details-container" id="eventvwr-details">
                    ${this.renderEventDetailsHTML(selectedEvent)}
                </div>
            </div>
        `;

        if (actionEl) {
            actionEl.innerHTML = `
                <div class="mmc-actions-box">
                    <div class="action-header">Event Viewer</div>
                    <div class="action-link" onclick="window.auditManager.refreshEventViewer()"><span class="link-icon">🔄</span> Refresh</div>
                    <div class="action-link" onclick="window.auditManager.promptClearLog()"><span class="link-icon">🧹</span> Clear Log...</div>
                    <div class="action-link" onclick="window.auditManager.exportLogCsv()"><span class="link-icon">💾</span> Save All Events As...</div>
                    <div class="action-divider"></div>
                    <div class="action-header">Log Info</div>
                    <div style="padding: 6px 10px; font-size: 11px; color: #555;">
                        Log: Security<br>
                        Events: <b>${logs.length}</b><br>
                        Max Size: 20,480 KB
                    </div>
                </div>
            `;
        }
    }

    renderEventDetailsHTML(event) {
        if (!event) {
            return `<div style="padding: 15px; color: #777;">No event selected.</div>`;
        }

        return `
            <div class="event-details-box">
                <div class="details-tab-bar">
                    <span class="active-tab">General</span>
                </div>
                <div class="details-text-area">
                    <div class="details-field">
                        <b>Event ID:</b> ${event.eventId} &nbsp;|&nbsp; <b>Source:</b> ${event.source} &nbsp;|&nbsp; <b>Logged:</b> ${event.date} ${event.time}
                    </div>
                    <div class="details-field">
                        <b>Subject / User:</b> ${event.user} &nbsp;|&nbsp; <b>Computer:</b> ${window.simState ? window.simState.server.hostname : 'WIN-SERVER'}
                    </div>
                    <hr style="margin: 8px 0; border: none; border-top: 1px solid #ddd;">
                    <div class="details-body-text">
                        <b>Description:</b><br>
                        ${event.details}
                    </div>
                    <div style="margin-top: 10px; font-size: 11px; color: #666;">
                        Keywords: Audit ${event.level.includes('Failure') ? 'Failure' : 'Success'}<br>
                        OpCode: Info
                    </div>
                </div>
            </div>
        `;
    }

    selectEventRow(eventId, rowEl) {
        this.selectedEventId = eventId;
        document.querySelectorAll('#eventvwr-table tbody tr').forEach(r => r.classList.remove('selected'));
        if (rowEl) rowEl.classList.add('selected');

        const state = window.systemState.getState();
        const event = state.auditLog.find(e => e.id === eventId);
        const detailsEl = document.getElementById('eventvwr-details');
        if (detailsEl) {
            detailsEl.innerHTML = this.renderEventDetailsHTML(event);
        }
    }

    refreshEventViewer() {
        const mainEl = document.getElementById('mmc-main-view');
        const actionEl = document.getElementById('mmc-action-view');
        if (mainEl && window.usersManager.selectedTreeNode === 'events') {
            this.renderEventViewer(mainEl, actionEl);
        }
    }

    promptClearLog() {
        if (confirm("Do you want to save 'Security' before clearing it?")) {
            this.exportLogCsv();
        }
        window.systemState.clearAuditLog();
    }

    exportLogCsv() {
        const logs = window.systemState.getState().auditLog;
        let csv = "ID,Date,Time,Level,Source,EventID,User,Task,Details\n";
        for (const log of logs) {
            csv += `"${log.id}","${log.date}","${log.time}","${log.level}","${log.source}","${log.eventId}","${log.user}","${log.task}","${log.details.replace(/"/g, '""')}"\n`;
        }

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `SecurityAuditLog_${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

window.auditManager = new AuditManager();
