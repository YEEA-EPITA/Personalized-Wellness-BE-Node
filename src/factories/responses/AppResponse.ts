interface AppResponseParams {
  message?: string;
  statusCode?: number;
  body?: any;
}

class AppResponse {
  statusCode?: number;
  message?: string;
  body?: any;

  constructor({ message, statusCode, body }: AppResponseParams = {}) {
    this.statusCode = statusCode;
    this.message = message;
    this.body = body;
  }
}

export default AppResponse;
