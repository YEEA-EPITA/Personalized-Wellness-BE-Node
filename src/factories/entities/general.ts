import omit from 'lodash/omit';

type CleanMongooseDataParams<T> = {
  data: T | T[];
  extraFieldsToOmit?: string[];
};

export default class GeneralEntityFactory {
  static cleanMongooseData<T extends { _id?: any; toJSON: () => object }>({
    data,
    extraFieldsToOmit = [],
  }: CleanMongooseDataParams<T>) {
    const fieldsToOmit = [
      '_id',
      '__v',
      'updatedAt',
      'createdAt',
      ...extraFieldsToOmit,
    ];

    const cleanObject = (obj: T) => ({
      id: obj?._id,
      ...omit(obj?.toJSON(), fieldsToOmit),
    });

    return Array.isArray(data)
      ? data.map(item => cleanObject(item))
      : cleanObject(data);
  }
}
