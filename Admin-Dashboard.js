const API_BASE_URL = 'api/admin.php'; 
let ADMIN_USER_ID = null;

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Starting admin panel initialization...');
    
    try {
        const success = await initializeAdminUser();
        
        if (!success) {
            console.log('Authentication failed, stopping initialization');
            return;
        }
        
        await initializeDashboard();
        
    } catch (error) {
        console.error('Admin panel initialization failed:', error);
        alert('Failed to initialize admin panel. Please refresh the page.');
    }
});

async function initializeAdminUser() {
    try {
        const response = await fetch('api/admin.php?action=check_session');
        console.log('Session check response status:', response.status);
        
        const data = await response.json();
        console.log('Session check response data:', data);

        if (!data.logged_in) {
            console.error('Not logged in. Redirecting to login...');
            alert('You are not logged in. Please log in first.');
            window.location.href = 'Login.html';
            return false;
        }

        if (data.role !== 'admin') {
            console.error('User is not admin. Role:', data.role);
            alert('You are not authorized to access the admin panel. Admin role required.');
            window.location.href = 'index.html';
            return false;
        }

        ADMIN_USER_ID = data.user_id;
        console.log('Admin user authenticated. ID:', ADMIN_USER_ID);
        return true;
        
    } catch (err) {
        console.error('Session check failed:', err);
        alert('Failed to verify session. Please log in again.');
        window.location.href = 'Login.html';
        return false;
    }
}

async function initializeDashboard() {
    console.log('Initializing admin dashboard with admin ID:', ADMIN_USER_ID);
    
    showLoadingStates();
    
    await fetchDashboardStats();
    await fetchPendingSubmissions();
    await fetchAllUsers();
    await fetchCategories();
    await loadReports();
    
    console.log('Admin dashboard fully initialized');
}

function showLoadingStates() {
    const pendingCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(1) .card-description');
    const usersCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(2) .card-description');
    const artworksCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(3) .card-description');
    const submissionsContainer = document.getElementById('submissionsContainer');
    const userManagementContainer = document.getElementById('userManagementContainer');
    const categoryListContainer = document.getElementById('categoryListContainer');
    
    if (pendingCountEl) pendingCountEl.textContent = '...';
    if (usersCountEl) usersCountEl.textContent = '...';
    if (artworksCountEl) artworksCountEl.textContent = '...';
    
    if (submissionsContainer) {
        submissionsContainer.innerHTML = '<p style="text-align:center;">Loading submissions...</p>';
    }
    if (userManagementContainer) {
        userManagementContainer.innerHTML = '<p style="text-align:center;">Loading users...</p>';
    }
    if (categoryListContainer) {
        categoryListContainer.innerHTML = '<p style="text-align:center;">Loading categories...</p>';
    }
}

