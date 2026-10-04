const fs = require('fs');
const path = require('path');

// Mock browser globals
global.window = global;
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
};

// Load state.js
const stateCode = fs.readFileSync(path.join(__dirname, './js/state.js'), 'utf8');
eval(stateCode);

const store = window.systemState;
let passed = 0;
let total = 15;

function assert(condition, message) {
    if (!condition) {
        console.error(`❌ FAILED: ${message}`);
        process.exit(1);
    }
    console.log(`✅ PASSED: ${message}`);
    passed++;
}

console.log("=== RUNNING 15 ACCEPTANCE TESTS ===");

// Start with clean sandbox scenario
store.loadSandboxScenario();

// TEST 1: Create user -> user appears everywhere relevant
const u1 = store.createUser({ username: "jdoe", fullName: "John Doe", password: "Password123!" });
assert(u1.success === true && store.getState().users.some(u => u.username === "jdoe"), "TEST 1: Create user -> user appears in users list and state");

// TEST 2: Create duplicate user -> realistic error
const u1_dup = store.createUser({ username: "jdoe", fullName: "John Doe 2" });
assert(u1_dup.success === false && u1_dup.error === "The user name already exists.", "TEST 2: Create duplicate user -> realistic error: 'The user name already exists.'");

// TEST 3: Create group before creating users -> works
const g1 = store.createGroup({ name: "GRP_Finance", description: "Finance Department" });
assert(g1.success === true && store.getState().groups.some(g => g.name === "GRP_Finance"), "TEST 3: Create group before creating users -> works properly");

// TEST 4: Add existing user to group -> membership updates
const addMember = store.addUserToGroup("jdoe", "GRP_Finance");
assert(addMember.success === true && store.getUserGroups("jdoe").some(g => g.name === "GRP_Finance"), "TEST 4: Add existing user to group -> membership updates");

// TEST 5: Attempt to add nonexistent user -> realistic error
const addUnknown = store.addUserToGroup("unknownUser", "GRP_Finance");
assert(addUnknown.success === false && addUnknown.error === "The specified account could not be found.", "TEST 5: Attempt to add nonexistent user -> realistic error: 'The specified account could not be found.'");

// TEST 6: Assign permission before user joins group -> permission exists, but user still cannot access
// Create new user 'alice' who is NOT in GRP_Finance
store.createUser({ username: "alice", fullName: "Alice Smith" });
store.createFolder("C:\\", "FinanceData");
store.updateResourceACL("C:\\FinanceData", {
    owner: "Administrators",
    entries: [
        { principal: "Administrators", type: "Allow", rights: ["FullControl"] },
        { principal: "GRP_Finance", type: "Allow", rights: ["Modify"] }
    ]
});
const evalAliceBefore = store.evaluateAccess("alice", "C:\\FinanceData", "Modify");
assert(evalAliceBefore.granted === false, "TEST 6: Assign permission before user joins group -> user cannot access resource (ACCESS DENIED)");

// TEST 7: Add user to group -> access may change automatically according to permissions
store.addUserToGroup("alice", "GRP_Finance");
const evalAliceAfter = store.evaluateAccess("alice", "C:\\FinanceData", "Modify");
assert(evalAliceAfter.granted === true && evalAliceAfter.allowedBy.includes("GRP_Finance"), "TEST 7: Add user to group -> access granted dynamically according to permissions");

// TEST 8: Remove user from group -> access changes accordingly
store.removeUserFromGroup("alice", "GRP_Finance");
const evalAliceRemoved = store.evaluateAccess("alice", "C:\\FinanceData", "Modify");
assert(evalAliceRemoved.granted === false, "TEST 8: Remove user from group -> access dynamically denied");

// TEST 9: Disable user -> authentication fails
store.toggleUserDisabled("jdoe", true);
const evalJdoeDisabled = store.evaluateAccess("jdoe", "C:\\FinanceData", "Modify");
assert(evalJdoeDisabled.granted === false && evalJdoeDisabled.reason === "ACCOUNT_DISABLED", "TEST 9: Disable user -> authentication fails (ACCOUNT_DISABLED)");

