import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  name: string;
  role: 'guest' | 'admin';
}

interface AuthContextType {
  user: User | null;
  login: (name: string, role: 'guest' | 'admin') => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);

  // ⏪ Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // ✅ Save user on login
  const login = (name: string, role: 'guest' | 'admin') => {
    const newUser = { name, role };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  // 🧹 Clear on logout
  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('accessToken'); // also clear token
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
