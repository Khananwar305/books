import { Fyo } from 'fyo';
import { DocValueMap } from 'fyo/core/types';
import { Doc } from 'fyo/model/doc';
import { createNumberSeries } from 'fyo/model/naming';
import {
  DEFAULT_CURRENCY,
  DEFAULT_LOCALE,
  DEFAULT_SERIES_START,
} from 'fyo/utils/consts';
import {
  AccountRootTypeEnum,
  AccountTypeEnum,
} from 'models/baseModels/Account/types';
import { AccountingSettings } from 'models/baseModels/AccountingSettings/AccountingSettings';
import { numberSeriesDefaultsMap } from 'models/baseModels/Defaults/Defaults';
import { InventorySettings } from 'models/inventory/InventorySettings';
import { ValuationMethod } from 'models/inventory/types';
import { ModelNameEnum } from 'models/types';
import { createRegionalRecords } from 'src/regional';
import {
  initializeInstance,
  setCurrencySymbols,
} from 'src/utils/initialization';
import { getRandomString } from 'utils';
import { getDefaultLocations, getDefaultUOMs } from 'utils/defaults';
import { getCountryCodeFromCountry, getCountryInfo } from 'utils/misc';
import { CountryInfo } from 'utils/types';
import { CreateCOA } from './createCOA';
import { SetupWizardOptions } from './types';

export default async function setupInstance(
  dbPath: string,
  setupWizardOptions: SetupWizardOptions,
  fyo: Fyo
) {
  const { companyName, country, chartOfAccounts } =
    setupWizardOptions;

  fyo.store.skipTelemetryLogging = true;

  try {
    // Step 1: Initialize database
    console.log('[Setup] Step 1: Initializing database...');
    await initializeDatabase(dbPath, country, fyo);

    // Step 2: Update settings in parallel (they don't depend on each other)
    console.log('[Setup] Step 2: Updating settings...');
    await Promise.all([
      updateSystemSettings(setupWizardOptions, fyo),
      updateAccountingSettings(setupWizardOptions, fyo),
      updatePrintSettings(setupWizardOptions, fyo),
    ]);

    // Step 3: Create currency records (needed before accounts)
    console.log('[Setup] Step 3: Creating currency records...');
    await createCurrencyRecords(fyo);

    // Step 4: Create accounts first (regional records depend on accounts)
    console.log('[Setup] Step 4: Creating accounts...');
    await createAccountRecords(country, chartOfAccounts, fyo);

    // Step 5: Create regional records (taxes, etc.) after accounts exist
    console.log('[Setup] Step 5: Creating regional records...');
    await createRegionalRecords(country, fyo);

    // Step 6: Create default entries and number series in parallel
    console.log('[Setup] Step 6: Creating default entries...');
    await Promise.all([
      createDefaultEntries(fyo),
      createDefaultNumberSeries(fyo),
      updateInventorySettings(fyo),
      createDefaultRoles(fyo),
    ]);

    // Step 7: Update print templates if electron
    if (fyo.isElectron) {
      console.log('[Setup] Step 7: Updating print templates...');
      const { updatePrintTemplates } = await import('src/utils/printTemplates');
      await updatePrintTemplates(fyo);
    }

    // Step 8: Complete setup
    console.log('[Setup] Step 8: Completing setup...');
    await completeSetup(companyName, fyo);
    if (!Object.keys(fyo.currencySymbols).length) {
      await setCurrencySymbols(fyo);
    }

    console.log('[Setup] Setup completed successfully!');
    fyo.store.skipTelemetryLogging = false;
  } catch (error) {
    console.error('[Setup] Setup failed at step:', error);
    fyo.store.skipTelemetryLogging = false;
    throw error;
  }
}

async function createDefaultEntries(fyo: Fyo) {
  /**
   * Create default UOM and Location entries in parallel
   */
  const uomPromises = getDefaultUOMs(fyo).map((uom) =>
    checkAndCreateDoc(ModelNameEnum.UOM, uom, fyo)
  );

  const locationPromises = getDefaultLocations(fyo).map((loc) =>
    checkAndCreateDoc(ModelNameEnum.Location, loc, fyo)
  );

  await Promise.all([...uomPromises, ...locationPromises]);
}

async function initializeDatabase(dbPath: string, country: string, fyo: Fyo) {
  const countryCode = getCountryCodeFromCountry(country);
  await initializeInstance(dbPath, true, countryCode, fyo);
}

