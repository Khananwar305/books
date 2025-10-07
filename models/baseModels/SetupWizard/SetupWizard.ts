import { t } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { FormulaMap, ListsMap, ValidationMap } from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';
import { DateTime } from 'luxon';
import { getCountryInfo, getFiscalYear } from 'utils/misc';

function getCurrencyList(): { countryCode: string; name: string }[] {
  const result: { countryCode: string; name: string }[] = [];
  const countryInfo = getCountryInfo();
  for (const info of Object.values(countryInfo)) {
    const { currency, code } = info ?? {};
    if (typeof currency !== 'string' || typeof code !== 'string') {
      continue;
    }

    result.push({ name: currency, countryCode: code });
  }
  return result;
}

export function getCOAList() {
  return [
    { name: t`Standard Chart of Accounts`, countryCode: '' },

    { countryCode: 'ae', name: 'U.A.E - Chart of Accounts' },
    {
      countryCode: 'ca',
      name: 'Canada - Plan comptable pour les provinces francophones',
    },
    { countryCode: 'gt', name: 'Guatemala - Cuentas' },
    { countryCode: 'hu', name: 'Hungary - Chart of Accounts' },
    { countryCode: 'id', name: 'Indonesia - Chart of Accounts' },
    { countryCode: 'in', name: 'India - Chart of Accounts' },
    { countryCode: 'mx', name: 'Mexico - Plan de Cuentas' },
    { countryCode: 'ni', name: 'Nicaragua - Catalogo de Cuentas' },
    { countryCode: 'nl', name: 'Netherlands - Grootboekschema' },
    { countryCode: 'sg', name: 'Singapore - Chart of Accounts' },
    { countryCode: 'fr', name: 'France - Plan Comptable General' },
    /*
    { countryCode: 'th', name: 'Thailand - Chart of Accounts' },
    { countryCode: 'us', name: 'United States - Chart of Accounts' },
    { countryCode: 've', name: 'Venezuela - Plan de Cuentas' },
    { countryCode: 'za', name: 'South Africa - Chart of Accounts' },
    { countryCode: 'de', name: 'Germany - Kontenplan' },
    { countryCode: 'it', name: 'Italy - Piano dei Conti' },
    { countryCode: 'es', name: 'Spain - Plan de Cuentas' },
    { countryCode: 'pt', name: 'Portugal - Plan de Contas' },
    { countryCode: 'pl', name: 'Poland - Rejestr Kont' },
    { countryCode: 'ro', name: 'Romania - Contabilitate' },
    { countryCode: 'ru', name: 'Russia - Chart of Accounts' },
    { countryCode: 'se', name: 'Sweden - Kontoplan' },
    { countryCode: 'ch', name: 'Switzerland - Kontenplan' },
    { countryCode: 'tr', name: 'Turkey - Chart of Accounts' },*/
  ];
}

export function getAdministrativeDivisionLabel(country: string): string {
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

export class SetupWizard extends Doc {
  fiscalYearEnd?: Date;
  fiscalYearStart?: Date;

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
    fiscalYearStart: {
      formula: (fieldname?: string) => {
        if (
          fieldname === 'fiscalYearEnd' &&
          this.fiscalYearEnd &&
          !this.fiscalYearStart
        ) {
          return DateTime.fromJSDate(this.fiscalYearEnd)
            .minus({ years: 1 })
            .plus({ days: 1 })
            .toJSDate();
        }

        if (!this.country) {
          return;
        }

        const countryInfo = getCountryInfo();
        const fyStart =
          countryInfo[this.country as string]?.fiscal_year_start ?? '';
        return getFiscalYear(fyStart, true);
      },
      dependsOn: ['country', 'fiscalYearEnd'],
    },
    fiscalYearEnd: {
      formula: (fieldname?: string) => {
        if (
          fieldname === 'fiscalYearStart' &&
          this.fiscalYearStart &&
          !this.fiscalYearEnd
        ) {
          return DateTime.fromJSDate(this.fiscalYearStart)
            .plus({ years: 1 })
            .minus({ days: 1 })
            .toJSDate();
        }

        if (!this.country) {
          return;
        }

        const countryInfo = getCountryInfo();
        const fyEnd =
          countryInfo[this.country as string]?.fiscal_year_end ?? '';
        return getFiscalYear(fyEnd, false);
      },
      dependsOn: ['country', 'fiscalYearStart'],
    },
    currency: {
      formula: () => {
        const country = this.get('country');
        if (typeof country !== 'string') {
          return;
        }

        const countryInfo = getCountryInfo();
        const { code } = countryInfo[country] ?? {};
        if (!code) {
          return;
        }

        const currencyList = getCurrencyList();
        const currency = currencyList.find(
          ({ countryCode }) => countryCode === code
        );

        if (currency === undefined) {
          return currencyList[0].name;
        }

        return currency.name;
      },
      dependsOn: ['country'],
    },
    chartOfAccounts: {
      formula: () => {
        const country = this.get('country') as string | undefined;
        if (country === undefined) {
          return;
        }

        const countryInfo = getCountryInfo();
        const code = countryInfo[country]?.code;
        if (!code) {
          return;
        }
        const coaList = getCOAList();
        const coa = coaList.find(({ countryCode }) => countryCode === code);
        return coa?.name ?? coaList[0].name;
      },
      dependsOn: ['country'],
    },
  };

  validations: ValidationMap = {
    logo: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    email: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
      validateEmail(value);
    },
    mailingName: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    address: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    district: (value: unknown) => {
      if (!this.companyName && value && value !== 'Not Applicable') {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    pincode: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    phone: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    country: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    currency: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    bankName: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    chartOfAccounts: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    fiscalYearStart: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
    fiscalYearEnd: (value: unknown) => {
      if (!this.companyName && value) {
        throw new Error(t`Please enter Company Name first`);
      }
    },
  };

  static lists: ListsMap = {
    country: () => Object.keys(getCountryInfo()),
    currency: () => getCurrencyList().map(({ name }) => name),
    chartOfAccounts: () => getCOAList().map(({ name }) => name),
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
}
