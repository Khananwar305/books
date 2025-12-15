import { Fyo } from 'fyo';
import {
  AccountRootType,
  COAChildAccount,
  COARootAccount,
  COATree,
} from 'models/baseModels/Account/types';
import { getCOAList } from 'models/baseModels/SetupWizard/SetupWizard';
import { getStandardCOA } from './standardCOA';

const accountFields = ['accountType', 'accountNumber', 'rootType', 'isGroup'];

export class CreateCOA {
  fyo: Fyo;
  chartOfAccounts: string;

  constructor(chartOfAccounts: string, fyo: Fyo) {
    this.chartOfAccounts = chartOfAccounts;
    this.fyo = fyo;
  }

  async run() {
    const chart = await getCOA(this.chartOfAccounts);
    await this.createCOAAccountsOptimized(chart, null, '', true);
  }

  async createCOAAccountsOptimized(
    children: COATree | COARootAccount | COAChildAccount,
    parentAccount: string | null,
    rootType: AccountRootType | '',
    rootAccount: boolean
  ) {
    // Create accounts at current level in parallel
    const accountPromises = [];
    const childProcessing = [];

    for (const rootName in children) {
      if (accountFields.includes(rootName)) {
        continue;
      }

      const child = children[rootName];

      if (rootAccount) {
        rootType = (child as COARootAccount).rootType;
      }

      const accountType = (child as COAChildAccount).accountType ?? '';
      const accountNumber = (child as COAChildAccount).accountNumber;
      const accountName = getAccountName(rootName, accountNumber);

      const isGroup = identifyIsGroup(
        child as COAChildAccount | COARootAccount
      );

      const doc = this.fyo.doc.getNewDoc('Account', {
        name: accountName,
        parentAccount,
        isGroup,
        rootType,
        accountType,
      });

      // Add to parallel creation batch
      accountPromises.push(doc.sync());

      // Store child processing for after parent creation
      childProcessing.push({
        child: child as COAChildAccount,
        accountName,
        rootType,
      });
    }

    // Wait for all accounts at this level to be created
    await Promise.all(accountPromises);

    // Now process children in parallel
    const childPromises = childProcessing.map(({ child, accountName, rootType }) =>
      this.createCOAAccountsOptimized(child, accountName, rootType, false)
    );

    await Promise.all(childPromises);
  }

  async createCOAAccounts(
    children: COATree | COARootAccount | COAChildAccount,
    parentAccount: string | null,
    rootType: AccountRootType | '',
    rootAccount: boolean
  ) {
    for (const rootName in children) {
      if (accountFields.includes(rootName)) {
        continue;
      }

      const child = children[rootName];

      if (rootAccount) {
        rootType = (child as COARootAccount).rootType;
      }

      const accountType = (child as COAChildAccount).accountType ?? '';
      const accountNumber = (child as COAChildAccount).accountNumber;
      const accountName = getAccountName(rootName, accountNumber);

      const isGroup = identifyIsGroup(
        child as COAChildAccount | COARootAccount
      );

      const doc = this.fyo.doc.getNewDoc('Account', {
        name: accountName,
        parentAccount,
        isGroup,
        rootType,
        accountType,
      });

      await doc.sync();
      await this.createCOAAccounts(
        child as COAChildAccount,
        accountName,
        rootType,
        false
      );
    }
  }
}

function identifyIsGroup(child: COARootAccount | COAChildAccount): boolean {
  if (child.isGroup !== undefined) {
    return child.isGroup as boolean;
  }

  const keys = Object.keys(child);
  const children = keys.filter((key) => !accountFields.includes(key));

  if (children.length) {
    return true;
  }

  return false;
}

async function getCOA(chartOfAccounts: string): Promise<COATree> {
  const coaList = getCOAList();
  const coa = coaList.find(({ name }) => name === chartOfAccounts);

  const conCode = coa?.countryCode;
  if (!conCode) {
    return getStandardCOA();
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const countryCoa = (await import(`../../fixtures/verified/${conCode}.json`))
      .default as { tree: COATree };
    return countryCoa.tree;
  } catch (e) {
    return getStandardCOA();
  }
}

function getAccountName(accountName: string, accountNumber?: string) {
  if (accountNumber) {
    return `${accountName} - ${accountNumber}`;
  }

  return accountName;
}
