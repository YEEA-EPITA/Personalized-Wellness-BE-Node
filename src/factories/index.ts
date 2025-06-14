import * as ErrorsFactory from './errors';
import * as ResponsesFactory from './responses';
import * as EntitiesFactory from './entities';

export const { AppError, GeneralErrorsFactory, AuthErrors } = ErrorsFactory;

export const { AppResponse, GeneralResponsesFactory } = ResponsesFactory;

export const { GeneralEntityFactory } = EntitiesFactory;
