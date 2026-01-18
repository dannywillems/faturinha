import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  useEffect,
  type ReactNode,
  type ReactElement,
} from 'react';
import { createDatabase, type AppDatabase } from '../db';
import { seedTestData } from '../db/seedTestData';
import type { Company } from '../types';

interface TestModeContextType {
  isTestMode: boolean;
  db: AppDatabase;
  enterTestMode: () => Promise<void>;
  exitTestMode: () => void;
  resetTestData: () => Promise<void>;
  // Multi-company support
  companies: Company[];
  activeCompany: Company | null;
  createCompany: (name: string) => Promise<Company>;
  switchCompany: (companyId: string) => void;
  updateCompany: (companyId: string, name: string) => void;
  deleteCompany: (companyId: string) => Promise<void>;
}

const TEST_MODE_KEY = 'faturinha-test-mode';
const COMPANIES_KEY = 'faturinha-companies';
const ACTIVE_COMPANY_KEY = 'faturinha-active-company';
const DEFAULT_COMPANY_ID = 'default';

function generateUUID(): string {
  return crypto.randomUUID();
}

function loadCompanies(): Company[] {
  try {
    const stored = localStorage.getItem(COMPANIES_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.map((c: Company) => ({
        ...c,
        createdAt: new Date(c.createdAt),
      }));
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveCompanies(companies: Company[]): void {
  localStorage.setItem(COMPANIES_KEY, JSON.stringify(companies));
}

function loadActiveCompanyId(): string | null {
  return localStorage.getItem(ACTIVE_COMPANY_KEY);
}

function saveActiveCompanyId(companyId: string): void {
  localStorage.setItem(ACTIVE_COMPANY_KEY, companyId);
}

const TestModeContext = createContext<TestModeContextType | null>(null);

interface TestModeProviderProps {
  children: ReactNode;
}

export function TestModeProvider({
  children,
}: TestModeProviderProps): ReactElement {
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    return localStorage.getItem(TEST_MODE_KEY) === 'true';
  });

  const [companies, setCompanies] = useState<Company[]>(loadCompanies);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(
    loadActiveCompanyId
  );

  // Track a version to force db recreation
  const [dbVersion, setDbVersion] = useState(0);

  // Migration: check if user has existing data and create default company
  useEffect(() => {
    const migrateExistingData = async (): Promise<void> => {
      // Skip if companies already exist
      if (companies.length > 0) return;

      // Check if old database exists with data
      const oldDb = createDatabase('FaturinhaDB');
      const [clientsCount, invoicesCount, settingsCount] = await Promise.all([
        oldDb.clients.count(),
        oldDb.invoices.count(),
        oldDb.settings.count(),
      ]);

      if (clientsCount > 0 || invoicesCount > 0 || settingsCount > 0) {
        // Create default company for existing data
        const defaultCompany: Company = {
          id: DEFAULT_COMPANY_ID,
          name: 'My Business',
          createdAt: new Date(),
        };
        const newCompanies = [defaultCompany];
        setCompanies(newCompanies);
        saveCompanies(newCompanies);
        setActiveCompanyId(DEFAULT_COMPANY_ID);
        saveActiveCompanyId(DEFAULT_COMPANY_ID);
      }
    };

    migrateExistingData();
  }, [companies.length]);

  // Find active company object
  const activeCompany = useMemo((): Company | null => {
    if (!activeCompanyId) return null;
    return companies.find((c) => c.id === activeCompanyId) ?? null;
  }, [companies, activeCompanyId]);

  // Build database name based on test mode and company
  const dbName = useMemo((): string => {
    const prefix = isTestMode ? 'FaturinhaTestDB' : 'FaturinhaDB';
    // For backward compatibility: if no company or default company, use original name
    if (!activeCompanyId || activeCompanyId === DEFAULT_COMPANY_ID) {
      return prefix;
    }
    return `${prefix}-${activeCompanyId}`;
  }, [isTestMode, activeCompanyId]);

  // Create database using useMemo to avoid effect setState issues
  const db = useMemo<AppDatabase>(() => {
    return createDatabase(dbName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dbName, dbVersion]);

  const enterTestMode = useCallback(async (): Promise<void> => {
    localStorage.setItem(TEST_MODE_KEY, 'true');
    setIsTestMode(true);

    // Seed test data if entering test mode for the first time
    const testDbName =
      !activeCompanyId || activeCompanyId === DEFAULT_COMPANY_ID
        ? 'FaturinhaTestDB'
        : `FaturinhaTestDB-${activeCompanyId}`;
    const testDb = createDatabase(testDbName);
    const settingsCount = await testDb.settings.count();
    if (settingsCount === 0) {
      await seedTestData(testDb);
    }
  }, [activeCompanyId]);

  const exitTestMode = useCallback((): void => {
    localStorage.removeItem(TEST_MODE_KEY);
    setIsTestMode(false);
  }, []);

  const resetTestData = useCallback(async (): Promise<void> => {
    if (!isTestMode) return;

    // Clear all test data
    const testDbName =
      !activeCompanyId || activeCompanyId === DEFAULT_COMPANY_ID
        ? 'FaturinhaTestDB'
        : `FaturinhaTestDB-${activeCompanyId}`;
    const testDb = createDatabase(testDbName);
    await testDb.invoices.clear();
    await testDb.clients.clear();
    await testDb.ledgers.clear();
    await testDb.settings.clear();

    // Re-seed with fresh test data
    await seedTestData(testDb);

    // Force re-render by incrementing db version
    setDbVersion((v) => v + 1);
  }, [isTestMode, activeCompanyId]);

  // Company management functions
  const createCompany = useCallback(
    async (name: string): Promise<Company> => {
      const newCompany: Company = {
        id: generateUUID(),
        name,
        createdAt: new Date(),
      };

      const newCompanies = [...companies, newCompany];
      setCompanies(newCompanies);
      saveCompanies(newCompanies);

      // If this is the first company, make it active
      if (companies.length === 0) {
        setActiveCompanyId(newCompany.id);
        saveActiveCompanyId(newCompany.id);
      }

      return newCompany;
    },
    [companies]
  );

  const switchCompany = useCallback((companyId: string): void => {
    setActiveCompanyId(companyId);
    saveActiveCompanyId(companyId);
    // Force db recreation
    setDbVersion((v) => v + 1);
  }, []);

  const updateCompany = useCallback(
    (companyId: string, name: string): void => {
      const newCompanies = companies.map((c) =>
        c.id === companyId ? { ...c, name } : c
      );
      setCompanies(newCompanies);
      saveCompanies(newCompanies);
    },
    [companies]
  );

  const deleteCompany = useCallback(
    async (companyId: string): Promise<void> => {
      // Don't allow deleting the last company
      if (companies.length <= 1) {
        throw new Error('Cannot delete the last company');
      }

      // Delete the company's database
      const dbToDelete =
        companyId === DEFAULT_COMPANY_ID
          ? 'FaturinhaDB'
          : `FaturinhaDB-${companyId}`;
      const testDbToDelete =
        companyId === DEFAULT_COMPANY_ID
          ? 'FaturinhaTestDB'
          : `FaturinhaTestDB-${companyId}`;

      try {
        await indexedDB.deleteDatabase(dbToDelete);
        await indexedDB.deleteDatabase(testDbToDelete);
      } catch {
        // Ignore deletion errors
      }

      // Remove from companies list
      const newCompanies = companies.filter((c) => c.id !== companyId);
      setCompanies(newCompanies);
      saveCompanies(newCompanies);

      // If deleting active company, switch to first available
      if (activeCompanyId === companyId && newCompanies.length > 0) {
        setActiveCompanyId(newCompanies[0].id);
        saveActiveCompanyId(newCompanies[0].id);
        setDbVersion((v) => v + 1);
      }
    },
    [companies, activeCompanyId]
  );

  return (
    <TestModeContext.Provider
      value={{
        isTestMode,
        db,
        enterTestMode,
        exitTestMode,
        resetTestData,
        companies,
        activeCompany,
        createCompany,
        switchCompany,
        updateCompany,
        deleteCompany,
      }}
    >
      {children}
    </TestModeContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTestMode(): TestModeContextType {
  const context = useContext(TestModeContext);
  if (!context) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
}

// Hook to get the current database instance
// eslint-disable-next-line react-refresh/only-export-components
export function useDb(): AppDatabase {
  const { db } = useTestMode();
  return db;
}

// Hook for company management
// eslint-disable-next-line react-refresh/only-export-components
export function useCompany(): {
  companies: Company[];
  activeCompany: Company | null;
  createCompany: (name: string) => Promise<Company>;
  switchCompany: (companyId: string) => void;
  updateCompany: (companyId: string, name: string) => void;
  deleteCompany: (companyId: string) => Promise<void>;
} {
  const {
    companies,
    activeCompany,
    createCompany,
    switchCompany,
    updateCompany,
    deleteCompany,
  } = useTestMode();
  return {
    companies,
    activeCompany,
    createCompany,
    switchCompany,
    updateCompany,
    deleteCompany,
  };
}