async function apiRequest(action, method = 'GET', body = null) {
    if (!ADMIN_USER_ID) {
        console.error('Admin user ID not available for action:', action);
        return null;
    }

    const url = `${API_BASE_URL}?user_id=${ADMIN_USER_ID}&action=${action}`;
    console.log(`Making API request: ${method} ${url}`);
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include'
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        console.log(`API response status for ${action}:`, response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API error for ${action}:`, errorText);
            throw new Error(`Request failed with status ${response.status}`);
        }
        
        const result = await response.json();
        console.log(`API success for ${action}:`, result);
        return result;
        
    } catch (error) {
        console.error(`Fetch operation failed for action '${action}':`, error);
        return null;
    }
}

const pendingCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(1) .card-description');
const usersCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(2) .card-description');
const artworksCountEl = document.querySelector('.card-grid-dashboard .dashboard-card:nth-child(3) .card-description');
const submissionsContainer = document.getElementById('submissionsContainer');
const userManagementContainer = document.getElementById('userManagementContainer');
const categoryListContainer = document.getElementById('categoryListContainer');
const addCategoryBtn = document.getElementById('addCategoryBtn');

async function fetchDashboardStats() {
    console.log('Fetching dashboard stats...');
    const data = await apiRequest('stats');
    
    if (data && data.success) {
        if (pendingCountEl) pendingCountEl.textContent = data.stats.pending;
        if (usersCountEl) usersCountEl.textContent = data.stats.users;
        if (artworksCountEl) artworksCountEl.textContent = data.stats.artworks;
    } else {
        if (pendingCountEl) pendingCountEl.textContent = '0';
        if (usersCountEl) usersCountEl.textContent = '0';
        if (artworksCountEl) artworksCountEl.textContent = '0';
    }
}

function createSubmissionElement(submission) {
    const subDiv = document.createElement('div');
    subDiv.className = 'card-light-desc grid-two submission-row'; 
    subDiv.innerHTML = `
        <div class="flex-box">
            <img src="${submission.image_url || 'imgs/placeholder-art.png'}" alt="Artwork" class="image" /> 
            <div class="submission-desc">
                <strong>${submission.title || 'Untitled Artwork'}</strong>
                <p>Submitted by User ID: ${submission.user_id || 'Unknown'}</p>
            </div>
        </div>
        <div class="flex-box action-buttons">
            <button class="btn btn-approve" data-id="${submission.id}">Approve</button>
            <button class="btn btn-reject" data-id="${submission.id}">Reject</button>
        </div>
    `;
    return subDiv;
}

async function fetchPendingSubmissions() {
    if (!submissionsContainer) return;
    
    submissionsContainer.innerHTML = '<p style="text-align:center;">Loading pending submissions...</p>';
    
    const data = await apiRequest('pending');
    
    submissionsContainer.innerHTML = '';

    if (data && data.success && data.submissions && data.submissions.length > 0) {
        if (pendingCountEl) pendingCountEl.textContent = data.submissions.length;
        
        data.submissions.forEach(submission => {
            submissionsContainer.appendChild(createSubmissionElement(submission));
        });
        
        attachSubmissionListeners();
    } else {
        if (pendingCountEl) pendingCountEl.textContent = 0;
        submissionsContainer.innerHTML = '<p class="empty-state">No pending submissions found.</p>';
    }
}

function attachSubmissionListeners() {
    document.querySelectorAll('.btn-approve').forEach(button => {
        button.addEventListener('click', () => handleSubmissionAction(button.dataset.id, 'approve'));
    });

    document.querySelectorAll('.btn-reject').forEach(button => {
        button.addEventListener('click', () => handleSubmissionAction(button.dataset.id, 'reject'));
    });
}

async function handleSubmissionAction(id, action) {
    if (!confirm(`Are you sure you want to ${action} submission ID ${id}?`)) {
        return;
    }
    
    const result = await apiRequest(action, 'POST', { id: id });

    if (result && result.success) {
        alert(result.message);
        await fetchDashboardStats();
        await fetchPendingSubmissions();
    } else {
        alert(result?.error || `Failed to ${action} submission`);
    }
}

function createUserElement(user) {
    const userDiv = document.createElement('div');
    userDiv.className = 'card-light-desc grid-four user-row';
    
    const roles = ['user', 'artist', 'admin'];
    const selectOptions = roles.map(role => 
        `<option value="${role}" ${user.role === role ? 'selected' : ''}>${role.charAt(0).toUpperCase() + role.slice(1)}</option>`
    ).join('');
    
    const statusClass = user.status === 'active' ? 'status-active' : 'status-inactive';
    const statusText = user.status === 'active' ? 'Active' : 'Inactive';
    
    const isActive = user.status === 'active';
    const isMainAdmin = user.id === 1;
    
    userDiv.innerHTML = `
        <div class="flex-box">
            <img src="${user.profile_img || 'imgs/man.png'}" alt="img" class="image" />
            <div class="user-desc">${user.username || 'N/A'} (${user.email || 'N/A'})</div>
        </div>
        <div>
            <select class="role-select" data-user-id="${user.id}">
                ${selectOptions}
            </select>
        </div>
        <div>
            <span class="status-badge ${statusClass}">${statusText}</span>
        </div>
        <div>
            <div class="action-dropdown" data-user-id="${user.id}">
                <button class="action-dropdown-btn" type="button">
                    Actions
                </button>
                <div class="action-dropdown-menu">
                    ${isActive ? 
                        '<button class="action-dropdown-item deactivate" data-action="deactivate">Deactivate</button>' : 
                        '<button class="action-dropdown-item activate" data-action="activate">Activate</button>'
                    }
                    ${!isMainAdmin ? 
                        '<button class="action-dropdown-item delete" data-action="delete">Delete User</button>' : 
                        ''
                    }
                </div>
            </div>
        </div>
    `;
    return userDiv;
}

async function fetchAllUsers() {
    if (!userManagementContainer) return;
    
    const headerRow = userManagementContainer.querySelector('.grid-three');
    userManagementContainer.innerHTML = '';
    if(headerRow) userManagementContainer.appendChild(headerRow);
    userManagementContainer.insertAdjacentHTML('beforeend', '<p style="text-align:center;">Loading users...</p>');

    const data = await apiRequest('users');

    userManagementContainer.innerHTML = '';
    if(headerRow) userManagementContainer.appendChild(headerRow);

    if (data && data.success && data.users && data.users.length > 0) {
        data.users.forEach(user => {
            userManagementContainer.appendChild(createUserElement(user));
        });
        attachUserRoleListeners();
    } else {
        userManagementContainer.insertAdjacentHTML('beforeend', '<p class="empty-state">No users found.</p>');
    }
}

function attachUserRoleListeners() {
    document.querySelectorAll('.role-select').forEach(select => {
        select.addEventListener('change', (event) => handleUpdateRole(event.target.dataset.userId, event.target.value));
    });
    
    document.querySelectorAll('.action-dropdown-btn').forEach(button => {
        button.addEventListener('click', (event) => {
            event.stopPropagation();
            const dropdown = event.target.closest('.action-dropdown');
            const menu = dropdown.querySelector('.action-dropdown-menu');
            
            document.querySelectorAll('.action-dropdown-menu.show').forEach(otherMenu => {
                if (otherMenu !== menu) {
                    otherMenu.classList.remove('show');
                }
            });
            
            menu.classList.toggle('show');
        });
    });
    
    document.querySelectorAll('.action-dropdown-item').forEach(item => {
        item.addEventListener('click', (event) => {
            event.stopPropagation();
            const action = event.target.dataset.action;
            const dropdown = event.target.closest('.action-dropdown');
            const userId = dropdown.dataset.userId;
            
            dropdown.querySelector('.action-dropdown-menu').classList.remove('show');
            
            if (action === 'activate' || action === 'deactivate') {
                const newStatus = action === 'activate' ? 'active' : 'inactive';
                handleToggleUserStatus(userId, newStatus);
            } else if (action === 'delete') {
                handleDeleteUser(userId);
            }
        });
    });
    
    document.addEventListener('click', () => {
        document.querySelectorAll('.action-dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    });
}

async function handleUpdateRole(userId, newRole) {
    if (!confirm(`Change user role to ${newRole}?`)) {
        return;
    }

    const result = await apiRequest('update_role', 'POST', { 
        user_id: userId, 
        role: newRole 
    });

    if (result && result.success) {
        alert('User role updated successfully');
        await fetchAllUsers();
    } else {
        alert(result?.error || 'Failed to update user role');
    }
}

async function handleToggleUserStatus(userId, newStatus) {
    const actionText = newStatus === 'active' ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${actionText} this user?`)) {
        return;
    }

    const result = await apiRequest('toggle_user_status', 'POST', { 
        user_id: userId, 
        status: newStatus 
    });

    if (result && result.success) {
        alert(result.message);
        await fetchAllUsers();
    } else {
        alert(result?.error || 'Failed to update user status');
    }
}

