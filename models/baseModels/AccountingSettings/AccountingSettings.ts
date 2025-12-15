import { Doc } from 'fyo/model/doc';
import {
  ChangeArg,
  FiltersMap,
  HiddenMap,
  ListsMap,
  ReadOnlyMap,
  ValidationMap,
  FormulaMap,
} from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import { InventorySettings } from 'models/inventory/InventorySettings';
import { ModelNameEnum } from 'models/types';
import { createDiscountAccount } from 'src/setup/setupInstance';
import { getCountryInfo } from 'utils/misc';

function getAdministrativeDivisionLabel(country: string): string {
  const labelMap: Record<string, string> = {
    'United States': 'State',
    'India': 'State',
    'Canada': 'Province',
    'United Arab Emirates': 'Emirate',
    'France': 'Region',
    'Germany': 'State',
    'Indonesia': 'Province',
    'Mexico': 'State',
    'United Kingdom': 'Country',
    'Australia': 'State/Territory',
    'China': 'Province',
    'Japan': 'Prefecture',
    'Brazil': 'State',
    'Russia': 'Federal Subject',
    'Italy': 'Region',
    'Spain': 'Autonomous Community',
    'Argentina': 'Province',
    'Saudi Arabia': 'Region',
    'Egypt': 'Governorate',
    'Nigeria': 'State',
    'South Africa': 'Province',
    'Pakistan': 'Province',
    'Bangladesh': 'Division',
    'Philippines': 'Region',
    'Thailand': 'Province',
    'Vietnam': 'Province',
    'Malaysia': 'State',
    'Singapore': 'Region',
    'Netherlands': 'Province',
    'Belgium': 'Region',
    'Switzerland': 'Canton',
    'Austria': 'State',
    'Sweden': 'County',
    'Norway': 'County',
    'Denmark': 'Region',
    'Finland': 'Region',
    'Poland': 'Voivodeship',
    'Turkey': 'Province',
    'Greece': 'Region',
    'Portugal': 'Region',
    'Ireland': 'County',
    'New Zealand': 'Region',
    'South Korea': 'Province',
  };

  return labelMap[country] || 'State/Province';
}

