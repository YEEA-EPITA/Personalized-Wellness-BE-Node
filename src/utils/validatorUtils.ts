import * as Yup from 'yup';
import mongoose from 'mongoose';

interface ValidationResult<T> {
  parameters?: T;
  errors?: string;
}

const validate = async <T extends Yup.Maybe<Yup.AnyObject>>(
  schema: Yup.ObjectSchema<T>,
  data: unknown
): Promise<ValidationResult<T>> => {
  try {
    const validated = await schema.validate(data, { abortEarly: false });
    if (validated != null) {
      return { parameters: validated as T };
    }
    return {
      errors: 'Validation returned null or undefined unexpectedly.',
    };
  } catch (err: any) {
    return {
      errors: err.errors?.join(', ') || 'Validation error',
    };
  }
};

const mongooseIdValidate = (name: string): Yup.StringSchema<string> => {
  return Yup.string()
    .required(`${name} ID is required`)
    .test({
      name: 'Id validation',
      message: `Invalid ${name} id`,
      test: value => (value ? mongoose.Types.ObjectId.isValid(value) : true),
    });
};

export default {
  validate,
  mongooseIdValidate,
};
