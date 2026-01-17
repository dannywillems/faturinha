import {
  createContext,
  useContext,
  useState,
  useEffect,
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

  const [db, setDb] = useState<AppDatabase>(() =>
    createDatabase(isTestMode ? 'FaturinhaTestDB' : 'FaturinhaDB')
  );

  // Recreate database when mode changes
  useEffect(() => {
    const dbName = isTestMode ? 'FaturinhaTestDB' : 'FaturinhaDB';
    const newDb = createDatabase(dbName);
    setDb(newDb);
  }, [isTestMode]);

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

    // Force re-render by creating new db instance
    setDb(createDatabase('FaturinhaTestDB'));
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

export function useTestMode(): TestModeContextType {
  const context = useContext(TestModeContext);
  if (!context) {
    throw new Error('useTestMode must be used within a TestModeProvider');
  }
  return context;
}

// Hook to get the current database instance
export function useDb(): AppDatabase {
  const { db } = useTestMode();
  return db;
}
