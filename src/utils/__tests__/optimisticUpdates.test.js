import {
  performOptimisticUpdate,
  handleOptimisticError,
  createTemporaryComment,
  reconcileComment,
  removeTemporaryComment,
  validateComment,
  ERROR_MESSAGES
} from '../optimisticUpdates';

describe('Optimistic Update Utilities', () => {
  describe('performOptimisticUpdate', () => {
    it('should execute optimistic action, API call, and success action in order', async () => {
      const mockOptimisticAction = jest.fn();
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'success' });
      const mockSuccessAction = jest.fn();
      const mockSetLoadingState = jest.fn();

      const result = await performOptimisticUpdate({
        optimisticAction: mockOptimisticAction,
        apiCall: mockApiCall,
        successAction: mockSuccessAction,
        setLoadingState: mockSetLoadingState,
        loadingKey: 'test'
      });

      expect(mockOptimisticAction).toHaveBeenCalled();
      expect(mockApiCall).toHaveBeenCalled();
      expect(mockSuccessAction).toHaveBeenCalledWith({ data: 'success' });
      expect(result).toEqual({ data: 'success' });
    });

    it('should revert optimistic changes on API failure', async () => {
      const mockOptimisticAction = jest.fn();
      const mockApiCall = jest.fn().mockRejectedValue(new Error('API Error'));
      const mockRevertAction = jest.fn();
      const mockOnError = jest.fn();

      await expect(performOptimisticUpdate({
        optimisticAction: mockOptimisticAction,
        apiCall: mockApiCall,
        revertAction: mockRevertAction,
        onError: mockOnError
      })).rejects.toThrow('API Error');

      expect(mockOptimisticAction).toHaveBeenCalled();
      expect(mockRevertAction).toHaveBeenCalled();
      expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should manage loading state correctly', async () => {
      const mockSetLoadingState = jest.fn();
      const mockApiCall = jest.fn().mockResolvedValue({ data: 'success' });

      await performOptimisticUpdate({
        apiCall: mockApiCall,
        setLoadingState: mockSetLoadingState,
        loadingKey: 'test'
      });

      expect(mockSetLoadingState).toHaveBeenCalledWith(expect.any(Function));
      expect(mockSetLoadingState).toHaveBeenCalledTimes(2); // Once for start, once for end
    });
  });

  describe('handleOptimisticError', () => {
    it('should return network error message for requests without response', () => {
      const error = new Error('Network Error');
      const message = handleOptimisticError(error);
      
      expect(message).toBe('Network error. Please check your connection and try again.');
    });

    it('should return validation error message for 400 status', () => {
      const error = {
        response: {
          status: 400,
          data: { message: 'Invalid input' }
        }
      };
      const message = handleOptimisticError(error);
      
      expect(message).toBe('Invalid input');
    });

    it('should return authentication error message for 401 status', () => {
      const error = {
        response: {
          status: 401,
          data: {}
        }
      };
      const message = handleOptimisticError(error);
      
      expect(message).toBe('Authentication required. Please log in again.');
    });

    it('should call appropriate error handlers', () => {
      const mockOnNetworkError = jest.fn();
      const error = new Error('Network Error');
      
      handleOptimisticError(error, { onNetworkError: mockOnNetworkError });
      
      expect(mockOnNetworkError).toHaveBeenCalledWith(error);
    });
  });

  describe('createTemporaryComment', () => {
    it('should create a temporary comment with correct structure', () => {
      const user = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com'
      };
      const commentText = 'Test comment';

      const tempComment = createTemporaryComment(commentText, user);

      expect(tempComment).toMatchObject({
        Comment_text: commentText,
        Comment_user: {
          _id: user._id,
          User_name: user.name,
          User_email: user.email
        },
        isTemporary: true
      });
      expect(tempComment._id).toMatch(/^temp_/);
      expect(tempComment.Comment_createdAt).toBeDefined();
    });
  });

  describe('reconcileComment', () => {
    it('should replace temporary comment with server comment', () => {
      const comments = [
        { _id: 'real1', Comment_text: 'Real comment' },
        { _id: 'temp_123', Comment_text: 'Temp comment', isTemporary: true }
      ];
      const serverComment = { _id: 'real2', Comment_text: 'Server comment' };

      const result = reconcileComment(comments, serverComment, 'temp_123');

      expect(result).toHaveLength(2);
      expect(result[1]).toEqual({ ...serverComment, isTemporary: false });
      expect(result[0]).toEqual(comments[0]);
    });
  });

  describe('removeTemporaryComment', () => {
    it('should remove temporary comment from array', () => {
      const comments = [
        { _id: 'real1', Comment_text: 'Real comment' },
        { _id: 'temp_123', Comment_text: 'Temp comment', isTemporary: true }
      ];

      const result = removeTemporaryComment(comments, 'temp_123');

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(comments[0]);
    });
  });

  describe('validateComment', () => {
    it('should validate valid comment text', () => {
      const result = validateComment('Valid comment');
      
      expect(result.isValid).toBe(true);
      expect(result.error).toBeNull();
    });

    it('should reject empty comment text', () => {
      const result = validateComment('   ');
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment cannot be empty');
    });

    it('should reject null or undefined comment text', () => {
      const result1 = validateComment(null);
      const result2 = validateComment(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
      expect(result1.error).toBe('Comment text is required');
      expect(result2.error).toBe('Comment text is required');
    });

    it('should reject comment text that is too long', () => {
      const longText = 'a'.repeat(1001);
      const result = validateComment(longText);
      
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Comment is too long (maximum 1000 characters)');
    });
  });

  describe('ERROR_MESSAGES', () => {
    it('should contain all required error message constants', () => {
      expect(ERROR_MESSAGES.ASSIGNMENT_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.COMMENT_ADD_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.COMMENT_DELETE_FAILED).toBeDefined();
      expect(ERROR_MESSAGES.NETWORK_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.PERMISSION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.VALIDATION_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.SERVER_ERROR).toBeDefined();
      expect(ERROR_MESSAGES.GENERIC_ERROR).toBeDefined();
    });
  });
});