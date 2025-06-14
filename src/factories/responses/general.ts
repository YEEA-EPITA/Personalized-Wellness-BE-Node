import AppResponse from './AppResponse';

interface SuccessResponseParams {
  message: string;
  statusCode: number;
  data: any;
  key?: string;
}

interface DataOperationParams {
  data: any;
  key: string;
}

export default class GeneralResponsesFactory {
  static successResponse({
    message,
    statusCode,
    data,
    key,
  }: SuccessResponseParams): AppResponse {
    return new AppResponse({
      message,
      statusCode,
      body: key ? { [key]: data } : data,
    });
  }

  static dataSavedSuccessfully({
    data,
    key,
  }: DataOperationParams): AppResponse {
    return this.successResponse({
      message: 'Data saved successfully',
      statusCode: 201,
      data,
      key,
    });
  }

  static dataRetrievedSuccessfully({
    data,
    key,
  }: DataOperationParams): AppResponse {
    return this.successResponse({
      message: 'Data retrieved successfully',
      statusCode: 200,
      data,
      key,
    });
  }

  static dataUpdatedSuccessfully({
    data,
    key,
  }: DataOperationParams): AppResponse {
    return this.successResponse({
      message: 'Data updated successfully',
      statusCode: 200,
      data,
      key,
    });
  }

  static dataDeletedSuccessfully({
    data,
    key,
  }: DataOperationParams): AppResponse {
    return this.successResponse({
      message: 'Data deleted successfully',
      statusCode: 200,
      data,
      key,
    });
  }
}