async function updateAccountingSettings(
  setupWizardOptions: SetupWizardOptions,
  fyo: Fyo
) {
  const accountingSettings = (await fyo.doc.getDoc(
    'AccountingSettings'
  )) as AccountingSettings;

  const {
    companyName,
    country,
    mailingName,
    address,
    district,
    pincode,
    phone,
    email,
    fiscalYearStart,
    fiscalYearEnd,
  } = setupWizardOptions;

  // Only include fields that have values
  const settingsData: Record<string, any> = {
    companyName,
    country,
    fiscalYearStart,
    fiscalYearEnd,
  };

  if (mailingName) settingsData.mailingName = mailingName;
  if (address) settingsData.address = address;
  if (district) settingsData.district = district;
  if (pincode) settingsData.pincode = pincode;
  if (phone) settingsData.phone = phone;
  if (email) settingsData.email = email;

  await accountingSettings.setAndSync(settingsData);
  return accountingSettings;
}

async function updatePrintSettings(
  { logo, companyName, email }: SetupWizardOptions,
  fyo: Fyo
) {
  const printSettings = await fyo.doc.getDoc('PrintSettings');

  const printData: Record<string, any> = {
    companyName,
    displayLogo: logo ? true : false,
  };

  if (logo) printData.logo = logo;
  if (email) printData.email = email;

  await printSettings.setAndSync(printData);
}

async function updateSystemSettings(
  { country, currency: companyCurrency }: SetupWizardOptions,
  fyo: Fyo
) {
  const countryInfo = getCountryInfo();
  const countryOptions = countryInfo[country] as CountryInfo;
  const currency =
    companyCurrency ?? countryOptions.currency ?? DEFAULT_CURRENCY;
  const locale = countryOptions.locale ?? DEFAULT_LOCALE;
  const countryCode = getCountryCodeFromCountry(country);
  const systemSettings = await fyo.doc.getDoc('SystemSettings');
  const instanceId = getRandomString();

  await systemSettings.setAndSync({
    locale,
    currency,
    instanceId,
    countryCode,
  });
}

async function createCurrencyRecords(fyo: Fyo) {
  const promises: Promise<Doc | undefined>[] = [];
  const queue: string[] = [];
  const countrySettings = Object.values(getCountryInfo()) as CountryInfo[];

  for (const country of countrySettings) {
    const {
      currency,
      currency_fraction,
      currency_fraction_units,
      smallest_currency_fraction_value,
      currency_symbol,
    } = country;

    if (!currency || queue.includes(currency)) {
      continue;
    }

    const docObject = {
      name: currency,
      fraction: currency_fraction ?? '',
      fractionUnits: currency_fraction_units ?? 100,
      smallestValue: smallest_currency_fraction_value ?? 0.01,
      symbol: currency_symbol ?? '',
    };

    const doc = checkAndCreateDoc('Currency', docObject, fyo);
    promises.push(doc);
    queue.push(currency);
  }
  return Promise.all(promises);
}

async function createAccountRecords(
  country: string,
  chartOfAccounts: string,
  fyo: Fyo
) {
  const createCOA = new CreateCOA(chartOfAccounts, fyo);
  await createCOA.run();

  await createDiscountAccount(fyo);
  await setDefaultAccounts(fyo);
}

export async function createDiscountAccount(fyo: Fyo) {
  const incomeAccountName = fyo.t`Indirect Income`;
  const accountExists = await fyo.db.exists(
    ModelNameEnum.Account,
    incomeAccountName
  );

  if (!accountExists) {
    return;
  }

  const discountAccountName = fyo.t`Discounts`;
  const discountAccountDoc = {
    name: discountAccountName,
    rootType: AccountRootTypeEnum.Income,
    parentAccount: incomeAccountName,
    accountType: 'Income Account',
    isGroup: false,
  };

  await checkAndCreateDoc(ModelNameEnum.Account, discountAccountDoc, fyo);
  await fyo.singles.AccountingSettings!.setAndSync(
    'discountAccount',
    discountAccountName
  );
}

async function setDefaultAccounts(fyo: Fyo) {
  await setDefaultAccount('writeOffAccount', fyo.t`Write Off`, fyo);
  const isSet = await setDefaultAccount(
    'roundOffAccount',
    fyo.t`Rounded Off`,
    fyo
  );

  if (!isSet) {
    await setDefaultAccount('roundOffAccount', fyo.t`Round Off`, fyo);
  }
}

