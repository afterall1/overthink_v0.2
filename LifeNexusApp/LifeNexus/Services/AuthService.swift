import Foundation
import Security

// MARK: - Auth Session
struct AuthSession {
    let accessToken: String
    let refreshToken: String
    let user: User
    let expiresAt: Date
}

// MARK: - Auth Service
final class AuthService {
    static let shared = AuthService()
    
    // MARK: - Keychain Keys
    private let accessTokenKey = "com.lifenexus.accessToken"
    private let refreshTokenKey = "com.lifenexus.refreshToken"
    private let userDataKey = "com.lifenexus.userData"
    
    private init() {}
    
    // MARK: - Public Methods
    
    /// Get current session from Keychain
    func getCurrentSession() async throws -> AuthSession? {
        guard let accessToken = getKeychainValue(for: accessTokenKey),
              let refreshToken = getKeychainValue(for: refreshTokenKey),
              let userData = getKeychainValue(for: userDataKey),
              let user = try? JSONDecoder().decode(User.self, from: Data(userData.utf8)) else {
            return nil
        }
        
        // TODO: Validate token expiration and refresh if needed
        return AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            user: user,
            expiresAt: Date().addingTimeInterval(3600) // 1 hour placeholder
        )
    }
    
    /// Sign in with email and password
    func signIn(email: String, password: String) async throws -> AuthSession {
        // Validate inputs
        guard !email.isEmpty, !password.isEmpty else {
            throw AuthError.invalidCredentials
        }
        
        guard email.contains("@") else {
            throw AuthError.invalidEmail
        }
        
        // TODO: Replace with actual Supabase auth call
        /*
        let response = try await supabase.auth.signIn(
            email: email,
            password: password
        )
        */
        
        // Placeholder - simulate successful login
        let mockUser = User(
            id: UUID(),
            email: email,
            fullName: "Test User",
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        let session = AuthSession(
            accessToken: "mock_access_token",
            refreshToken: "mock_refresh_token",
            user: mockUser,
            expiresAt: Date().addingTimeInterval(3600)
        )
        
        // Save to Keychain
        try saveSession(session)
        
        return session
    }
    
    /// Register new user
    func register(email: String, password: String, fullName: String) async throws -> AuthSession {
        // Validate inputs
        guard !email.isEmpty, !password.isEmpty else {
            throw AuthError.invalidCredentials
        }
        
        guard email.contains("@") else {
            throw AuthError.invalidEmail
        }
        
        guard password.count >= 8 else {
            throw AuthError.weakPassword
        }
        
        // TODO: Replace with actual Supabase auth call
        /*
        let response = try await supabase.auth.signUp(
            email: email,
            password: password,
            data: ["full_name": fullName]
        )
        */
        
        // Placeholder - simulate successful registration
        let mockUser = User(
            id: UUID(),
            email: email,
            fullName: fullName,
            avatarUrl: nil,
            createdAt: Date(),
            updatedAt: Date()
        )
        
        let session = AuthSession(
            accessToken: "mock_access_token",
            refreshToken: "mock_refresh_token",
            user: mockUser,
            expiresAt: Date().addingTimeInterval(3600)
        )
        
        // Save to Keychain
        try saveSession(session)
        
        return session
    }
    
    /// Sign out
    func signOut() async throws {
        // TODO: Call Supabase signOut
        /*
        try await supabase.auth.signOut()
        */
        
        // Clear Keychain
        deleteKeychainValue(for: accessTokenKey)
        deleteKeychainValue(for: refreshTokenKey)
        deleteKeychainValue(for: userDataKey)
    }
    
    /// Send password reset email
    func sendPasswordReset(email: String) async throws {
        guard email.contains("@") else {
            throw AuthError.invalidEmail
        }
        
        // TODO: Implement with Supabase
        /*
        try await supabase.auth.resetPasswordForEmail(email)
        */
    }
    
    // MARK: - Private Methods
    
    private func saveSession(_ session: AuthSession) throws {
        // Save access token
        try setKeychainValue(session.accessToken, for: accessTokenKey)
        
        // Save refresh token
        try setKeychainValue(session.refreshToken, for: refreshTokenKey)
        
        // Save user data
        let userData = try JSONEncoder().encode(session.user)
        try setKeychainValue(String(data: userData, encoding: .utf8) ?? "", for: userDataKey)
    }
    
    // MARK: - Keychain Helpers
    
    private func setKeychainValue(_ value: String, for key: String) throws {
        let data = value.data(using: .utf8)!
        
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecValueData: data
        ]
        
        // Delete existing item first
        SecItemDelete(query as CFDictionary)
        
        // Add new item
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AuthError.keychainError
        }
    }
    
    private func getKeychainValue(for key: String) -> String? {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key,
            kSecReturnData: true,
            kSecMatchLimit: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }
        
        return value
    }
    
    private func deleteKeychainValue(for key: String) {
        let query: [CFString: Any] = [
            kSecClass: kSecClassGenericPassword,
            kSecAttrAccount: key
        ]
        
        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Auth Errors
enum AuthError: LocalizedError {
    case invalidCredentials
    case invalidEmail
    case weakPassword
    case userNotFound
    case sessionExpired
    case keychainError
    case networkError
    
    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Geçersiz giriş bilgileri"
        case .invalidEmail:
            return "Geçersiz e-posta adresi"
        case .weakPassword:
            return "Şifre en az 8 karakter olmalıdır"
        case .userNotFound:
            return "Kullanıcı bulunamadı"
        case .sessionExpired:
            return "Oturum süresi doldu"
        case .keychainError:
            return "Güvenli depolama hatası"
        case .networkError:
            return "Ağ bağlantısı hatası"
        }
    }
}
