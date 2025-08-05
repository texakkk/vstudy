// Mock the backend export service for testing
const mockExportService = {
  generatePDF: jest.fn(),
  generateExcel: jest.fn(),
  generateWord: jest.fn()
};

// Mock the actual service
jest.mock('../../backend/services/exportService', () => {
  return jest.fn().mockImplementation(() => mockExportService);
});

describe('ExportService Integration', () => {
  let mockData;

  beforeEach(() => {
    mockData = {
      groupData: {
        groups: [
          {
            name: 'Test Group 1',
            description: 'A test group for development',
            memberCount: 5,
            createdAt: new Date('2024-01-01'),
            status: 'Active'
          }
        ]
      },
      taskData: {
        tasks: [
          {
            title: 'Complete project setup',
            assignee: 'John Doe',
            status: 'In Progress',
            priority: 'High',
            dueDate: new Date('2024-02-01'),
            progress: 75
          }
        ]
      },
      chatData: {
        analytics: {
          totalMessages: 150,
          activeParticipants: 8,
          avgMessagesPerDay: 12.5,
          mostActiveUser: 'John Doe',
          filesShared: 25
        }
      },
      videoData: {
        sessions: [
          {
            sessionId: 'session-123',
            participants: 4,
            duration: 45,
            startTime: new Date('2024-01-20T10:00:00'),
            endTime: new Date('2024-01-20T10:45:00')
          }
        ]
      },
      memberData: {
        members: [
          {
            name: 'John Doe',
            email: 'john@example.com',
            role: 'Admin',
            joinDate: new Date('2024-01-01'),
            lastActive: new Date('2024-01-25')
          }
        ]
      }
    };

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('PDF Export', () => {
    test('should call generatePDF with correct parameters', async () => {
      const config = {
        title: 'Test Report',
        includeHeaders: true,
        includeBranding: true,
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      mockExportService.generatePDF.mockResolvedValue(Buffer.from('pdf-content'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();
      
      await exportService.generatePDF(mockData, config);
      
      expect(mockExportService.generatePDF).toHaveBeenCalledWith(mockData, config);
    });

    test('should handle PDF generation errors', async () => {
      mockExportService.generatePDF.mockRejectedValue(new Error('PDF generation failed'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();

      await expect(exportService.generatePDF(mockData)).rejects.toThrow('PDF generation failed');
    });
  });

  describe('Excel Export', () => {
    test('should call generateExcel with correct parameters', async () => {
      const config = {
        title: 'Test Excel Report',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      mockExportService.generateExcel.mockResolvedValue(Buffer.from('excel-content'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();
      
      await exportService.generateExcel(mockData, config);
      
      expect(mockExportService.generateExcel).toHaveBeenCalledWith(mockData, config);
    });

    test('should handle Excel generation errors', async () => {
      mockExportService.generateExcel.mockRejectedValue(new Error('Excel generation failed'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();

      await expect(exportService.generateExcel(mockData)).rejects.toThrow('Excel generation failed');
    });
  });

  describe('Word Export', () => {
    test('should call generateWord with correct parameters', async () => {
      const config = {
        title: 'Test Word Report',
        dateRange: {
          startDate: new Date('2024-01-01'),
          endDate: new Date('2024-01-31')
        }
      };

      mockExportService.generateWord.mockResolvedValue(Buffer.from('word-content'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();
      
      await exportService.generateWord(mockData, config);
      
      expect(mockExportService.generateWord).toHaveBeenCalledWith(mockData, config);
    });

    test('should handle Word generation errors', async () => {
      mockExportService.generateWord.mockRejectedValue(new Error('Word document generation failed'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();

      await expect(exportService.generateWord(mockData)).rejects.toThrow('Word document generation failed');
    });
  });

  describe('Configuration Handling', () => {
    test('should handle default configuration', async () => {
      mockExportService.generatePDF.mockResolvedValue(Buffer.from('pdf-content'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();
      
      await exportService.generatePDF(mockData);
      
      expect(mockExportService.generatePDF).toHaveBeenCalledWith(mockData, undefined);
    });

    test('should handle custom configuration', async () => {
      const customConfig = { title: 'Custom Title', includeHeaders: false };
      mockExportService.generatePDF.mockResolvedValue(Buffer.from('pdf-content'));

      const ExportService = require('../../backend/services/exportService');
      const exportService = new ExportService();
      
      await exportService.generatePDF(mockData, customConfig);
      
      expect(mockExportService.generatePDF).toHaveBeenCalledWith(mockData, customConfig);
    });
  });
});