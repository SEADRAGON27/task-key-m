export const bookingResponseSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer', example: 3 },
    date: {
      type: 'string',
      format: 'date-time',
      example: '2000-05-25T21:00:00.000Z',
    },
    startTime: { type: 'string', example: '12:36:00' },
    endTime: { type: 'string', example: '14:44:00' },
    userId: { type: 'integer', example: 3 },
    createdAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-12-07T19:41:39.900Z',
    },
    updatedAt: {
      type: 'string',
      format: 'date-time',
      example: '2024-12-08T12:06:56.315Z',
    },
  },
};

export const bookingsResponseSchema = {
  type: 'array',
  items: bookingResponseSchema,
};

export const error403NotAvailableSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 403 },
    message: {
      type: 'string',
      example: 'Booking is not available for the selected time.',
    },
  },
};

export const error404Schema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 404 },
    message: { type: 'string', example: "Booking doesn't exist." },
  },
};

export const error403NotAuthorSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 403 },
    message: { type: 'string', example: 'You are not an author.' },
  },
};

export const bookingDeletedSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', example: 'Booking deleted successfully.' },
  },
};

export const error401NotAuthorizedSchema = {
  type: 'object',
  properties: {
    statusCode: { type: 'number', example: 401 },
    message: { type: 'string', example: 'No authorized!' },
  },
};
