import { Fyo } from 'fyo';
import { Doc } from 'fyo/model/doc';
import { ListViewSettings, ValidationMap } from 'fyo/model/types';
import { validateEmail } from 'fyo/model/validationFunction';

export class User extends Doc {
  name?: string;
  email?: string;
  role?: string;
  isActive?: boolean;
  phone?: string;
  address?: string;
  department?: string;
  joiningDate?: Date;
  notes?: string;

  validations: ValidationMap = {
    email: validateEmail,
  };

  static getListViewSettings(): ListViewSettings {
    return {
      columns: ['name', 'email', 'role', 'isActive'],
    };
  }
}