async function handleDeleteUser(userId) {
    if (!confirm(`This will permanently delete the user and all their submissions!\n\nAre you absolutely sure?`)) {
        return;
    }

    const result = await apiRequest('delete_user', 'POST', { 
        user_id: userId 
    });

    if (result && result.success) {
        alert(result.message);
        await fetchAllUsers();
    } else {
        alert(result?.error || 'Failed to delete user');
    }
}

function createCategoryElement(category) {
    const catDiv = document.createElement('div');
    catDiv.className = 'card-light-desc flex-box justify-between category-row';
    catDiv.dataset.id = category.id;
    catDiv.innerHTML = `
        <div class="category-name-display">${category.name}</div>
        <div class="flex-box action-buttons">
            <button class="btn btn-edit-cat" data-id="${category.id}" data-name="${category.name}">Edit</button>
            <button class="btn btn-delete-cat" data-id="${category.id}">Delete</button>
        </div>
    `;
    return catDiv;
}

async function fetchCategories() {
    if (!categoryListContainer) return;
    
    categoryListContainer.innerHTML = '<p style="text-align:center;">Loading categories...</p>';

    const data = await apiRequest('categories');
    
    categoryListContainer.innerHTML = '';

    if (data && data.success && data.categories && data.categories.length > 0) {
        data.categories.forEach(category => {
            categoryListContainer.appendChild(createCategoryElement(category));
        });
        attachCategoryListeners();
    } else {
        categoryListContainer.innerHTML = '<p class="empty-state">No categories found.</p>';
    }
}