// Re-enable jdoe for further tests
store.toggleUserDisabled("jdoe", false);
const evalJdoeEnabled = store.evaluateAccess("jdoe", "C:\\FinanceData", "Modify");
assert(evalJdoeEnabled.granted === true, "jdoe re-enabled -> access granted restored");

// TEST 10: Delete user -> account disappears and dependent relationships update
const delUser = store.deleteUser("jdoe");
assert(delUser.success === true && !store.getState().users.some(u => u.username === "jdoe") && !store.getState().groups.find(g => g.name === "GRP_Finance").members.includes("jdoe"), "TEST 10: Delete user -> account disappears and group memberships remove it");

// TEST 11: Delete group -> group disappears and its permission relationships stop granting access
// Create bob and add to GRP_Finance
store.createUser({ username: "bob", fullName: "Bob" });
store.addUserToGroup("bob", "GRP_Finance");
const delGroup = store.deleteGroup("GRP_Finance");
assert(delGroup.success === true && !store.getState().groups.some(g => g.name === "GRP_Finance"), "TEST 11: Delete group -> group disappears even when it had members");
const evalBobAfterGroupDel = store.evaluateAccess("bob", "C:\\FinanceData", "Modify");
assert(evalBobAfterGroupDel.granted === false, "TEST 11b: Group permissions stop granting access after group deletion");

// TEST 12: Try unauthorized resource access -> ACCESS DENIED
store.createUser({ username: "charlie", fullName: "Charlie" });
const evalUnauthorized = store.evaluateAccess("charlie", "C:\\FinanceData", "Modify");
assert(evalUnauthorized.granted === false, "TEST 12: Unauthorized resource access -> ACCESS DENIED");

// TEST 13: Configure correct permissions -> ACCESS GRANTED
store.createGroup({ name: "GRP_Auditors" });
store.addUserToGroup("charlie", "GRP_Auditors");
store.updateResourceACL("C:\\FinanceData", {
    owner: "Administrators",
    entries: [
        { principal: "Administrators", type: "Allow", rights: ["FullControl"] },
        { principal: "GRP_Auditors", type: "Allow", rights: ["Read", "Modify"] }
    ]
});
const evalAuthorized = store.evaluateAccess("charlie", "C:\\FinanceData", "Modify");
assert(evalAuthorized.granted === true && evalAuthorized.allowedBy.includes("GRP_Auditors"), "TEST 13: Configure correct permissions -> ACCESS GRANTED");

// TEST 14: Perform actions in an unexpected order -> simulator does NOT break or force expected sequence
// Sequence: folder first -> assign permission to non-existent group -> create group -> create user -> add user -> test
store.createFolder("C:\\", "MarketingData");
store.updateResourceACL("C:\\MarketingData", {
    owner: "Administrators",
    entries: [{ principal: "GRP_Marketing", type: "Allow", rights: ["Modify"] }]
});
store.createGroup({ name: "GRP_Marketing" });
store.createUser({ username: "dave", fullName: "Dave" });
store.addUserToGroup("dave", "GRP_Marketing");
const evalUnexpected = store.evaluateAccess("dave", "C:\\MarketingData", "Modify");
assert(evalUnexpected.granted === true, "TEST 14: Out-of-order execution works completely naturally");

// TEST 15: Every action is reflected consistently across UI, access testing, and audit log
const audit = store.getState().auditLog;
const has4720 = audit.some(a => a.eventId === 4720); // User created
const has4728 = audit.some(a => a.eventId === 4728); // Member added
const has4730 = audit.some(a => a.eventId === 4730); // Group deleted
const has4726 = audit.some(a => a.eventId === 4726); // User deleted
const has4663 = audit.some(a => a.eventId === 4663); // Access checked
assert(has4720 && has4728 && has4730 && has4726 && has4663, "TEST 15: Every action is consistently logged in the Windows Security Audit Log (4720, 4728, 4730, 4726, 4663)");

console.log(`\n🎉 ALL ${passed} OF ${total} ACCEPTANCE TESTS PASSED SUCCESSFULLY!`);
