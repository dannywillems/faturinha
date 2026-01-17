import {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
  type ReactNode,
  type ReactElement,
} from 'react';
import { createDatabase, type AppDatabase } from '../db';
import { seedTestData } from '../db/seedTestData';

interface TestModeContextType {
  isTestMode: boolean;
  db: AppDatabase;
  enterTestMode: () => Promise<void>;
  exitTestMode: () => void;
  resetTestData: () => Promise<void>;
}

const TEST_MODE_KEY = 'faturinha-test-mode';

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

  // Track a version to force db recreation
  const [dbVersion, setDbVersion] = useState(0);

  // Create database using useMemo to avoid effect setState issues
  const db = useMemo<AppDatabase>(() => {
    const dbName = isTestMode ? 'FaturinhaTestDB' : 'FaturinhaDB';
    return createDatabase(dbName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestMode, dbVersion]);

  const enterTestMode = useCallback(async (): Promise<void> => {
    localStorage.setItem(TEST_MODE_KEY, 'true');
    setIsTestMode(true);

    // Seed test data if entering test mode for the first time
    const testDb = createDatabase('FaturinhaTestDB');
    const settingsCount = await testDb.settings.count();
    if (settingsCount === 0) {
      await seedTestData(testDb);
    }
  }, []);

  const exitTestMode = useCallback((): void => {
    localStorage.removeItem(TEST_MODE_KEY);
    setIsTestMode(false);
  }, []);

  const resetTestData = useCallback(async (): Promise<void> => {
    if (!isTestMode) return;

    // Clear all test data
    const testDb = createDatabase('FaturinhaTestDB');
    await testDb.invoices.clear();
    await testDb.clients.clear();
    await testDb.ledgers.clear();
    await testDb.settings.clear();

    // Re-seed with fresh test data
    await seedTestData(testDb);

    // Force re-render by incrementing db version
    setDbVersion((v) => v + 1);
  }, [isTestMode]);

  return (
    <TestModeContext.Provider
      value={{
        isTestMode,
        db,
        enterTestMode,
        exitTestMode,
        resetTestData,
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
