import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ListViewSettings } from 'fyo/model/types';

export class Role extends Doc {
  name?: string;
  description?: string;
  isOwner?: boolean;

  // Invoice Permissions
  canCreateInvoices?: boolean;
  canEditInvoices?: boolean;
  canDeleteInvoices?: boolean;
  canSubmitInvoices?: boolean;

  // Customer Permissions
  canCreateCustomers?: boolean;
  canEditCustomers?: boolean;
  canDeleteCustomers?: boolean;

  // Supplier Permissions
  canCreateSuppliers?: boolean;
  canEditSuppliers?: boolean;
  canDeleteSuppliers?: boolean;

  // Item Permissions
  canCreateItems?: boolean;
  canEditItems?: boolean;
  canDeleteItems?: boolean;

  // Financial Permissions
  canViewReports?: boolean;
  canExportReports?: boolean;
  canEditAccounts?: boolean;
  canMakePayments?: boolean;

  // System Permissions
  canManageUsers?: boolean;
  canManageRoles?: boolean;
  canAccessSettings?: boolean;
  canImportData?: boolean;
  canExportData?: boolean;

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'description', 'isOwner'],
    };
  }
}
