import { getDefaultMetaFieldValueMap } from '../helpers';
import { DatabaseManager } from '../database/manager';

async function execute(dm: DatabaseManager) {
  // Check if Role table exists
  const roleTableExists = await dm.db?.knex?.schema.hasTable('Role');

  if (!roleTableExists) {
    // Role table doesn't exist, skip this patch
    // It will be created in a new setup
    return;
  }

  // Check if roles already exist
  const existingRoles = await dm.db?.getAll('Role', {
    fields: ['name'],
  });

  if (existingRoles && existingRoles.length > 0) {
    // Roles already exist, don't recreate them
    return;
  }

  const defaults = getDefaultMetaFieldValueMap();

  const defaultRoles = [
    {
      name: 'Owner',
      description: 'Full access to all features and settings',
      isOwner: true,
      // All permissions set to true for Owner
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: true,
      canSubmitInvoices: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: true,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canDeleteSuppliers: true,
      canCreateItems: true,
      canEditItems: true,
      canDeleteItems: true,
      canViewReports: true,
      canExportReports: true,
      canEditAccounts: true,
      canMakePayments: true,
      canManageUsers: true,
      canManageRoles: true,
      canAccessSettings: true,
      canImportData: true,
      canExportData: true,
      ...defaults,
    },
    {
      name: 'Manager',
      description: 'Can manage sales, purchases, and view reports',
      isOwner: false,
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: false,
      canSubmitInvoices: true,
      canCreateCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: false,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canDeleteSuppliers: false,
      canCreateItems: true,
      canEditItems: true,
      canDeleteItems: false,
      canViewReports: true,
      canExportReports: true,
      canEditAccounts: false,
      canMakePayments: true,
      canManageUsers: false,
      canManageRoles: false,
      canAccessSettings: false,
      canImportData: true,
      canExportData: true,
      ...defaults,
    },
    {
      name: 'Accountant',
      description: 'Can handle accounts, payments, and reports',
      isOwner: false,
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: false,
      canSubmitInvoices: true,
      canCreateCustomers: false,
      canEditCustomers: false,
      canDeleteCustomers: false,
      canCreateSuppliers: false,
      canEditSuppliers: false,
      canDeleteSuppliers: false,
      canCreateItems: false,
      canEditItems: false,
      canDeleteItems: false,
      canViewReports: true,
      canExportReports: true,
      canEditAccounts: true,
      canMakePayments: true,
      canManageUsers: false,
      canManageRoles: false,
      canAccessSettings: false,
      canImportData: false,
      canExportData: true,
      ...defaults,
    },
    {
      name: 'Sales',
      description: 'Can create and manage sales invoices and customers',
      isOwner: false,
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: false,
      canSubmitInvoices: false,
      canCreateCustomers: true,
      canEditCustomers: true,
      canDeleteCustomers: false,
      canCreateSuppliers: false,
      canEditSuppliers: false,
      canDeleteSuppliers: false,
      canCreateItems: true,
      canEditItems: false,
      canDeleteItems: false,
      canViewReports: true,
      canExportReports: false,
      canEditAccounts: false,
      canMakePayments: false,
      canManageUsers: false,
      canManageRoles: false,
      canAccessSettings: false,
      canImportData: false,
      canExportData: false,
      ...defaults,
    },
    {
      name: 'Purchase',
      description: 'Can create and manage purchase invoices and suppliers',
      isOwner: false,
      canCreateInvoices: true,
      canEditInvoices: true,
      canDeleteInvoices: false,
      canSubmitInvoices: false,
      canCreateCustomers: false,
      canEditCustomers: false,
      canDeleteCustomers: false,
      canCreateSuppliers: true,
      canEditSuppliers: true,
      canDeleteSuppliers: false,
      canCreateItems: true,
      canEditItems: false,
      canDeleteItems: false,
      canViewReports: true,
      canExportReports: false,
      canEditAccounts: false,
      canMakePayments: false,
      canManageUsers: false,
      canManageRoles: false,
      canAccessSettings: false,
      canImportData: false,
      canExportData: false,
      ...defaults,
    },
  ];

  for (const role of defaultRoles) {
    try {
      await dm.db?.insert('Role', role);
    } catch (error) {
      // Role might already exist, skip
      console.log(`Role ${role.name} might already exist, skipping...`);
    }
  }
}

export default { execute };
