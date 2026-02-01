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
import {
  seedTestData,
  seedSecondCompanyTestData,
  seedTestCompanies,
  testCompanies,
  TEST_COMPANY_1_ID,
  TEST_COMPANY_2_ID,
} from '../db/seedTestData';
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
const PRODUCTION_COMPANIES_BACKUP_KEY = 'faturinha-production-companies-backup';
const PRODUCTION_ACTIVE_COMPANY_BACKUP_KEY =
  'faturinha-production-active-company-backup';
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
  // Also create default company for new users
  useEffect(() => {
    const ensureDefaultCompany = async (): Promise<void> => {
      // Skip if companies already exist or in test mode
      if (companies.length > 0 || isTestMode) return;

      // Create default company for users without existing companies
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
    };

    void ensureDefaultCompany();
  }, [companies.length, isTestMode]);

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
    // Backup production companies before entering test mode
    const currentCompanies = localStorage.getItem(COMPANIES_KEY);
    const currentActiveCompany = localStorage.getItem(ACTIVE_COMPANY_KEY);
    if (currentCompanies) {
      localStorage.setItem(PRODUCTION_COMPANIES_BACKUP_KEY, currentCompanies);
    }
    if (currentActiveCompany) {
      localStorage.setItem(
        PRODUCTION_ACTIVE_COMPANY_BACKUP_KEY,
        currentActiveCompany
      );
    }

    localStorage.setItem(TEST_MODE_KEY, 'true');

    // Seed test companies in localStorage
    seedTestCompanies();
    setCompanies(testCompanies);
    setActiveCompanyId(TEST_COMPANY_1_ID);

    setIsTestMode(true);

    // Seed first company's test database
    const testDb1 = createDatabase(`FaturinhaTestDB-${TEST_COMPANY_1_ID}`);
    const settings1Count = await testDb1.settings.count();
    if (settings1Count === 0) {
      await seedTestData(testDb1);
    }

    // Seed second company's test database
    const testDb2 = createDatabase(`FaturinhaTestDB-${TEST_COMPANY_2_ID}`);
    const settings2Count = await testDb2.settings.count();
    if (settings2Count === 0) {
      await seedSecondCompanyTestData(testDb2);
    }

    // Force db recreation
    setDbVersion((v) => v + 1);
  }, []);

  const exitTestMode = useCallback((): void => {
    localStorage.removeItem(TEST_MODE_KEY);
    setIsTestMode(false);

    // Restore production companies from backup
    const backupCompanies = localStorage.getItem(
      PRODUCTION_COMPANIES_BACKUP_KEY
    );
    const backupActiveCompany = localStorage.getItem(
      PRODUCTION_ACTIVE_COMPANY_BACKUP_KEY
    );

    if (backupCompanies) {
      // Restore to main storage
      localStorage.setItem(COMPANIES_KEY, backupCompanies);
      localStorage.removeItem(PRODUCTION_COMPANIES_BACKUP_KEY);
    }
    if (backupActiveCompany) {
      localStorage.setItem(ACTIVE_COMPANY_KEY, backupActiveCompany);
      localStorage.removeItem(PRODUCTION_ACTIVE_COMPANY_BACKUP_KEY);
    }

    // Reload from localStorage
    const productionCompanies = loadCompanies();
    setCompanies(productionCompanies);

    // Restore active company
    const savedActiveId = loadActiveCompanyId();
    if (
      savedActiveId &&
      productionCompanies.some((c) => c.id === savedActiveId)
    ) {
      setActiveCompanyId(savedActiveId);
    } else if (productionCompanies.length > 0) {
      setActiveCompanyId(productionCompanies[0].id);
    } else {
      setActiveCompanyId(null);
    }

    // Force db recreation
    setDbVersion((v) => v + 1);
  }, []);

  const resetTestData = useCallback(async (): Promise<void> => {
    if (!isTestMode) return;

    // Reset test companies in localStorage
    seedTestCompanies();
    setCompanies(testCompanies);
    setActiveCompanyId(TEST_COMPANY_1_ID);

    // Clear and re-seed first company's test data
    const testDb1 = createDatabase(`FaturinhaTestDB-${TEST_COMPANY_1_ID}`);
    await testDb1.invoices.clear();
    await testDb1.clients.clear();
    await testDb1.ledgers.clear();
    await testDb1.settings.clear();
    await seedTestData(testDb1);

    // Clear and re-seed second company's test data
    const testDb2 = createDatabase(`FaturinhaTestDB-${TEST_COMPANY_2_ID}`);
    await testDb2.invoices.clear();
    await testDb2.clients.clear();
    await testDb2.ledgers.clear();
    await testDb2.settings.clear();
    await seedSecondCompanyTestData(testDb2);

    // Force re-render by incrementing db version
    setDbVersion((v) => v + 1);
  }, [isTestMode]);

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
