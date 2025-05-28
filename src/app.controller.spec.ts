import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FastifyReply } from 'fastify';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  describe('health', () => {
    it('should return health status', () => {
      const result = appController.getHealth();
      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('service', 'slink-up-api');
      expect(result).toHaveProperty('environment');
      expect(result).toHaveProperty('timestamp');
    });
  });

  describe('root', () => {
    it('should redirect to API docs', () => {
      // Mock FastifyReply
      const mockReply = {
        status: jest.fn().mockReturnThis(),
        redirect: jest.fn().mockReturnThis(),
      } as unknown as FastifyReply;

      appController.getRoot(mockReply);

      expect(mockReply.status).toHaveBeenCalledWith(302);
      expect(mockReply.redirect).toHaveBeenCalledWith('/api/docs');
    });
  });
});