function getDistrictsByCountry(): Record<string, string[]> {
  return {
    India: [
      'Andhra Pradesh',
      'Arunachal Pradesh',
      'Assam',
      'Bihar',
      'Chhattisgarh',
      'Goa',
      'Gujarat',
      'Haryana',
      'Himachal Pradesh',
      'Jharkhand',
      'Karnataka',
      'Kerala',
      'Madhya Pradesh',
      'Maharashtra',
      'Manipur',
      'Meghalaya',
      'Mizoram',
      'Nagaland',
      'Odisha',
      'Punjab',
      'Rajasthan',
      'Sikkim',
      'Tamil Nadu',
      'Telangana',
      'Tripura',
      'Uttar Pradesh',
      'Uttarakhand',
      'West Bengal',
      'Delhi',
      'Jammu and Kashmir',
      'Ladakh',
    ],
    'United States': [
      'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado',
      'Connecticut', 'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho',
      'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana',
      'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota',
      'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
      'New Hampshire', 'New Jersey', 'New Mexico', 'New York',
      'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon',
      'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
      'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington',
      'West Virginia', 'Wisconsin', 'Wyoming',
    ],
    Canada: [
      'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick',
      'Newfoundland and Labrador', 'Nova Scotia', 'Ontario',
      'Prince Edward Island', 'Quebec', 'Saskatchewan',
      'Northwest Territories', 'Nunavut', 'Yukon',
    ],
    'United Kingdom': [
      'England', 'Scotland', 'Wales', 'Northern Ireland',
    ],
    Australia: [
      'New South Wales', 'Victoria', 'Queensland', 'South Australia',
      'Western Australia', 'Tasmania', 'Northern Territory',
      'Australian Capital Territory',
    ],
    'United Arab Emirates': [
      'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain',
      'Ras Al Khaimah', 'Fujairah',
    ],
    France: [
      'Île-de-France', 'Auvergne-Rhône-Alpes', 'Nouvelle-Aquitaine',
      'Occitanie', 'Provence-Alpes-Côte d\'Azur', 'Hauts-de-France',
      'Pays de la Loire', 'Bretagne', 'Normandie', 'Grand Est',
      'Bourgogne-Franche-Comté', 'Centre-Val de Loire', 'Corsica',
    ],
    Germany: [
      'Baden-Württemberg', 'Bavaria', 'Berlin', 'Brandenburg', 'Bremen',
      'Hamburg', 'Hesse', 'Lower Saxony', 'Mecklenburg-Vorpommern',
      'North Rhine-Westphalia', 'Rhineland-Palatinate', 'Saarland',
      'Saxony', 'Saxony-Anhalt', 'Schleswig-Holstein', 'Thuringia',
    ],
    Indonesia: [
      'Aceh', 'North Sumatra', 'West Sumatra', 'Riau', 'Jambi',
      'South Sumatra', 'Bengkulu', 'Lampung', 'Bangka Belitung',
      'Riau Islands', 'Jakarta', 'West Java', 'Central Java',
      'East Java', 'Banten', 'Yogyakarta', 'Bali', 'West Nusa Tenggara',
      'East Nusa Tenggara', 'West Kalimantan', 'Central Kalimantan',
      'South Kalimantan', 'East Kalimantan', 'North Kalimantan',
      'North Sulawesi', 'Central Sulawesi', 'South Sulawesi',
      'Southeast Sulawesi', 'Gorontalo', 'West Sulawesi', 'Maluku',
      'North Maluku', 'Papua', 'West Papua',
    ],
    Mexico: [
      'Aguascalientes', 'Baja California', 'Baja California Sur',
      'Campeche', 'Chiapas', 'Chihuahua', 'Coahuila', 'Colima',
      'Durango', 'Guanajuato', 'Guerrero', 'Hidalgo', 'Jalisco',
      'Mexico City', 'State of Mexico', 'Michoacán', 'Morelos',
      'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro',
      'Quintana Roo', 'San Luis Potosí', 'Sinaloa', 'Sonora',
      'Tabasco', 'Tamaulipas', 'Tlaxcala', 'Veracruz', 'Yucatán',
      'Zacatecas',
    ],
  };
}

export class AccountingSettings extends Doc {
  enableDiscounting?: boolean;
  enableInventory?: boolean;
  enablePriceList?: boolean;
  enableLead?: boolean;
  enableCouponCode?: boolean;
  enableFormCustomization?: boolean;
  enableInvoiceReturns?: boolean;
  enableLoyaltyProgram?: boolean;
  enablePricingRule?: boolean;
  enaenableItemEnquiry?: boolean;
  enableManualInvoiceNumbering?: boolean;
  invoiceNumberPrefix?: string;
  currentInvoiceNumber?: number;

  /**
   * Get the next invoice number with optional prefix
   */
  getNextInvoiceNumber(): string {
    const prefix = this.invoiceNumberPrefix || '';
    const number = this.currentInvoiceNumber || 1;
    return `${prefix}${number}`;
  }

  /**
   * Increment the invoice counter and return the new number
   */
  async generateNextInvoiceNumber(): Promise<string> {
    const nextNumber = this.getNextInvoiceNumber();
    const newCounter = (this.currentInvoiceNumber || 1) + 1;
    await this.set('currentInvoiceNumber', newCounter);
    await this.sync();
    return nextNumber;
  }
  enableERPNextSync?: boolean;
  enablePointOfSaleWithOutInventory?: boolean;
  enablePartialPayment?: boolean;
  enableitemGroup?: boolean;

  getLabel(fieldname: string): string {
    if (fieldname === 'district') {
      const country = this.get('country') as string | undefined;
      if (country) {
        const districtMap = getDistrictsByCountry();
        const districts = districtMap[country];

        // If no districts defined for this country, use generic label
        if (!districts || districts.length === 0) {
          return 'State/Province';
        }

        return getAdministrativeDivisionLabel(country);
      }
      return 'State/Province';
    }
    return super.getLabel?.(fieldname) || '';
  }

