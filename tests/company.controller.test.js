import { describe, it, expect } from 'vitest';

describe('Company Controller RBAC and Hijacking Tests', () => {

    it('VULNERABILITY DEMONSTRATION: addRecruiter demotes/hijacks existing admin or other company roles', () => {
        // Mock DB records
        const mockCompany = {
            _id: 'company-1',
            name: 'Company A',
            owners: ['employer-1'],
            recruiters: []
        };

        const mockAdminUser = {
            _id: 'admin-999',
            name: 'Super Admin User',
            role: 'admin',
            companyId: null
        };

        // Simplified addRecruiter logic inside company.controller.js
        const addRecruiterController = (req, res) => {
            const { userId } = req.body;
            
            // Checks if owner
            const isOwner = mockCompany.owners.includes(req.user._id);
            if (!isOwner) throw new Error('Forbidden');

            // Bug: Does NOT check if userToAdd is already an admin, or has another role.
            // It blindly updates userToAdd.role to 'recruiter' and sets companyId
            mockCompany.recruiters.push(userId);
            mockAdminUser.role = 'recruiter';
            mockAdminUser.companyId = mockCompany._id;

            return { success: true };
        };

        // Execute addRecruiter by company owner, adding the admin user
        const reqUser = { _id: 'employer-1' };
        const reqBody = { userId: 'admin-999' };

        const result = addRecruiterController({ user: reqUser, body: reqBody }, {});
        
        expect(result.success).toBe(true);
        expect(mockAdminUser.role).toBe('recruiter'); // CRITICAL: Admin has been demoted to recruiter!
        expect(mockAdminUser.companyId).toBe('company-1');
    });

    it('VULNERABILITY DEMONSTRATION: createCompany downgrades Admin role and allows multi-company registration', () => {
        const mockAdminUser = {
            _id: 'admin-user-id',
            role: 'admin',
            companyId: null
        };

        // Simplified createCompany logic
        const createCompanyController = (req, res) => {
            // Checks if user already created a company
            // Let's assume no company created yet by this user.
            const company = {
                _id: 'company-new',
                name: req.body.name,
                createdBy: req.user._id,
                owners: [req.user._id]
            };

            // Bug: Overwrites role to employer blindly, even if user is an admin!
            req.user.role = 'employer';
            req.user.companyId = company._id;

            return { success: true, company };
        };

        const reqUser = mockAdminUser;
        const reqBody = { name: 'New Company Inc' };

        const result = createCompanyController({ user: reqUser, body: reqBody }, {});
        
        expect(result.success).toBe(true);
        expect(reqUser.role).toBe('employer'); // CRITICAL: Admin downgraded to employer!
    });
});
