import {
  Model,
  Document,
  ClientSession,
  FilterQuery,
  UpdateQuery,
  PopulateOptions,
} from 'mongoose';
import { GeneralEntityFactory } from './entities';

interface CreateArgs<T> {
  model: Model<T>;
  data: T | T[];
  session?: ClientSession;
}

interface UpdateOneArgs<T> {
  model: Model<T>;
  query: FilterQuery<T>;
  data: UpdateQuery<T>;
  session?: ClientSession;
}

interface UpdateManyArgs<T> {
  model: Model<T>;
  query: FilterQuery<T>;
  data: UpdateQuery<T>;
  session?: ClientSession;
}

interface FindOneArgs<T> {
  model: Model<T>;
  query: FilterQuery<T>;
  popOpts?: string | PopulateOptions | (string | PopulateOptions)[];
}

export const create = async <T extends Document>({
  model,
  data,
  session,
}: CreateArgs<T>) => {
  let savedData: T | T[];

  if (Array.isArray(data)) {
    savedData = await model.create(data, { session });
  } else {
    const doc = new model(data);
    savedData = await doc.save({ session });
  }

  const cleanedData = GeneralEntityFactory.cleanMongooseData({
    data: savedData,
  });

  return { success: !!savedData, doc: cleanedData };
};

export const updateOne = async <T extends Document>({
  model,
  query,
  data,
  session,
}: UpdateOneArgs<T>) => {
  const updateArgs = { new: true, session };
  const updatedDoc = await model.findOneAndUpdate(query, data, updateArgs);

  let doc = null;
  if (updatedDoc) {
    doc = GeneralEntityFactory.cleanMongooseData({ data: updatedDoc });
  }

  return { success: true, doc };
};

export const updateMany = async <T extends Document>({
  model,
  query,
  data,
  session,
}: UpdateManyArgs<T>) => {
  const updateArgs = { session };

  // Mongoose's updateMany does not return updated documents by default.
  const updateResult = await model.updateMany(query, data, updateArgs);

  let docs: any[] = [];

  // If you want to return the updated documents, you need to query them again.
  if (updateResult.modifiedCount > 0) {
    const updatedDocs = await model.find(query).session(session || null);
    docs = GeneralEntityFactory.cleanMongooseData({ data: updatedDocs });
  }

  return { success: true, docs };
};

export const findOne = async <T extends Document>({
  model,
  query,
  popOpts,
}: FindOneArgs<T>) => {
  let docQuery = model.findOne(query);

  if (typeof popOpts === 'string') {
    docQuery = docQuery.populate(popOpts);
  } else if (Array.isArray(popOpts)) {
    docQuery = docQuery.populate(popOpts as (string | PopulateOptions)[]);
  } else if (popOpts && typeof popOpts === 'object') {
    docQuery = docQuery.populate(popOpts as PopulateOptions);
  }

  let doc = await docQuery;

  if (doc) {
    doc = GeneralEntityFactory.cleanMongooseData({ data: doc });
  }

  return { success: true, doc };
};