function attachCategoryListeners() {
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', handleAddCategory);
    }
    
    document.querySelectorAll('.btn-edit-cat').forEach(button => {
        button.addEventListener('click', (e) => handleEditCategory(e.target.dataset.id, e.target.dataset.name));
    });

    document.querySelectorAll('.btn-delete-cat').forEach(button => {
        button.addEventListener('click', (e) => handleDeleteCategory(e.target.dataset.id));
    });
}

async function handleAddCategory() {
    const name = prompt("Enter the name of the new category:");
    if (name && name.trim()) {
        const result = await apiRequest('add_category', 'POST', { 
            name: name.trim()
        });

        if (result && result.success) {
            alert(result.message);
            await fetchCategories();
        } else {
            alert(result?.error || 'Failed to add category');
        }
    }
}

async function handleEditCategory(id, currentName) {
    const newName = prompt(`Enter the new name for category "${currentName}":`, currentName);
    
    if (newName && newName.trim() && newName.trim() !== currentName) {
        const result = await apiRequest('update_category', 'POST', { 
            id: parseInt(id), 
            name: newName.trim()
        });

        if (result && result.success) {
            alert(result.message);
            await fetchCategories();
        } else {
            alert(result?.error || 'Failed to update category');
        }
    }
}

async function handleDeleteCategory(id) {
    if (confirm("Are you sure you want to delete this category? This cannot be undone.")) {
        const result = await apiRequest('delete_category', 'POST', { 
            id: parseInt(id)
        });

        if (result && result.success) {
            alert(result.message);
            await fetchCategories();
        } else {
            alert(result?.error || 'Failed to delete category');
        }
    }
}

document.getElementById('refreshReports')?.addEventListener('click', loadReports);

async function loadReports() {
    try {
        const response = await fetch('api/reports.php');
        const data = await response.json();
        
        if (data.success) {
            renderReports(data.reports || []);
        }
    } catch (error) {
        console.error('Failed to load reports:', error);
    }
}

function renderReports(reports) {
    const container = document.getElementById('reportsContainer');
    if (!container) return;

    container.innerHTML = '';

    if (reports.length === 0) {
        container.innerHTML = '<div class="no-data">No reports found</div>';
        return;
    }

    reports.forEach(report => {
        const reportDiv = document.createElement('div');
        reportDiv.classList.add('card-light-desc', 'grid-four');
        reportDiv.innerHTML = `
            <div>
                <strong>Artwork ID:</strong> ${report.artwork_id}<br>
                <small>Reported by User: ${report.user_id}</small>
            </div>
            <div>
                <strong>Reason:</strong> ${report.reason}<br>
                <small>Status: ${report.status}</small>
            </div>
            <div>
                <strong>Details:</strong><br>
                <small>${report.details?.substring(0, 100) || 'No details'}...</small>
            </div>
            <div>
                <button class="btn report-resolve" data-id="${report.id}">Resolve</button>
                <button class="btn report-delete" data-id="${report.id}">Delete</button>
            </div>
        `;
        container.appendChild(reportDiv);
    });

    document.querySelectorAll('.report-resolve').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            resolveReport(id);
        });
    });

    document.querySelectorAll('.report-delete').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.getAttribute('data-id');
            deleteReport(id);
        });
    });
}

async function resolveReport(id) {
    if (!confirm('Mark this report as resolved?')) return;
    
    try {
        const response = await fetch(`api/reports.php?action=resolve&id=${id}`, {
            method: 'POST'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Report marked as resolved');
            await loadReports();
        } else {
            alert('Failed to resolve report: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Failed to resolve report: ' + error.message);
    }
}

async function deleteReport(id) {
    if (!confirm('Delete this report permanently?')) return;
    
    try {
        const response = await fetch(`api/reports.php?action=delete&id=${id}`, {
            method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
            alert('Report deleted');
            await loadReports();
        } else {
            alert('Failed to delete report: ' + (result.error || 'Unknown error'));
        }
    } catch (error) {
        alert('Failed to delete report: ' + error.message);
    }
}

document.getElementById('viewAllSubmission')?.addEventListener('click', fetchPendingSubmissions);