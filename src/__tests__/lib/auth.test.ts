import jwt from 'jsonwebtoken'
import { verifyToken, generateToken } from '@/lib/jwt'

jest.mock('jsonwebtoken')

const mockJwt = jwt as jest.Mocked<typeof jwt>

describe('JWT Authentication', () => {
  const mockSecret = 'test-secret'
  
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.JWT_SECRET = mockSecret
  })

  afterEach(() => {
    delete process.env.JWT_SECRET
  })

  describe('generateToken', () => {
    it('should generate a token with correct payload', () => {
      const payload = { userId: '1', email: 'test@example.com' }
      const mockToken = 'mock-jwt-token'
      
      mockJwt.sign.mockReturnValue(mockToken as any)
      
      const result = generateToken(payload)
      
      expect(mockJwt.sign).toHaveBeenCalledWith(
        payload,
        mockSecret,
        { expiresIn: '7d' }
      )
      expect(result).toBe(mockToken)
    })

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET
      
      expect(() => {
        generateToken({ userId: '1' })
      }).toThrow('JWT_SECRET is not defined')
    })
  })

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const mockToken = 'valid-token'
      const mockPayload = { userId: '1', email: 'test@example.com' }
      
      mockJwt.verify.mockReturnValue(mockPayload as any)
      
      const result = verifyToken(mockToken)
      
      expect(mockJwt.verify).toHaveBeenCalledWith(mockToken, mockSecret)
      expect(result).toEqual(mockPayload)
    })

    it('should throw error for invalid token', () => {
      const mockToken = 'invalid-token'
      
      mockJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token')
      })
      
      expect(() => {
        verifyToken(mockToken)
      }).toThrow('Invalid token')
    })

    it('should throw error when JWT_SECRET is missing', () => {
      delete process.env.JWT_SECRET
      
      expect(() => {
        verifyToken('any-token')
      }).toThrow('JWT_SECRET is not defined')
    })
  })
})