  formulas: FormulaMap = {
    district: {
      formula: () => {
        // Clear district when country changes
        if (!this.country) {
          return '';
        }
        const districtMap = getDistrictsByCountry();
        const districts = districtMap[this.country as string];
        const currentDistrict = this.get('district') as string | undefined;

        // If country doesn't have districts, auto-select "Not Applicable"
        if (!districts || districts.length === 0) {
          return 'Not Applicable';
        }

        // If current district is not in the new country's list, clear it
        if (currentDistrict && currentDistrict !== 'Not Applicable' && !districts.includes(currentDistrict)) {
          return '';
        }
      },
      dependsOn: ['country'],
    },
  };

  static filters: FiltersMap = {
    writeOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
    roundOffAccount: () => ({
      isGroup: false,
      rootType: 'Expense',
    }),
    discountAccount: () => ({
      isGroup: false,
      rootType: 'Income',
    }),
  };

  validations: ValidationMap = {
    email: (value: unknown) => {
      // Only validate email if it has a value
      if (value && typeof value === 'string' && value.trim().length > 0) {
        validateEmail(value);
      }
    },
  };

  static lists: ListsMap = {
    country: () => Object.keys(getCountryInfo()),
    district: (doc?: Doc) => {
      if (!doc) {
        return ['Not Applicable'];
      }
      const country = doc.get('country') as string | undefined;
      if (!country) {
        return ['Not Applicable'];
      }
      const districtMap = getDistrictsByCountry();
      const districts = districtMap[country];

      // If country doesn't have districts defined, return "Not Applicable"
      if (!districts || districts.length === 0) {
        return ['Not Applicable'];
      }

      return districts;
    },
  };

  readOnly: ReadOnlyMap = {
    enableDiscounting: () => {
      return !!this.enableDiscounting;
    },
    enableInventory: () => {
      return !!this.enableInventory;
    },
    enableLead: () => {
      return !!this.enableLead;
    },
    enableERPNextSync: () => {
      return !!this.enableERPNextSync;
    },
    enableInvoiceReturns: () => {
      return !!this.enableInvoiceReturns;
    },
    enableLoyaltyProgram: () => {
      return !!this.enableLoyaltyProgram;
    },
    enablePointOfSaleWithOutInventory: () => {
      return !!this.enablePointOfSaleWithOutInventory;
    },
    enableitemGroup: () => {
      return !!this.enableitemGroup;
    },
  };

  override hidden: HiddenMap = {
    discountAccount: () => !this.enableDiscounting,
    gstin: () => this.fyo.singles.SystemSettings?.countryCode !== 'in',
    enablePricingRule: () =>
      !this.fyo.singles.AccountingSettings?.enableDiscounting,
    enableCouponCode: () =>
      !this.fyo.singles.AccountingSettings?.enablePricingRule,
  };

  async change(ch: ChangeArg) {
    const discountingEnabled =
      ch.changed === 'enableDiscounting' && this.enableDiscounting;
    const discountAccountNotSet = !this.discountAccount;

    if (discountingEnabled && discountAccountNotSet) {
      await createDiscountAccount(this.fyo);
    }

    if (
      ch.changed == 'enablePointOfSaleWithOutInventory' &&
      this.enablePointOfSaleWithOutInventory
    ) {
      const inventorySettings = (await this.fyo.doc.getDoc(
        ModelNameEnum.InventorySettings
      )) as InventorySettings;

      await inventorySettings.set('enableBatches', true);
      await inventorySettings.set('enableUomConversions', true);
      await inventorySettings.set('enableSerialNumber', true);
      await inventorySettings.set('enableBarcodes', true);
      await inventorySettings.set('enablePointOfSale', true);

      await inventorySettings.sync();
    }
  }
}
