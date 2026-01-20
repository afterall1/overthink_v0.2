import Foundation
import Combine

/// Global application state using @Observable pattern
@MainActor
class AppState: ObservableObject {
    // MARK: - Published Properties
    @Published var isLoading: Bool = true
    @Published var isAuthenticated: Bool = false
    @Published var currentUser: User?
    @Published var errorMessage: String?
    
    // MARK: - Services
    private let authService = AuthService.shared
    
    // MARK: - Initialization
    init() {
        // Initial state
    }
    
    // MARK: - Auth Methods
    
    /// Check current authentication state
    func checkAuthState() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            if let session = try await authService.getCurrentSession() {
                currentUser = session.user
                isAuthenticated = true
            } else {
                isAuthenticated = false
                currentUser = nil
            }
        } catch {
            print("Auth state check failed: \(error.localizedDescription)")
            isAuthenticated = false
            currentUser = nil
        }
    }
    
    /// Sign in with email and password
    func signIn(email: String, password: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let session = try await authService.signIn(email: email, password: password)
            currentUser = session.user
            isAuthenticated = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }
    }
    
    /// Register new user
    func register(email: String, password: String, fullName: String) async throws {
        isLoading = true
        defer { isLoading = false }
        
        do {
            let session = try await authService.register(
                email: email,
                password: password,
                fullName: fullName
            )
            currentUser = session.user
            isAuthenticated = true
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
            throw error
        }
    }
    
    /// Sign out
    func signOut() async {
        isLoading = true
        defer { isLoading = false }
        
        do {
            try await authService.signOut()
            currentUser = nil
            isAuthenticated = false
        } catch {
            print("Sign out failed: \(error.localizedDescription)")
        }
    }
    
    /// Clear error message
    func clearError() {
        errorMessage = nil
    }
}
