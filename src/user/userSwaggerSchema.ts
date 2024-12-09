export const userResponseShema = {
  type: 'object',
  properties: {
    user: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        username: { type: 'string', example: 'nikita' },
        email: { type: 'string', example: 'nikita@gmail.com' },
        createdAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-08T15:58:06.006Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          example: '2024-12-08T15:58:06.006Z',
        },
        token: {
          type: 'string',
          example: 'Token',
        },
        tokenExpiration: { type: 'number', example: 90050050690 },
      },
    },
  },
};

export const userCreatedSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'You are registrated.' },
  },
};

export const error422ToCreateUserSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 422 },
    message: {
      type: 'string',
      example: "Password didn't match. OR Name or email is taken.",
    },
  },
};

export const error422ToLogInUserSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 422 },
    message: {
      type: 'string',
      example: 'User is unfound. OR Password is uncorrect.',
    },
  },
};

export const error401NotAuthorizedSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 401 },
    message: { type: 'string', example: 'No authorized!' },
  },
};

export const error403ForbiddenSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 403 },
    message: { type: 'string', example: 'Forbidden.' },
  },
};

export const refreshResponseSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string', example: 'Token' },
    tokenExpiration: { type: 'number', example: 90050050690 },
  },
};