async function setDefaultAccount(key: string, accountName: string, fyo: Fyo) {
  const accountExists = await fyo.db.exists(ModelNameEnum.Account, accountName);
  if (!accountExists) {
    return false;
  }

  await fyo.singles.AccountingSettings!.setAndSync(key, accountName);
  return true;
}

async function completeSetup(companyName: string, fyo: Fyo) {
  await fyo.singles.AccountingSettings!.setAndSync('setupComplete', true);
}

async function checkAndCreateDoc(
  schemaName: string,
  docObject: DocValueMap,
  fyo: Fyo
): Promise<Doc | undefined> {
  const canCreate = await checkIfExactRecordAbsent(schemaName, docObject, fyo);
  if (!canCreate) {
    return;
  }

  const doc = fyo.doc.getNewDoc(schemaName, docObject);
  return doc.sync();
}

async function checkIfExactRecordAbsent(
  schemaName: string,
  docMap: DocValueMap,
  fyo: Fyo
) {
  const name = docMap.name as string;
  const newDocObject = Object.assign({}, docMap);

  const rows = await fyo.db.getAllRaw(schemaName, {
    fields: ['*'],
    filters: { name },
  });

  if (rows.length === 0) {
    return true;
  }

  const storedDocObject = rows[0];
  const matchList = Object.keys(newDocObject).map((key) => {
    const newValue = newDocObject[key];
    const storedValue = storedDocObject[key];
    return newValue == storedValue; // Should not be type sensitive.
  });

  if (!matchList.every(Boolean)) {
    await fyo.db.delete(schemaName, name);
    return true;
  }

  return false;
}

async function getBankAccountParentName(country: string, fyo: Fyo) {
  const parentBankAccount = await fyo.db.getAllRaw('Account', {
    fields: ['*'],
    filters: { isGroup: true, accountType: 'Bank' },
  });

  if (parentBankAccount.length === 0) {
    // This should not happen if the fixtures are correct.
    return 'Bank Accounts';
  } else if (parentBankAccount.length > 1) {
    switch (country) {
      case 'Indonesia':
        return 'Bank Rupiah - 1121.000';
      default:
        break;
    }
  }

  return parentBankAccount[0].name;
}

async function createDefaultNumberSeries(fyo: Fyo) {
  const numberSeriesFields = Object.values(fyo.schemaMap)
    .map((f) => f?.fields)
    .flat()
    .filter((f) => f?.fieldname === 'numberSeries');

  for (const field of numberSeriesFields) {
    const defaultValue = field?.default as string | undefined;
    const schemaName = field?.schemaName;
    if (!defaultValue || !schemaName) {
      continue;
    }

    await createNumberSeries(
      defaultValue,
      schemaName,
      DEFAULT_SERIES_START,
      fyo
    );

    const defaultKey = numberSeriesDefaultsMap[schemaName];
    if (!defaultKey || fyo.singles.Defaults?.[defaultKey]) {
      continue;
    }

    await fyo.singles.Defaults?.setAndSync(defaultKey as string, defaultValue);
  }
}

async function updateInventorySettings(fyo: Fyo) {
  const inventorySettings = (await fyo.doc.getDoc(
    ModelNameEnum.InventorySettings
  )) as InventorySettings;

  if (!inventorySettings.valuationMethod) {
    await inventorySettings.set('valuationMethod', ValuationMethod.FIFO);
  }
  const accountTypeDefaultMap = {
    [AccountTypeEnum.Stock]: 'stockInHand',
    [AccountTypeEnum['Stock Received But Not Billed']]:
      'stockReceivedButNotBilled',
    [AccountTypeEnum['Cost of Goods Sold']]: 'costOfGoodsSold',
  } as Record<string, string>;

  for (const accountType in accountTypeDefaultMap) {
    const accounts = (await fyo.db.getAllRaw('Account', {
      filters: { accountType, isGroup: false },
    })) as { name: string }[];

    if (!accounts.length) {
      continue;
    }

    const settingName = accountTypeDefaultMap[accountType]!;
    await inventorySettings.set(settingName, accounts[0].name);
  }

  const location = fyo.t`Stores`;
  if (await fyo.db.exists(ModelNameEnum.Location, location)) {
    await inventorySettings.set('defaultLocation', location);
  }

  await inventorySettings.sync();
}

async function createDefaultRoles(fyo: Fyo) {
  /**
   * Create default roles: Owner, Manager, Accountant, Sales, Purchase
   */
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
    },
  ];

  const rolePromises = defaultRoles.map((role) =>
    checkAndCreateDoc('Role', role, fyo)
  );

  await Promise.all(rolePromises);
}
