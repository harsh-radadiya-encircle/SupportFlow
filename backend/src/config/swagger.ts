import { Express } from 'express';
import swaggerUi from 'swagger-ui-express';

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'SupportFlow API Documentation',
    version: '1.0.0',
    description: 'RESTful API documentation for SupportFlow multi-tenant customer support platform',
  },
  servers: [
    {
      url: 'http://localhost:5000/api/v1',
      description: 'Development Local Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter Firebase ID Token or JWT Token',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  paths: {
    '/health': {
      get: {
        summary: 'Health check endpoint',
        responses: {
          '200': {
            description: 'API Server is healthy and running',
          },
        },
      },
    },
  },
};

export const setupSwagger = (app: Express) => {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
  console.log('[Swagger] API Documentation available at /api-docs');
};
