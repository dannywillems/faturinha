import { useState, useCallback, useEffect, useMemo } from 'react';
import type { InvoiceStatus, QuoteStatus, DocumentType } from '../types';

export type SortField =
  | 'issueDate'
  | 'dueDate'
  | 'total'
  | 'clientName'
  | 'invoiceNumber';

export type SortDirection = 'asc' | 'desc';

export type DateRangeField = 'issueDate' | 'dueDate';

export interface InvoiceFilters {
  documentType: 'all' | DocumentType;
  statuses: Array<InvoiceStatus | QuoteStatus>;
  clientId: number | null;
  dateRange: {
    field: DateRangeField;
    from: string | null;
    to: string | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
}

export interface InvoiceSorting {
  field: SortField;
  direction: SortDirection;
}

export interface InvoiceFiltersState {
  filters: InvoiceFilters;
  sorting: InvoiceSorting;
}

const STORAGE_KEY = 'faturinha-invoice-filters';

const DEFAULT_FILTERS: InvoiceFilters = {
  documentType: 'all',
  statuses: [],
  clientId: null,
  dateRange: {
    field: 'issueDate',
    from: null,
    to: null,
  },
  amountRange: {
    min: null,
    max: null,
  },
};

const DEFAULT_SORTING: InvoiceSorting = {
  field: 'issueDate',
  direction: 'desc',
};

function loadFromStorage(): InvoiceFiltersState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored) as InvoiceFiltersState;
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

function saveToStorage(state: InvoiceFiltersState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

export interface UseInvoiceFiltersReturn {
  filters: InvoiceFilters;
  sorting: InvoiceSorting;
  activeFilterCount: number;
  setDocumentType: (type: 'all' | DocumentType) => void;
  toggleStatus: (status: InvoiceStatus | QuoteStatus) => void;
  setStatuses: (statuses: Array<InvoiceStatus | QuoteStatus>) => void;
  setClientId: (clientId: number | null) => void;
  setDateRangeField: (field: DateRangeField) => void;
  setDateFrom: (date: string | null) => void;
  setDateTo: (date: string | null) => void;
  setAmountMin: (amount: number | null) => void;
  setAmountMax: (amount: number | null) => void;
  setSortField: (field: SortField) => void;
  setSortDirection: (direction: SortDirection) => void;
  toggleSortDirection: () => void;
  clearFilters: () => void;
}

export function useInvoiceFilters(): UseInvoiceFiltersReturn {
  const [filters, setFilters] = useState<InvoiceFilters>(() => {
    const stored = loadFromStorage();
    return stored?.filters ?? DEFAULT_FILTERS;
  });

  const [sorting, setSorting] = useState<InvoiceSorting>(() => {
    const stored = loadFromStorage();
    return stored?.sorting ?? DEFAULT_SORTING;
  });

  // Persist to localStorage on changes
  useEffect(() => {
    saveToStorage({ filters, sorting });
  }, [filters, sorting]);

  // Calculate active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;

    if (filters.documentType !== 'all') count++;
    if (filters.statuses.length > 0) count++;
    if (filters.clientId !== null) count++;
    if (filters.dateRange.from !== null || filters.dateRange.to !== null)
      count++;
    if (filters.amountRange.min !== null || filters.amountRange.max !== null)
      count++;

    return count;
  }, [filters]);

  const setDocumentType = useCallback((type: 'all' | DocumentType) => {
    setFilters((prev) => ({
      ...prev,
      documentType: type,
      // Clear statuses when changing document type to avoid invalid combinations
      statuses: [],
    }));
  }, []);

  const toggleStatus = useCallback((status: InvoiceStatus | QuoteStatus) => {
    setFilters((prev) => {
      const isSelected = prev.statuses.includes(status);
      return {
        ...prev,
        statuses: isSelected
          ? prev.statuses.filter((s) => s !== status)
          : [...prev.statuses, status],
      };
    });
  }, []);

  const setStatuses = useCallback(
    (statuses: Array<InvoiceStatus | QuoteStatus>) => {
      setFilters((prev) => ({ ...prev, statuses }));
    },
    []
  );

  const setClientId = useCallback((clientId: number | null) => {
    setFilters((prev) => ({ ...prev, clientId }));
  }, []);

  const setDateRangeField = useCallback((field: DateRangeField) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { ...prev.dateRange, field },
    }));
  }, []);

  const setDateFrom = useCallback((date: string | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { ...prev.dateRange, from: date },
    }));
  }, []);

  const setDateTo = useCallback((date: string | null) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: { ...prev.dateRange, to: date },
    }));
  }, []);

  const setAmountMin = useCallback((amount: number | null) => {
    setFilters((prev) => ({
      ...prev,
      amountRange: { ...prev.amountRange, min: amount },
    }));
  }, []);

  const setAmountMax = useCallback((amount: number | null) => {
    setFilters((prev) => ({
      ...prev,
      amountRange: { ...prev.amountRange, max: amount },
    }));
  }, []);

  const setSortField = useCallback((field: SortField) => {
    setSorting((prev) => ({ ...prev, field }));
  }, []);

  const setSortDirection = useCallback((direction: SortDirection) => {
    setSorting((prev) => ({ ...prev, direction }));
  }, []);

  const toggleSortDirection = useCallback(() => {
    setSorting((prev) => ({
      ...prev,
      direction: prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return {
    filters,
    sorting,
    activeFilterCount,
    setDocumentType,
    toggleStatus,
    setStatuses,
    setClientId,
    setDateRangeField,
    setDateFrom,
    setDateTo,
    setAmountMin,
    setAmountMax,
    setSortField,
    setSortDirection,
    toggleSortDirection,
    clearFilters,
  };
}
